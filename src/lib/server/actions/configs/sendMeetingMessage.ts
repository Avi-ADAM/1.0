
import type { ActionConfig } from '../types.js';

export const sendMeetingMessageConfig: ActionConfig = {
    key: 'sendMeetingMessage',
    description: 'Send a message to the meeting forum chat',
    graphqlOperation: async (params, context, { strapi }) => {
        const { forumId, content } = params;
        const userId = context.userId;
        const publishedAt = new Date().toISOString();

        if (!forumId) {
            throw new Error('Forum ID is required');
        }

        if (!content || !content.trim()) {
            throw new Error('Message content is required');
        }

        // Create the message in the forum
        const createRes = await strapi.execute(
            '1chatsend',
            {
                fid: forumId,
                fidn: parseInt(forumId),
                idL: userId,
                da: publishedAt,
                mes: content.trim()
            },
            context.jwt,
            context.fetch
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
            createdAt: publishedAt
        };
    },
    paramSchema: {
        forumId: { type: 'string', required: true },
        content: { type: 'string', required: true }
    },
    authRules: [
        { type: 'jwt' }
    ],
    notification: {
        recipients: {
            type: 'meetingParticipants',
            config: {
                forumIdParam: 'forumId',
                excludeSender: true
            }
        },
        templates: {
            title: {
                he: 'הודעה חדשה בפגישה',
                en: 'New message in meeting',
                ar: 'رسالة جديدة في الاجتماع'
            },
            body: {
                he: '{{senderName}} שלח הודעה: {{content}}',
                en: '{{senderName}} sent a message: {{content}}',
                ar: '{{senderName}} أرسل رسالة: {{content}}'
            }
        },
        channels: ['socket'],
        metadata: {
            priority: 'normal',
            type: 'meetingMessage',
            forumId: '{{forumId}}',
            messageId: '{{messageId}}'
        }
    },
    updateStrategy: {
        type: 'partialUpdate',
        config: {}
    }
};
