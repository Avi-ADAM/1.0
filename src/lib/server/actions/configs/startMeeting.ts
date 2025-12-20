
import type { ActionConfig } from '../types.js';

/**
 * Request to start a meeting - initiates the "ready check" phase
 * 
 * Flow:
 * 1. User clicks "Start Meeting"
 * 2. Meeting enters pendingStart state
 * 3. All other participants get notification to confirm
 * 4. When all confirm (via joinMeeting action) → meeting goes live
 */
export const startMeetingConfig: ActionConfig = {
    key: 'startMeeting',
    description: 'Request to start a meeting - initiates ready check for all participants',
    graphqlOperation: async (params, context, { strapi, notifier }) => {
        const { meetingId, videoLink } = params;
        const userId = context.userId;
        const publishedAt = new Date().toISOString();

        // 1. Get meeting details to get participant IDs
        const meetingRes = await strapi.execute(
            '59GetMeetingDetails',
            { id: meetingId },
            context.jwt,
            context.fetch
        );

        const meeting = meetingRes?.data?.pgisha?.data;
        if (!meeting) {
            throw new Error('Meeting not found');
        }

        const meetingName = meeting.attributes.name;
        const isAvailable = meeting.attributes.available;

        // Check if meeting is available (all participants online)
        if (!isAvailable) {
            throw new Error('Meeting is not available yet - not all participants are online');
        }

        // Check if meeting is already live
        if (meeting.attributes.isLive) {
            throw new Error('Meeting is already live');
        }

        // Check if meeting is already pending start
        if (meeting.attributes.pendingStart) {
            throw new Error('Meeting start is already pending - waiting for participants to confirm');
        }

        // Get participant user IDs and pgishauser IDs
        const participants = meeting.attributes.pgishausers?.data || [];
        const participantUserIds = participants
            .map((p: any) => p.attributes.users_permissions_user?.data?.id)
            .filter((id: string) => !!id);

        const pgishauserIds = participants.map((p: any) => p.id);

        // 2. Create a forum for this meeting (prepare it)
        const forumRes = await strapi.execute(
            '58CreateMeetingForum',
            {
                pgishaId: meetingId,
                publishedAt
            },
            context.jwt,
            context.fetch
        );

        if (forumRes.errors) {
            console.error('Failed to create forum:', forumRes.errors);
            throw new Error('Failed to create meeting forum');
        }

        const forumId = forumRes?.data?.createForum?.data?.id;

        // 3. Mark meeting as pending start (NOT live yet)
        const startRes = await strapi.execute(
            '61RequestMeetingStart',
            {
                id: meetingId,
                videoLink: videoLink,
                pendingStart: true,
                startRequestedAt: publishedAt,
                startRequestedBy: userId,
                forum: forumId
            },
            context.jwt,
            context.fetch
        );

        if (startRes.errors) {
            console.error('Failed to request meeting start:', startRes.errors);
            throw new Error('Failed to request meeting start');
        }

        // 4. Mark the initiator as ready (they requested it, so they're ready)
        const myPgishauserId = participants.find(
            (p: any) => p.attributes.users_permissions_user?.data?.id === userId
        )?.id;

        if (myPgishauserId) {
            await strapi.execute(
                '62SetUserReadyForStart',
                { id: myPgishauserId, ready: true },
                context.jwt,
                context.fetch
            );
        }

        // 5. Notify other participants to confirm joining
        const otherParticipantIds = participantUserIds.filter((id: string) => id !== userId);

        if (notifier && otherParticipantIds.length > 0) {
            const ctx: any = context;
            const starterName = ctx.username || 'A participant';

            await notifier.notify(
                {
                    recipients: { type: 'specificUsers', config: { userIdsParam: 'otherParticipants' } },
                    templates: {
                        title: {
                            he: '🎬 בקשה להצטרף לפגישה',
                            en: '🎬 Meeting Starting - Join Request'
                        },
                        body: {
                            he: `${starterName} מבקש/ת להתחיל את הפגישה "${meetingName}". לחץ כדי להצטרף!`,
                            en: `${starterName} wants to start the meeting "${meetingName}". Click to join!`
                        }
                    },
                    channels: ['socket', 'push'],
                    metadata: {
                        url: '/meeting/' + meetingId,
                        type: 'meetingJoinRequest',
                        meetingId: meetingId,
                        videoLink: videoLink,
                        forumId: forumId,
                        startRequestedBy: userId,
                        showToast: true,
                        priority: 'high'
                    }
                },
                { ...params, otherParticipants: otherParticipantIds },
                startRes,
                context
            );
        }

        // Check if this is a 1-on-1 meeting and the other person is already ready
        // (edge case: if somehow they're already marked ready)
        const allReady = await checkAllParticipantsReady(strapi, meetingId, context);

        if (allReady) {
            // Everyone is ready, start the meeting immediately
            return await startMeetingNow(strapi, notifier, meetingId, videoLink, forumId, participantUserIds, meetingName, context);
        }

        return {
            success: true,
            pendingStart: true,
            meeting: startRes?.data?.updatePgisha?.data,
            forumId: forumId,
            videoLink: videoLink,
            waitingFor: otherParticipantIds.length,
            toast: {
                type: 'info',
                title: context.lang === 'en' ? 'Waiting for participants...' : 'ממתין למשתתפים...',
                message: context.lang === 'en'
                    ? `Waiting for ${otherParticipantIds.length} participant(s) to confirm`
                    : `ממתין ל-${otherParticipantIds.length} משתתפ/ים לאישור`,
                duration: 5000
            }
        };
    },
    paramSchema: {
        meetingId: { type: 'string', required: true },
        videoLink: { type: 'string', required: true }
    },
    authRules: [
        { type: 'jwt' }
    ],
    updateStrategy: {
        type: 'partialUpdate',
        config: {}
    }
};

