
import type { ActionConfig } from '../types.js';

export const approveMeetingConfig: ActionConfig = {
    key: 'approveMeeting',
    description: 'Approve a pending meeting request',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        const { pendId, pgishaId } = params;
        const userId = context.userId;
        const d = new Date();
        const publishedAt = d.toISOString();

        // 1. Approve pending meeting (and archive it)
        await strapi.execute(
            '54ApprovePendMeeting',
            { id: pendId },
            context.jwt,
            context.fetch
        );

        // 2. Create User Meeting
        const uidLink = encodeURIComponent('meeting-' + pgishaId + '-' + userId);
        const createResult = await strapi.execute(
            '20CreateUserMeeting',
            { id: userId, pgishaId, uid: uidLink, publishedAt },
            context.jwt,
            context.fetch
        );

        if (createResult.errors) {
            throw new Error('Failed to create user meeting');
        }

        // 3. Check Status & Notify
        try {
            const statusRes = await strapi.execute(
                '55CheckMeetingStatus',
                { pgishaId },
                context.jwt,
                context.fetch
            );

            const pgisha = statusRes?.data?.pgisha?.data?.attributes;

            if (pgisha && notifier) {
                const pends = pgisha.pgishauserpends?.data || [];
                const users = pgisha.pgishausers?.data || [];

                // Extract user IDs and details
                const currentParticipants = users
                    .map((u: any) => u.attributes.users_permissions_user.data)
                    .filter((u: any) => !!u);

                const participantIds = currentParticipants.map((u: any) => u.id);
                // The newly added user is usually in this list because we just added them in step 2.
                // But if step 2 isn't reflected yet in query (due to race/consistency), we might need to assume it.
                // Usually Strapi is sequential enough or we can assume `userId` is in.
                // Let's ensure current `userId` is treated as a participant.
                if (!participantIds.includes(userId)) {
                    participantIds.push(userId);
                    // Add partial user object for notification logic if needed (though not strictly required if we just use IDs)
                }

                const otherIds = participantIds.filter((id: string) => id !== userId);

                // Notify others that this user joined
                if (otherIds.length > 0) {
                    await notifier.notify(
                        {
                            recipients: { type: 'specificUsers', config: { userIdsParam: 'others' } },
                            templates: {
                                title: { he: 'משתתף חדש הצטרף לפגישה', en: 'New participant joined the meeting' },
                                body: {
                                    he: `משתתף נוסף אישר את הפגישה: ${pgisha.name}`,
                                    en: `Another participant approved the meeting: ${pgisha.name}`
                                }
                            },
                            channels: ['socket', 'push'],
                            metadata: {
                                url: '/meeting/' + pgishaId,
                                type: 'meetingUpdate',
                                meetingId: pgishaId
                            }
                        },
                        { ...params, others: otherIds },
                        createResult,
                        context
                    );
                }

                // Check if ALL approved (pends is empty)
                // Note: user said "update *only* if all participants confirmed".
                // Since we filtered `archived: { ne: true }`, any remaining items are pending.
                // If length is 0, everyone approved (or was archived).
                if (pends.length === 0 && !pgisha.set) {
                    // 4. Set Meeting as SET
                    await strapi.execute(
                        '56SetMeetingSet',
                        { id: pgishaId },
                        context.jwt,
                        context.fetch
                    );

                    // 5. Notify EVERYONE that meeting is SET
                    // We notify all participants (including current user)
                    await notifier.notify(
                        {
                            recipients: { type: 'specificUsers', config: { userIdsParam: 'allUsers' } },
                            templates: {
                                title: { he: 'הפגישה אושרה סופית!', en: 'Meeting Confirmed!' },
                                body: {
                                    he: `כל המשתתפים אישרו את הפגישה: ${pgisha.name}. הפגישה נקבעה. כעת בכל זמן בו יש לך זמן להשתתף בפגישה, ביכולתך לעדכן סטטוס אונליין באתר ואנו נמצא עבורך את הזמן הכי מתאים לפגישה`,
                                    en: `All participants approved the meeting: ${pgisha.name}. The meeting is set. Now, for every time you have available to join the meeting, you can update your status online on the site and we will find the most suitable time for the meeting.`
                                }
                            },
                            channels: ['socket', 'email', 'push'],
                            metadata: {
                                url: '/meeting/' + pgishaId,
                                type: 'meetingConfirmed',
                                meetingId: pgishaId
                            }
                        },
                        { ...params, allUsers: participantIds },
                        createResult,
                        context
                    );
                }
            }
        } catch (err) {
            console.error('[approveMeeting] Failed to check status or notify:', err);
            // Don't fail the main action if notification/check fails, meeting is still approved for this user.
        }

        return createResult;
    },
    paramSchema: {
        pendId: { type: 'string', required: true },
        pgishaId: { type: 'string', required: true }
    },
    authRules: [
        { type: 'jwt' }
    ],
    updateStrategy: {
        type: 'partialUpdate',
        config: {}
    }
};
