
import type { ActionConfig } from '../types.js';

export const createNewMeetingConfig: ActionConfig = {
    key: 'createNewMeeting',
    description: 'Create a new meeting and notify users',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        // 1. Prepare data
        const d = new Date();
        const publishedAt = d.toISOString();
        const { name, outpot, selected, initiatorName } = params; // selected is array of User IDs (strings)

        // 2. Create Meeting
        // QID 18: mutation($name: String!, $outpot: String, $publishedAt: DateTime) { createPgisha(...) }
        const meetingResult = await strapi.execute(
            '18createNewMeeting',
            { name, outpot, publishedAt },
            context.jwt,
            context.fetch
        );

        // Check error
        if (meetingResult.errors || !meetingResult.data?.createPgisha?.data?.id) {
            throw new Error('Failed to create meeting');
        }
        const pgishaId = meetingResult.data.createPgisha.data.id;

        // 3. Process Users
        const me = context.userId;
        const promises = selected.map(async (userId: string) => {
            if (userId !== me) {
                // Create Pending Meeting
                // QID 19: mutation($id: ID!, $pgishaId: ID!)
                await strapi.execute(
                    '19CreatePendMeeting',
                    { id: userId, pgishaId },
                    context.jwt,
                    context.fetch
                );
            } else {
                // Create User Meeting (for Creator)
                // QID 20: mutation($id: ID!, $pgishaId: ID!, $uid: String!, $publishedAt: DateTime!)
                const uidLink = encodeURIComponent('meeting-' + pgishaId + '-' + me);
                await strapi.execute(
                    '20CreateUserMeeting',
                    { id: userId, pgishaId, uid: uidLink, publishedAt },
                    context.jwt,
                    context.fetch
                );
            }
        });

        await Promise.all(promises);

        // 4. Send Notifications
        if (notifier) {
            const otherIds = selected.filter((id: string) => id !== me);

            if (otherIds.length > 0) {
                // Prepare notification data
                // Logic: "X wants to have a meeting with you [and Y others]"
                const othersCount = selected.length - 2; // -1 for me, -1 for "you"

                const title = {
                    he: `${initiatorName} רוצה לקבוע איתך פגישה`,
                    en: `${initiatorName} want to have a meeting with you`
                };

                const bodyHe = othersCount > 0
                    ? `${initiatorName} רוצה לקבוע איתך ועם עוד ${othersCount} פגישה בנושא: ${name} `
                    : `${initiatorName} רוצה לקבוע איתך פגישה בנושא: ${name} `;

                const bodyEn = othersCount > 0
                    ? `${initiatorName} want to have a meeting with you and ${othersCount} others on the subject ${name} `
                    : `${initiatorName} want to have a meeting with you on the subject ${name} `;

                const notificationData = {
                    title,
                    body: {
                        he: bodyHe,
                        en: bodyEn
                    },
                    metadata: {
                        priority: 'normal',
                        url: '/meeting/' + pgishaId,
                        type: 'meeting', // specific key for socket update
                        meetingId: pgishaId
                    }
                };

                // Use the NotificationOrchestrator to handle all channels (Socket, Email, Telegram, Push)
                const notifConfig = {
                    recipients: {
                        type: 'specificUsers',
                        config: {
                            userIdsParam: 'userIds'
                        }
                    } as any,
                    templates: {
                        title: title,
                        body: {
                            he: bodyHe,
                            en: bodyEn
                        }
                    },
                    channels: ['socket', 'email', 'telegram', 'push'] as const,
                    metadata: {
                        priority: 'normal',
                        url: '/meeting/' + pgishaId,
                        type: 'meeting',
                        meetingId: pgishaId
                    }
                };

                try {
                    console.log(`[createNewMeeting] Triggering notifications for ${otherIds.length} users`);
                    // We pass a synthetic params object with 'userIds' to match the recipients rule
                    await notifier.notify(
                        notifConfig,
                        { ...params, userIds: otherIds },
                        meetingResult,
                        context
                    );
                } catch (err) {
                    console.error('Failed to trigger notifications:', err);
                }
            }
        }

        return meetingResult;
    },
    paramSchema: {
        name: { type: 'string', required: true },
        outpot: { type: 'string', required: false }, // "outpot" is user's variable name for description
        selected: { type: 'array', required: true },
        initiatorName: { type: 'string', required: false }
    },
    authRules: [
        { type: 'jwt' }
    ],
    // We handle notifications manually in the handler
    updateStrategy: {
        type: 'partialUpdate',
        config: {
            // Trigger client update if needed
        }
    }
};