// Helper function to check if all participants are ready
async function checkAllParticipantsReady(strapi: any, meetingId: string, context: any): Promise<boolean> {
    const res = await strapi.execute(
        '63CheckMeetingReadyStatus',
        { id: meetingId },
        context.jwt,
        context.fetch
    );

    const participants = res?.data?.pgisha?.data?.attributes?.pgishausers?.data || [];
    return participants.every((p: any) => p.attributes.readyForStart === true);
}

// Helper function to actually start the meeting (set isLive = true)
async function startMeetingNow(
    strapi: any,
    notifier: any,
    meetingId: string,
    videoLink: string,
    forumId: string,
    participantUserIds: string[],
    meetingName: string,
    context: any
): Promise<any> {
    const publishedAt = new Date().toISOString();

    // Update meeting to live
    const liveRes = await strapi.execute(
        '57StartMeeting',
        {
            id: meetingId,
            videoLink: videoLink,
            isLive: true,
            meetingStartedAt: publishedAt,
            startedBy: context.userId,
            forum: forumId
        },
        context.jwt,
        context.fetch
    );

    // Also clear pendingStart
    await strapi.execute(
        '64ClearPendingStart',
        { id: meetingId },
        context.jwt,
        context.fetch
    );

    // Notify all participants that meeting is now live
    if (notifier && participantUserIds.length > 0) {
        await notifier.notify(
            {
                recipients: { type: 'specificUsers', config: { userIdsParam: 'allParticipants' } },
                templates: {
                    title: {
                        he: '🎥 הפגישה התחילה!',
                        en: '🎥 Meeting Started!'
                    },
                    body: {
                        he: `הפגישה "${meetingName}" מתחילה עכשיו! כולם מוכנים.`,
                        en: `The meeting "${meetingName}" is starting now! Everyone is ready.`
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
        meeting: liveRes?.data?.updatePgisha?.data,
        forumId: forumId,
        videoLink: videoLink,
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
