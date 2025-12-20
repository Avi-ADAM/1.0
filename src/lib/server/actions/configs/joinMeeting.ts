
import type { ActionConfig } from '../types.js';

/**
 * Join a pending meeting - confirm readiness
 * 
 * When a meeting is in pendingStart state, participants use this action
 * to confirm they're ready. When all participants confirm, the meeting goes live.
 */
export const joinMeetingConfig: ActionConfig = {
    key: 'joinMeeting',
    description: 'Confirm readiness to join a pending meeting',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        const { meetingId } = params;
        const userId = context.userId;

        // 1. Get meeting details
        const meetingRes = await strapi.execute(
            '63CheckMeetingReadyStatus',
            { id: meetingId },
            context.jwt,
            context.fetch
        );

        const meeting = meetingRes?.data?.pgisha?.data;
        if (!meeting) {
            throw new Error('Meeting not found');
        }

        const meetingName = meeting.attributes.name;
        const pendingStart = meeting.attributes.pendingStart;
        const isLive = meeting.attributes.isLive;
        const videoLink = meeting.attributes.videoLink;
        const forumId = meeting.attributes.forum?.data?.id;

        // Check if meeting is already live
        if (isLive) {
            return {
                success: true,
                alreadyLive: true,
                videoLink: videoLink,
                forumId: forumId,
                toast: {
                    type: 'info',
                    title: context.lang === 'en' ? 'Meeting is Live' : 'הפגישה פעילה',
                    message: context.lang === 'en'
                        ? 'The meeting is already live - join now!'
                        : 'הפגישה כבר פעילה - הצטרף עכשיו!',
                    duration: 3000
                }
            };
        }

        // Check if meeting is pending start
        if (!pendingStart) {
            throw new Error('Meeting is not pending start');
        }

        // 2. Find my pgishauser and mark as ready
        const participants = meeting.attributes.pgishausers?.data || [];
        const myPgishauser = participants.find(
            (p: any) => p.attributes.users_permissions_user?.data?.id === userId
        );

        if (!myPgishauser) {
            throw new Error('You are not a participant in this meeting');
        }

        // Mark myself as ready
        await strapi.execute(
            '62SetUserReadyForStart',
            { id: myPgishauser.id, ready: true },
            context.jwt,
            context.fetch
        );

        // 3. Check if all participants are now ready
        const participantUserIds = participants
            .map((p: any) => p.attributes.users_permissions_user?.data?.id)
            .filter((id: string) => !!id);

        // Re-fetch to get updated ready status
        const updatedRes = await strapi.execute(
            '63CheckMeetingReadyStatus',
            { id: meetingId },
            context.jwt,
            context.fetch
        );

        const updatedParticipants = updatedRes?.data?.pgisha?.data?.attributes?.pgishausers?.data || [];
        const allReady = updatedParticipants.every((p: any) => p.attributes.readyForStart === true);
        const readyCount = updatedParticipants.filter((p: any) => p.attributes.readyForStart === true).length;
        const totalCount = updatedParticipants.length;

        // Notify others that I'm ready
        const otherParticipantIds = participantUserIds.filter((id: string) => id !== userId);

        if (notifier && otherParticipantIds.length > 0 && !allReady) {
            const ctx: any = context;
            const joinerName = ctx.username || 'A participant';

            await notifier.notify(
                {
                    recipients: { type: 'specificUsers', config: { userIdsParam: 'otherParticipants' } },
                    templates: {
                        title: {
                            he: '✅ משתתף מוכן',
                            en: '✅ Participant Ready'
                        },
                        body: {
                            he: `${joinerName} מוכן/ה לפגישה "${meetingName}" (${readyCount}/${totalCount})`,
                            en: `${joinerName} is ready for "${meetingName}" (${readyCount}/${totalCount})`
                        }
                    },
                    channels: ['socket'],
                    metadata: {
                        type: 'participantReady',
                        meetingId: meetingId,
                        userId: userId,
                        readyCount: readyCount,
                        totalCount: totalCount
                    }
                },
                { ...params, otherParticipants: otherParticipantIds },
                updatedRes,
                context
            );
        }

        // 4. If all ready, start the meeting!
        if (allReady) {
            const publishedAt = new Date().toISOString();
            const startRequestedBy = meeting.attributes.startRequestedBy?.data?.id;

            // Update meeting to live
            const liveRes = await strapi.execute(
                '57StartMeeting',
                {
                    id: meetingId,
                    videoLink: videoLink,
                    isLive: true,
                    meetingStartedAt: publishedAt,
                    startedBy: startRequestedBy || userId,
                    forum: forumId
                },
                context.jwt,
                context.fetch
            );

            // Clear pendingStart and reset ready flags
            await strapi.execute(
                '64ClearPendingStart',
                { id: meetingId },
                context.jwt,
                context.fetch
            );

            // Reset all readyForStart flags for future meetings
            for (const p of participants) {
                await strapi.execute(
                    '62SetUserReadyForStart',
                    { id: p.id, ready: false },
                    context.jwt,
                    context.fetch
                );
            }

            // Notify all participants that meeting is now live
            if (notifier) {
                await notifier.notify(
                    {
                        recipients: { type: 'specificUsers', config: { userIdsParam: 'allParticipants' } },
                        templates: {
                            title: {
                                he: '🎥 הפגישה התחילה!',
                                en: '🎥 Meeting Started!'
                            },
                            body: {
                                he: `כולם מוכנים! הפגישה "${meetingName}" מתחילה עכשיו!`,
                                en: `Everyone is ready! The meeting "${meetingName}" is starting now!`
                            }
                        },
                        channels: ['socket', 'push', 'email'],
                        metadata: {
                            url: '/meeting/' + meetingId,
                            type: 'meetingStarted',
                            meetingId: meetingId,
                            videoLink: videoLink,
                            forumId: forumId,
                            showToast: true
                        }
                    },
                    { allParticipants: participantUserIds },
                    liveRes,
                    context
                );
            }

            return {
                success: true,
                isLive: true,
                allReady: true,
                videoLink: videoLink,
                forumId: forumId,
                toast: {
                    type: 'success',
                    title: context.lang === 'en' ? 'Meeting Started!' : 'הפגישה התחילה!',
                    message: context.lang === 'en'
                        ? 'All participants are ready - meeting is live!'
                        : 'כל המשתתפים מוכנים - הפגישה פעילה!',
                    duration: 5000
                }
            };
        }

        // Not all ready yet
        return {
            success: true,
            isReady: true,
            allReady: false,
            readyCount: readyCount,
            totalCount: totalCount,
            waitingFor: totalCount - readyCount,
            videoLink: videoLink,
            forumId: forumId,
            toast: {
                type: 'info',
                title: context.lang === 'en' ? 'Ready!' : 'מוכן!',
                message: context.lang === 'en'
                    ? `Waiting for ${totalCount - readyCount} more participant(s)...`
                    : `ממתין לעוד ${totalCount - readyCount} משתתפ/ים...`,
                duration: 3000
            }
        };
    },
    paramSchema: {
        meetingId: { type: 'string', required: true }
    },
    authRules: [
        { type: 'jwt' }
    ],
    updateStrategy: {
        type: 'partialUpdate',
        config: {}
    }
};
