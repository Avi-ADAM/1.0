import type { ActionConfig } from '../types.js';

export const sendAskMessageConfig: ActionConfig = {
    key: 'sendAskMessage',
    description: 'Send a message to the ask request chat',
    graphqlOperation: async (params, context, { strapi }) => {
        const { askId, content } = params;
        const userId = context.userId;
        const publishedAt = new Date().toISOString();

        if (!askId) throw new Error('Ask ID is required');
        if (!content || !content.trim()) throw new Error('Message content is required');

        // 0. Fetch Sender Details
        const userRes = await strapi.execute('24userJSONQue', { uid: userId }, context.jwt);
        const senderName = userRes?.data?.usersPermissionsUser?.data?.attributes?.username || 'User';
        const senderPic = userRes?.data?.usersPermissionsUser?.data?.attributes?.profilePic?.data?.attributes?.url;

        // 1. Fetch Ask Details
        const askRes = await strapi.execute('65GetAskById', { id: askId }, context.jwt);
        const askData = askRes?.data?.ask?.data;

        if (!askData) {
            throw new Error('Ask not found');
        }

        const projectId = askData.attributes.project?.data?.id;
        const askerId = askData.attributes.users_permissions_user?.data?.id;

        // Handle "forums" (plural) from Strapi relation
        const forumsData = askData.attributes.forums?.data;
        let forumId = Array.isArray(forumsData) && forumsData.length > 0 ? forumsData[0].id : null;

        // 2. Create Forum if missing
        if (!forumId) {
            const projectName = askData.attributes.project?.data?.attributes?.projectName || 'Project';
            // Create Forum
            const forumRes = await strapi.execute('66CreateForumForAsk', {
                publishedAt,
                subject: `Chat for Ask Link - ${projectName}`,
                pid: projectId
            }, context.jwt);

            forumId = forumRes?.data?.createForum?.data?.id;
            if (!forumId) throw new Error('Failed to create forum');

            // Update Ask
            await strapi.execute('67UpdateAskForum', {
                id: askId,
                forumId
            }, context.jwt);
        }

        // 3. Send Message
        const createRes = await strapi.execute(
            '1chatsend',
            {
                fid: forumId,
                fidn: parseInt(forumId),
                idL: userId,
                da: publishedAt,
                mes: content.trim()
            },
            context.jwt
        );

        if (createRes.errors) {
            console.error('Failed to create message:', createRes.errors);
            throw new Error('Failed to send message');
        }

        const messageId = createRes?.data?.createMessage?.data?.id;

        return {
            success: true,
            messageId: messageId,
            content: content.trim(),
            createdAt: publishedAt,
            forumId: forumId,
            projectId: projectId, // For notification context
            askerId: askerId,     // For notification context
            senderName: senderName,
            senderPic: senderPic,
            userId: userId
        };
    },
    paramSchema: {
        askId: { type: 'string', required: true },
        content: { type: 'string', required: true }
    },
    authRules: [
        { type: 'jwt' }
    ],
    notification: {
        recipients: {
            type: 'askParticipants',
            config: {
                askIdParam: 'askId',
                excludeSender: true
            }
        },
        templates: {
            title: {
                he: 'הודעה חדשה בבקשת הצטרפות',
                en: 'New message in join request',
                ar: 'رسالة جديدة في طلب الانضمام'
            },
            body: {
                he: '{{senderName}} שלח הודעה: {{content}}',
                en: '{{senderName}} sent a message: {{content}}',
                ar: '{{senderName}} أرسل رسالة: {{content}}'
            }
        },
        channels: ['socket', 'email', 'telegram', 'push'],
        metadata: {
            priority: 'normal',
            type: 'askMessage',
            askId: '{{askId}}',
            forumId: '{{forumId}}'
        }
    },
    updateStrategy: {
        type: 'partialUpdate',
        config: {}
    }
};
