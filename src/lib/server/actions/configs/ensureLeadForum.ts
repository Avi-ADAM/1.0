/**
 * Ensure Lead Forum (docs/inprogress/PLAN_LEADS.md L4) — the conversation
 * between a rikma and the person who asked it something while signed in.
 *
 * Opened lazily, by either side: a member answering "on the site", or the
 * person themself. The forum belongs to the rikma (`project`), so its members
 * see it as one of the rikma's threads; the person is in it because the lead
 * points to it (`Lead.forum`) and the lead names them (`customer_user`) —
 * both written here, by the server, never by a client (forumAccess.ts).
 *
 * A lead with no account behind it (a guest, a phone call typed in) has no one
 * to talk to on the site; it is answered by email, phone or WhatsApp.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { leadForumSubject } from '../forumAccess.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { leadStore, updateLead } from '$lib/server/leads/store';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const leadId = String(params.leadId ?? '');
  if (!/^\d+$/.test(leadId)) throw new ActionError('VALIDATION_FAILED', 'leadId is required');
  const store = leadStore(strapi, context.fetch);

  let lead: any;
  try {
    const res = await store.run('leadForumOf', { id: leadId });
    lead = res?.data?.lead?.data;
  } catch (e) {
    // `Lead.forum` is not deployed yet — the caller falls back to a one-way message.
    console.warn('[ensureLeadForum] lead forum read failed:', (e as any)?.message ?? e);
    throw new ActionError('LEAD_CHAT_NOT_READY', 'Conversations on the site are not live on this deployment yet');
  }
  if (!lead?.id) throw new ActionError('NOT_FOUND', 'No such lead');
  const a = lead.attributes ?? {};
  const project = a.project?.data;
  const projectId = project?.id != null ? String(project.id) : null;
  const members: string[] = (project?.attributes?.user_1s?.data ?? []).map((u: any) => String(u.id));
  const customerId = a.customer_user?.data?.id != null ? String(a.customer_user.data.id) : null;

  // Either side of the conversation, and nobody else.
  const me = String(context.userId);
  const isMember = members.includes(me);
  if (!isMember && me !== customerId) throw new ActionError('UNAUTHORIZED', 'Only the rikma and the person who asked talk here');
  if (params.projectId != null && String(params.projectId) !== projectId) {
    throw new ActionError('NOT_FOUND', 'No such lead in this rikma');
  }
  if (!customerId) {
    throw new ActionError('NO_ACCOUNT', 'This person did not write from a 1lev1 account — reach them by email, phone or WhatsApp');
  }

  const existing = a.forum?.data?.id;
  if (existing != null) return { forumId: String(existing), created: false, leadId, projectId };

  const created = await store.run('66CreateForumForAsk', {
    publishedAt: new Date().toISOString(),
    subject: leadForumSubject(leadId, a.name ?? ''),
    pid: projectId
  });
  const forumId = created?.data?.createForum?.data?.id;
  if (!forumId) throw new Error('ensureLeadForum: the forum was not created');
  await updateLead(store, leadId, { forum: String(forumId) });
  return { forumId: String(forumId), created: true, leadId, projectId };
};

export const ensureLeadForumConfig: ActionConfig = {
  key: 'ensureLeadForum',
  description: "Open (or find) a lead's conversation on the site — the rikma's members and the person who asked",
  graphqlOperation: handler,
  paramSchema: {
    leadId: { type: 'string', required: true, description: 'The lead' },
    projectId: { type: 'string', required: false, description: 'The rikma, when a member opens it from the lead page' }
  },
  // Membership or being the person is checked inside: the person is not a member.
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in' }],
  updateStrategy: { type: 'none' },
  // A new thread in the rikma's conversations, and the lead now points to it.
  realtime: {
    scopes: (p, r) => scopeList([scope('project', r?.projectId ?? p.projectId), scope('forum', r?.forumId)])
  }
};
