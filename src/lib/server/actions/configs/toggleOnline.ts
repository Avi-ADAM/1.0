
import type { ActionConfig } from '../types.js';

/**
 * Toggle user online availability status.
 * Can be global (all meetings) or specific to one meeting.
 */
export const toggleOnlineConfig: ActionConfig = {
    key: 'toggleOnline',
    description: 'Toggle user online availability status for meetings',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        const { status, meetingId } = params; // status: boolean, meetingId?: string
        const userId = context.userId;

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
        const updatePromises = targets.map((pu: any) => {
            return strapi.execute(
                '22setOnline',
                { id: pu.id, online: status },
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
        const myName = ctx.username || 'A participant';

        if (notifier) {
            for (const target of targets) {
                const meeting = target.attributes.pgishas?.data?.[0]; // Assuming 1-to-1 now per pgishauser
                if (!meeting) continue;

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
                // We trust the targets we just updated for our own status, but need others from Strapi
                const onlineCount = participants.filter((p: any) => {
                    const isMe = p.attributes.users_permissions_user?.data?.id === userId;
                    return isMe ? status : p.attributes.available === true;
                }).length;

                const allOnline = onlineCount === participants.length && participants.length > 1;

                if (otherUserIds.length > 0) {
                    await notifier.notify(
                        {
                            recipients: { type: 'specificUsers', config: { userIdsParam: 'others' } },
                            templates: {
                                title: {
                                    he: status ? '🤝 משתתף זמין לפגישה!' : '💤 משתתף כבר לא זמין',
                                    en: status ? '🤝 Participant is available!' : '💤 Participant is unavailable'
                                },
                                body: {
                                    he: `${myName} ${status ? 'פנוי/ה כעת' : 'כבר לא פנוי/ה'} לפגישה: ${mName}`,
                                    en: `${myName} is now ${status ? 'available' : 'unavailable'} for: ${mName}`
                                }
                            },
                            channels: ['socket'],
                            metadata: {
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

                    if (allOnline && status === true) {
                        // Update meeting overall availability
                        await strapi.execute(
                            'updateMeetingAvailability',
                            { id: mId, available: true },
                            context.jwt,
                            context.fetch
                        );

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
                                channels: ['socket', 'push'],
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
        }

        return {
            success: true,
            status: status,
            meetingId: meetingId || 'global',
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
        meetingId: { type: 'string', required: false }
    },
    authRules: [{ type: 'jwt' }],
    updateStrategy: { type: 'partialUpdate', config: {} }
};
