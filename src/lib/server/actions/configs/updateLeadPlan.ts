/**
 * Update Lead Plan (docs/inprogress/PLAN_LEADS.md §4.2) — what a member means
 * to do next with a lead and when: `nextAction` ("send the price list") and
 * `followUpAt` ("get back to them on Sunday"). Planning is not contact, so
 * `lastActivityAt` does not move and nothing is logged; when the day comes
 * the lead needs attention (`attentionReason` → followUpDue).
 *
 * An empty string clears a field; a field left out stays as it was.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { leadStore, loadLeadInProject, updateLead } from '$lib/server/leads/store';

const NEXT_ACTION_MAX = 300;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const patch: Record<string, unknown> = {};

  if (params.nextAction !== undefined && params.nextAction !== null) {
    const text = String(params.nextAction).trim();
    if (text.length > NEXT_ACTION_MAX) {
      throw new ActionError('VALIDATION_FAILED', `The next step is at most ${NEXT_ACTION_MAX} characters`);
    }
    patch.nextAction = text || null;
  }
  if (params.followUpAt !== undefined && params.followUpAt !== null) {
    const raw = String(params.followUpAt).trim();
    if (!raw) patch.followUpAt = null;
    else {
      const t = Date.parse(raw);
      if (!Number.isFinite(t)) throw new ActionError('VALIDATION_FAILED', 'followUpAt must be an ISO date');
      patch.followUpAt = new Date(t).toISOString();
    }
  }
  if (!Object.keys(patch).length) throw new ActionError('VALIDATION_FAILED', 'Nothing to change');

  const store = leadStore(strapi, context.fetch);
  const lead = await loadLeadInProject(store, String(params.leadId), projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');

  await updateLead(store, lead.id, patch);
  return { leadId: lead.id, ...patch };
};

export const updateLeadPlanConfig: ActionConfig = {
  key: 'updateLeadPlan',
  description: "Set a lead's next step and when to get back to them",
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: true, description: 'The lead' },
    nextAction: { type: 'string', required: false, description: 'The next step, in words ("" clears it)' },
    followUpAt: { type: 'string', required: false, description: 'When to get back to them, ISO ("" clears it)' }
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
