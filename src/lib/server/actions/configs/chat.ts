
import type { ActionConfig } from '../types.js';

export const chatActions: ActionConfig[] = [
    {
        key: 'createChatMessage',
        description: 'Create a new message in a forum with multi-channel notifications',
        graphqlOperation: async (params, context, { strapi }) => {
            const { forumId, message, md, username } = params;
            const userId = context.userId;
            const publishedAt = new Date().toISOString();

            // Basic validation
            if (!forumId) throw new Error('Forum ID is required');
            if (!message || !message.trim()) throw new Error('Message content is required');

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
            // We extract these from the 'md' object passed from the frontend
            const projectName = md?.projectName || '';
            const taskName = md?.mesimaName || md?.transferDetails || '';

            // Construct recipient rule based on md.participants
            let recipientsRule = {
                type: 'projectMembers',
                config: {
                    projectIdParam: 'md.pid', // Path in params
                    excludeSender: true
                }
            };

            if (md?.participants && Array.isArray(md.participants) && md.participants.length > 0) {
                recipientsRule = {
                    type: 'specificUsers',
                    config: {
                        userIdsParam: 'md.participants', // Path in params
                        excludeSender: true
                    }
                } as any;
            }

            // Return data for the next steps (notification/updateStrategy)
            // We include both flat properties for placeholders and a 'data' object for result passing
            return {
                success: true,
                messageId,
                forumId,
                message: message.trim(),
                username: username || 'User',
                projectName,
                taskName,
                projectId: md?.pid,
                // Nested data for frontend/ActionService
                data: {
                    messageId,
                    forumId,
                    success: true
                },
                updateStrategy: {
                    type: 'partialUpdate',
                    config: {
                        dataKeys: ['chat'],
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
            { type: 'jwt' }
        ],
        notification: {
            recipients: {
                // We use a rule that can look into the params
                type: 'specificUsers',
                config: {
                    // If md.participants exists, use it. Otherwise, look for projectId.
                    // The NotificationOrchestrator's specificUsers rule has a fallback to projectMembers if projectIdParam is provided.
                    userIdsParam: 'md.participants',
                    projectIdParam: 'md.pid',
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
                url: '/project/{{projectId}}/forum/{{forumId}}',
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
