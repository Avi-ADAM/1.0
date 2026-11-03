/**
 * Update Lead Status (docs/inprogress/PLAN_LEADS.md §2.1) — a member moves a
 * lead between the statuses set by hand: new · contacted · talking ·
 * paused ("not now") · spam. There is no "lost": `paused` takes a reason from
 * a short list and, optionally, a date to come back.
 *
 * `offered` and `won` are not here — they follow an order or sale linked to
 * the lead (L3a), and a lead standing on one of them is not moved by hand.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { checkManualTransition } from '$lib/leads/status';
import { leadStore, loadLeadInProject, recordActivity, updateLead } from '$lib/server/leads/store';

const REFUSAL_MESSAGE: Record<string, string> = {
  NOT_MANUAL: "This status follows an order or a sale — it isn't set by hand",
  DERIVED_LOCKED: 'This lead follows its order or sale; cancelling the order reopens it',
  PAUSED_REASON_REQUIRED: '"Not now" needs a reason',
  UNCHANGED: 'The lead already has this status'
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const to = String(params.status);
  const store = leadStore(strapi, context.fetch);
  const lead = await loadLeadInProject(store, String(params.leadId), projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');

  const refusal = checkManualTransition(lead.status, to, { pausedReason: params.pausedReason });
  if (refusal) throw new ActionError(refusal === 'UNCHANGED' ? 'VALIDATION_FAILED' : refusal, REFUSAL_MESSAGE[refusal]);

  let followUpAt: string | null = null;
  if (params.followUpAt != null && params.followUpAt !== '') {
    const t = Date.parse(String(params.followUpAt));
    if (!Number.isFinite(t)) throw new ActionError('VALIDATION_FAILED', 'followUpAt must be an ISO date');
    followUpAt = new Date(t).toISOString();
  }
  const note = typeof params.pausedNote === 'string' ? params.pausedNote.trim().slice(0, 2000) : '';

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: to, lastActivityAt: now };
  if (to === 'paused') {
    patch.pausedReason = params.pausedReason;
    patch.pausedNote = note || null;
    patch.followUpAt = followUpAt;
  } else {
    // Leaving "not now" clears its reason; a follow-up date may still be set.
    patch.pausedReason = null;
    patch.pausedNote = null;
    if (followUpAt) patch.followUpAt = followUpAt;
  }
  await updateLead(store, lead.id, patch);
  await recordActivity(store, {
    leadId: lead.id,
    kind: 'statusChange',
    fromStatus: lead.status,
    toStatus: to,
    body: to === 'paused' ? [params.pausedReason, note].filter(Boolean).join(' — ') : null,
    actorId: context.userId,
    at: now
  });

  return { leadId: lead.id, status: to, fromStatus: lead.status };
};

export const updateLeadStatusConfig: ActionConfig = {
  key: 'updateLeadStatus',
  description: 'Move a lead between the statuses set by hand (new, contacted, talking, paused, spam)',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: true, description: 'The lead' },
    status: { type: 'string', required: true, description: 'new · contacted · talking · paused · spam' },
    pausedReason: {
      type: 'string',
      required: false,
      description: 'For paused: timing · budget · noAnswer · choseOther · notFit · other'
    },
    pausedNote: { type: 'string', required: false, description: 'For paused: in words' },
    followUpAt: { type: 'string', required: false, description: 'When to come back to them (ISO)' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'You must be logged in' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: "Only the rikma's members work its leads"
    }
  ],

  realtime: {
    scopes: (p) => scopeList([scope('project', p.projectId)])
  }
};
