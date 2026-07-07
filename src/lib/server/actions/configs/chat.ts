
import type { ActionConfig } from '../types.js';
import { getForumEntity, normalizeForum, participantIdsForForum } from '../forumAccess.js';
import { createChatMessageConsentSpec } from '$lib/consent/specs/s2b';

export const chatActions: ActionConfig[] = [
    {
        key: 'createChatMessage',
        // S2b shadow event (message.post) — signed client-side via
        // shadowSignRegistry after the server returns messageId.
        consentSpec: createChatMessageConsentSpec,
        description: 'Create a new message in a forum with multi-channel notifications',
        graphqlOperation: async (params, context, { strapi }) => {
            const { forumId, message } = params;
            const userId = context.userId;
            const publishedAt = new Date().toISOString();

            // Basic validation
            if (!forumId) throw new Error('Forum ID is required');
            if (!message || !message.trim()) throw new Error('Message content is required');

            const forumEntity = await getForumEntity(strapi, String(forumId), context, 'summary');
            const forumView = normalizeForum(forumEntity, String(userId));
            if (!forumEntity || !forumView) throw new Error('Forum not found');

            const userRes = await strapi.execute('24userJSONQue', { uid: userId }, context.jwt, context.fetch);
            const senderName =
                userRes?.data?.usersPermissionsUser?.data?.attributes?.username || 'User';

            // 1. Execute the GraphQL operation to save the message
            const result = await strapi.execute(
                '1chatsend',
                {
                    fid: forumId,
                    fidn: parseInt(forumId),
                    idL: userId,
                    da: publishedAt,
                    mes: message.trim()
                },
                context.jwt,
                context.fetch
            );

            if (result.errors) {
                throw new Error(`Failed to save message: ${result.errors[0]?.message || 'Unknown error'}`);
            }

            const messageId = result.data?.createMessage?.data?.id;

            // 2. Prepare dynamic data for the notification orchestrator
            const projectName = forumView.projectName || '';
            const taskName = forumView.title || '';
            const recipients = participantIdsForForum(forumEntity);

            // Return data for the next steps (notification/updateStrategy)
            // We include both flat properties for placeholders and a 'data' object for result passing
            return {
                success: true,
                messageId,
                forumId,
                message: message.trim(),
                username: senderName,
                projectName,
                taskName,
                projectId: forumView.projectId,
                recipients,
                // Nested data for frontend/ActionService
                data: {
                    messageId,
                    forumId,
                    success: true,
                    projectId: forumView.projectId
                },
                updateStrategy: {
                    type: 'partialUpdate',
                    config: {
                        dataKeys: ['app:forums', `app:forum:${forumId}`],
                        forumId
                    }
                }
            };
        },
        paramSchema: {
            forumId: { type: 'string', required: true },
            message: { type: 'string', required: true },
            md: { type: 'object', required: false }, // Metadata object
            username: { type: 'string', required: false }
        },
        authRules: [
            { type: 'jwt' },
            { type: 'forumParticipant', config: { forumIdParam: 'forumId' } }
        ],
        notification: {
            recipients: {
                type: 'specificUsers',
                config: {
                    userIdsParam: 'recipients',
                    projectIdParam: 'projectId',
                    excludeSender: true
                }
            },
            templates: {
                title: {
                    he: '{{projectName}} - {{taskName}}: הודעה חדשה',
                    en: '{{projectName}} - {{taskName}}: New Message'
                },
                body: {
                    he: '{{username}}: {{message}}',
                    en: '{{username}}: {{message}}'
                }
            },
            channels: ['socket', 'push', 'email', 'telegram'],
            metadata: {
                priority: 'normal',
                url: '/forum/{{forumId}}',
                forumId: '{{forumId}}',
                type: 'chatMessage'
            }
        },
        updateStrategy: {
            type: 'partialUpdate',
            config: {
                // This will be used by the frontend to know what to refresh
                forumId: '{{forumId}}'
            }
        }
    }
];
