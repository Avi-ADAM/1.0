/**
 * Message Lead On Site (docs/inprogress/PLAN_LEADS.md L4) — "reach me on the
 * site": the person asked while signed in to 1lev1, and a member answers
 * them there instead of by phone or email. They get it as a 1lev1
 * notification (and by mail or Telegram, per their own settings), with a link
 * back to where they asked; writing again from there folds into this same
 * lead (`createLead` matches the account), so the answer lands in its log.
 *
 * Only a lead linked to an account can be messaged this way — the link is
 * made by the product page's server for the signed-in visitor themself, never
 * typed by a member, so this cannot be used to message an arbitrary user.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { leadStore, loadLeadInProject, recordActivity, updateLead } from '$lib/server/leads/store';
import { SITE_MESSAGE_PREFIX } from '$lib/leads/contact';

const MAX = 2000;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const text = typeof params.body === 'string' ? params.body.trim() : '';
  if (!text) throw new ActionError('VALIDATION_FAILED', 'Write the message');
  if (text.length > MAX) throw new ActionError('VALIDATION_FAILED', `A message is at most ${MAX} characters`);

  const store = leadStore(strapi, context.fetch);
  const lead = await loadLeadInProject(store, String(params.leadId), projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');
  const side = await store.run('leadMergeSide', { id: lead.id });
  const a = side?.data?.lead?.data?.attributes ?? {};
  const customerId = a.customer_user?.data?.id != null ? String(a.customer_user.data.id) : null;
  if (!customerId) {
    throw new ActionError('NO_ACCOUNT', 'This person did not write from a 1lev1 account — reach them by phone or email');
  }
  const productId = (a.products?.data ?? [])[0]?.id;

  let projectName = '';
  try {
    const p = await store.run('ordersApiProject', { pid: projectId });
    projectName = p?.data?.project?.data?.attributes?.projectName ?? '';
  } catch {
    /* the notice reads "the rikma" without its name */
  }

  const now = new Date().toISOString();
  await recordActivity(store, {
    leadId: lead.id,
    kind: 'note',
    direction: 'out',
    body: `${SITE_MESSAGE_PREFIX}${text}`,
    actorId: context.userId,
    at: now
  });
  // Answering is contact: a new lead becomes "contacted".
  await updateLead(store, lead.id, {
    lastActivityAt: now,
    ...((lead.status ?? 'new') === 'new' ? { status: 'contacted' } : {})
  });
  if ((lead.status ?? 'new') === 'new') {
    await recordActivity(store, {
      leadId: lead.id,
      kind: 'statusChange',
      fromStatus: 'new',
      toStatus: 'contacted',
      actorId: context.userId,
      at: now
    });
  }

  return {
    leadId: lead.id,
    customerIds: [customerId],
    projectName: projectName || '1lev1',
    excerpt: text.length > 300 ? `${text.slice(0, 297)}…` : text,
    // Back to where they asked, where writing again reaches this lead.
    replyUrl: productId != null ? `/gift/${productId}` : `/project/${projectId}`
  };
};

export const messageLeadOnSiteConfig: ActionConfig = {
  key: 'messageLeadOnSite',
  description: 'Answer a lead on 1lev1 — a notification to the account they asked from',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: true, description: 'The lead' },
    body: { type: 'string', required: true, description: 'The message (≤2000 chars)' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only the rikma's members work its leads"
    }
  ],

  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'customerIds', excludeSender: true }
    },
    templates: {
      title: {
        he: '{{projectName}} ענו לך',
        en: '{{projectName}} answered you',
        ar: 'ردّت عليك {{projectName}}',
        ru: '{{projectName}} ответили вам',
        es: '{{projectName}} te respondió'
      },
      body: {
        he: '{{excerpt}}',
        en: '{{excerpt}}',
        ar: '{{excerpt}}',
        ru: '{{excerpt}}',
        es: '{{excerpt}}'
      }
    },
    intent: 'review',
    metadata: {
      priority: 'normal',
      url: '{{replyUrl}}'
    }
  },

  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId)])
  }
};
