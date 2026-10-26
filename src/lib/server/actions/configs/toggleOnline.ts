
import type { ActionConfig } from '../types.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

/**
 * Being available is never open-ended: people switch it on and forget, and the
 * other participants then schedule around someone who is not there. Every "on"
 * carries an `availableUntil`, and /api/cron/availability switches off what has
 * passed it — through this same action, with `autoExpired`.
 */
export const DEFAULT_AVAILABLE_MINUTES = 60;
export const MAX_AVAILABLE_MINUTES = 20 * 60;
const MIN_AVAILABLE_MINUTES = 5;

export function availableUntilFrom(durationMinutes: unknown, now = Date.now()): string {
    const n = Number(durationMinutes);
    const minutes = Number.isFinite(n) && n > 0
        ? Math.min(MAX_AVAILABLE_MINUTES, Math.max(MIN_AVAILABLE_MINUTES, Math.round(n)))
        : DEFAULT_AVAILABLE_MINUTES;
    return new Date(now + minutes * 60_000).toISOString();
}

/**
 * Toggle user online availability status.
 * Can be global (all meetings) or specific to one meeting.
 * Turning on a row that is already on only moves its `availableUntil` (an
 * extension), without telling the others again.
 */
export const toggleOnlineConfig: ActionConfig = {
    key: 'toggleOnline',
    description: 'Toggle user online availability status for meetings',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        const { status, meetingId, durationMinutes, autoExpired } = params; // status: boolean, meetingId?: string
        const userId = context.userId;
        console.log('toggleOnline', params, context);
        // 1. Get all user meeting records
        const userMeetingRes = await strapi.execute(
            '23myUserMeeting',
            { id: userId },
            context.jwt,
            context.fetch
        );

        const pgishausers = userMeetingRes?.data?.pgishausers?.data || [];

        if (pgishausers.length === 0) {
            throw new Error('No meeting profiles found for this user');
        }

        // 2. Identify which records to update
        let targets = [];
        if (meetingId) {
            // Specific meeting: find pgishauser that is linked to this meetingId
            targets = pgishausers.filter((pu: any) =>
                pu.attributes.pgishas?.data?.some((m: any) => m.id === meetingId)
            );
        } else {
            // Global: update all
            targets = pgishausers;
        }

        if (targets.length === 0) {
            throw new Error(meetingId ? 'No profile found for this specific meeting' : 'No profiles to update');
        }

        // 3. Perform updates
        const availableUntil = status ? availableUntilFrom(durationMinutes) : null;
        const updatePromises = targets.map((pu: any) => {
            return strapi.execute(
                '22setOnline',
                { id: pu.id, online: status, until: availableUntil },
                context.jwt,
                context.fetch
            );
        });

        // If going offline, also reset readyForStart for safety
        if (status === false) {
            targets.forEach((pu: any) => {
                updatePromises.push(
                    strapi.execute(
                        '62SetUserReadyForStart',
                        { id: pu.id, ready: false },
                        context.jwt,
                        context.fetch
                    )
                );
            });
        }

        const results = await Promise.all(updatePromises);
        const lastResult = results[0]; // For returning something

        // 4. Notify participants of affected meetings
        const notificationsSent = [];
        const ctx: any = context;
        // Get my name from the first user profile found (all belong to same user)
        const myName = pgishausers[0]?.attributes?.users_permissions_user?.data?.attributes?.username || ctx.username || 'A participant';

        if (notifier) {
            for (const target of targets) {
                const meeting = target.attributes.pgishas?.data?.[0]; // Assuming 1-to-1 now per pgishauser
                if (!meeting) continue;
                // An extension, or switching off what was already off: nothing changed for the others.
                if ((target.attributes.available === true) === status) continue;

                const mId = meeting.id;
                const mName = meeting.attributes.name;
                const participants = meeting.attributes.pgishausers?.data || [];

                const otherUserIds = participants
                    .map((p: any) => p.attributes.users_permissions_user?.data?.id)
                    .filter((id: string) => id && id !== userId);

                const allParticipantIds = participants
                    .map((p: any) => p.attributes.users_permissions_user?.data?.id)
                    .filter((id: string) => id);

                // Re-calculate allOnline status
                const onlineCount = participants.filter((p: any) => {
                    const pUserId = p.attributes.users_permissions_user?.data?.id;
                    const isMe = pUserId === userId;
                    // If it's me, use the new status. If someone else, use their current 'available' field.
                    return isMe ? status : p.attributes.available === true;
                }).length;

                const allOnline = onlineCount === participants.length && participants.length > 1;

                console.log(`Meeting ${mId} status: onlineCount=${onlineCount}, total=${participants.length}, allOnline=${allOnline}, userStatus=${status}`);

                // 4a. Notify others about current user's status change
                if (otherUserIds.length > 0) {
                    await notifier.notify(
                        {
                            recipients: { type: 'specificUsers', config: { userIdsParam: 'others' } },
                            templates: {
                                title: {
                                    he: status ? '✨ הזדמנות לפגישה!' : '💤 משתתף כבר לא זמין',
                                    en: status ? '✨ Meeting Opportunity!' : '💤 Participant is unavailable'
                                },
                                body: {
                                    // autoExpired: they did not switch off, their time ran out.
                                    he: status
                                        ? `${myName} פנוי/ה כעת לפגישה: ${mName}. בוא/י נתחיל!`
                                        : autoExpired
                                            ? `זמן הזמינות של ${myName} לפגישה ${mName} הסתיים`
                                            : `${myName} כבר לא פנוי/ה לפגישה: ${mName}`,
                                    en: status
                                        ? `${myName} is now available for: ${mName}`
                                        : autoExpired
                                            ? `${myName}'s availability for ${mName} has run out`
                                            : `${myName} is no longer available for: ${mName}`
                                }
                            },
                            intent: status ? 'outcome' : 'ambient',
                            metadata: {
                                url: '/meeting',
                                type: 'userAvailability',
                                meetingId: mId,
                                userId: userId,
                                status: status ? 'online' : 'offline',
                                allOnline: allOnline
                            }
                        },
                        { others: otherUserIds },
                        lastResult,
                        context
                    );
                }

                // 4b. Sync Meeting Availability
                // If status is false, the meeting is definitely NOT available (everyone must be online)
                // If status is true, we check if everyone else is also online
                const newMeetingAvailable = allOnline; // Meeting is available ONLY if ALL are online

                // Only update if it changed or if becoming available
                if (newMeetingAvailable !== meeting.attributes.available) {
                    console.log(`Updating meeting ${mId} availability to ${newMeetingAvailable}`);
                    await strapi.execute(
                        'updateMeetingAvailability',
                        { id: mId, available: newMeetingAvailable },
                        context.jwt,
                        context.fetch
                    );

                    if (newMeetingAvailable && status === true) {
                        // Notify everyone that the meeting is ready to start
                        await notifier.notify(
                            {
                                recipients: { type: 'specificUsers', config: { userIdsParam: 'allParticipants' } },
                                templates: {
                                    title: { he: '✨ כולם זמינים! הפגישה מוכנה', en: '✨ Everyone is ready!' },
                                    body: {
                                        he: `כל המשתתפים בפגישה "${mName}" זמינים כעת. אפשר להתחיל!`,
                                        en: `Everyone in "${mName}" is now available. Let's meet!`
                                    }
                                },
                                intent: 'outcome',
                                metadata: {
                                    url: '/meeting',
                                    type: 'meetingReady',
                                    meetingId: mId,
                                    allOnline: true,
                                    showToast: true
                                }
                            },
                            { allParticipants: allParticipantIds },
                            lastResult,
                            context
                        );

                        notificationsSent.push({ mId, mName });
                    }
                }
            }

            // 4c. Tell the participant themself that their availability ran out,
            // so a forgotten switch is noticed and can be turned back on.
            if (autoExpired && status === false) {
                const names = targets
                    .map((pu: any) => pu.attributes.pgishas?.data?.[0]?.attributes?.name)
                    .filter(Boolean)
                    .join(', ');
                await notifier.notify(
                    {
                        recipients: { type: 'specificUsers', config: { userIdsParam: 'self' } },
                        templates: {
                            title: { he: '⏰ הזמינות שלך כובתה אוטומטית', en: '⏰ Your availability was switched off' },
                            body: {
                                he: `הזמן שבחרת לזמינות הסתיים${names ? ` (${names})` : ''}. עדיין פנוי/ה? אפשר להדליק שוב.`,
                                en: `The time you chose has run out${names ? ` (${names})` : ''}. Still free? Switch it on again.`
                            }
                        },
                        intent: 'ambient',
                        metadata: {
                            url: '/meeting',
                            type: 'availabilityExpired',
                            userId: userId,
                            status: 'offline'
                        }
                    },
                    { self: [userId] },
                    lastResult,
                    context
                );
            }
        }

        return {
            success: true,
            status: status,
            availableUntil,
            meetingId: meetingId || 'global',
            meetingIds: targets
                .map((pu: any) => pu.attributes.pgishas?.data?.[0]?.id)
                .filter((id: unknown) => id != null)
                .map(String),
            updatedCount: targets.length,
            toast: status && notificationsSent.length > 0 ? {
                type: 'success',
                title: context.lang === 'en' ? 'Meeting Ready!' : 'פגישה מוכנה!',
                message: context.lang === 'en'
                    ? `Everyone is online for ${notificationsSent[0].mName}`
                    : `כולם אונליין לפגישה: ${notificationsSent[0].mName}`,
                duration: 5000
            } : null
        };
    },
    paramSchema: {
        status: { type: 'boolean', required: true },
        meetingId: { type: 'string', required: false },
        // How long an "on" lasts; defaults to an hour, capped at 20 hours.
        durationMinutes: { type: 'number', required: false },
        // Set only by /api/cron/availability.
        autoExpired: { type: 'boolean', required: false }
    },
    authRules: [{ type: 'jwt' }],
    updateStrategy: { type: 'partialUpdate', config: {} },

    realtime: {
        scopes: (_p, r, ctx) =>
            scopeList([scope('user', ctx.userId), ...(r?.meetingIds ?? []).map((id: string) => scope('meeting', id))]),
    },
};
