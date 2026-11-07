
import type { ActionConfig } from '../types.js';
import { env } from '$env/dynamic/private';
import { forumParticipantIds, getForumEntity, leadOfForum, normalizeForum } from '../forumAccess.js';
import { createChatMessageConsentSpec } from '$lib/consent/specs/s2b';
import { scope, scopeList } from '$lib/realtime/scopes.js';

/**
 * A message in a lead's conversation, in the lead's log (best effort — the
 * message itself is already saved). The person writing ⇒ `inbound`; a member
 * ⇒ a contact out (`note`, written as a site message), and a `new` lead is
 * now `contacted`.
 */
async function logOnLead(strapi: any, forumId: string, userId: string, text: string, context: any) {
    const lead = await leadOfForum(strapi, forumId, context);
    if (!lead) return;
    const [{ leadStore, recordActivity, updateLead }, { SITE_MESSAGE_PREFIX }] = await Promise.all([
        import('$lib/server/leads/store'),
        import('$lib/leads/contact')
    ]);
    const store = leadStore(strapi, context.fetch);
    const now = new Date().toISOString();
    const excerpt = text.length > 500 ? `${text.slice(0, 497)}…` : text;
    const fromThem = lead.customerUserId === userId;
    await recordActivity(store, {
        leadId: lead.leadId,
        kind: fromThem ? 'inbound' : 'note',
        direction: fromThem ? 'in' : 'out',
        body: fromThem ? excerpt : `${SITE_MESSAGE_PREFIX}${excerpt}`,
        actorId: fromThem ? null : userId,
        at: now
    });
    const answered = !fromThem && (lead.status ?? 'new') === 'new';
    await updateLead(store, lead.leadId, { lastActivityAt: now, ...(answered ? { status: 'contacted' } : {}) });
    if (answered) {
        await recordActivity(store, {
            leadId: lead.leadId,
            kind: 'statusChange',
            fromStatus: 'new',
            toStatus: 'contacted',
            actorId: userId,
            at: now
        });
    }
}

export const chatActions: ActionConfig[] = [
    {
        key: 'createChatMessage',
        // S2b shadow event (message.post) — signed client-side via
        // shadowSignRegistry after the server returns messageId.
        consentSpec: createChatMessageConsentSpec,
        description: 'Create a new message in a forum with multi-channel notifications',
        graphqlOperation: async (params, context, { strapi }) => {
            const { forumId, message, via } = params;
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

            // 1. Execute the GraphQL operation to save the message.
            //
            // `via: 'agent'` marks a message an agent wrote for the member (MCP).
            // It goes through a separate query because the Message field exists
            // only once the backend is deployed; CHAT_VIA_ENABLED is the switch
            // that says it is. Until then the mark is dropped and the message is
            // saved exactly as before, rather than failing.
            const markVia = via === 'agent' && env.CHAT_VIA_ENABLED === 'true';
            const result = await strapi.execute(
                markVia ? '1chatsendVia' : '1chatsend',
                {
                    fid: forumId,
                    fidn: parseInt(forumId),
                    idL: userId,
                    da: publishedAt,
                    mes: message.trim(),
                    ...(markVia ? { via: 'agent' } : {})
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
            // A lead's conversation includes the person who asked (PLAN_LEADS L4).
            const recipients = await forumParticipantIds(strapi, forumEntity, context);

            // …and what is said there is part of the lead's story: the person
            // writing is an inbound contact, a member answering is contact out.
            if (forumView.kind === 'lead') {
                await logOnLead(strapi, String(forumId), String(userId), message.trim(), context).catch((e) =>
                    console.warn('[chat] lead log failed:', e?.message ?? e)
                );
            }

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
            // 'agent' ⇒ written through an agent on the member's behalf.
            via: { type: 'string', required: false },
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
            // A message to them — reaches them off the site, but asks for no answer the clock counts.
            intent: 'personal',
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
        },
        // The forum's own participants — the same people the notice goes to. Never the
        // whole rikma: a sale-claim or wish-offer thread is bilateral.
        realtime: {
            scopes: (p) => scopeList([scope('forum', p.forumId)]),
            audience: 'parties',
            partiesFrom: (_p, r) => r?.recipients ?? []
        }
    }
];
