/**
 * Log Lead Activity (docs/inprogress/PLAN_LEADS.md §2.3) — a member records
 * what happened with the person: a call, a WhatsApp, an email, a meeting, a
 * note. Append-only; a correction is another entry.
 *
 * The first outgoing contact with a `new` lead moves it to `contacted`
 * (`statusAfterActivity`), logged as a `statusChange` by the same member.
 * A call made earlier may be logged up to 30 days back.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { isManualActivityKind, statusAfterActivity } from '$lib/leads/status';
import { laterOf, leadStore, loadLeadInProject, recordActivity, updateLead } from '$lib/server/leads/store';

const BACKDATE_DAYS = 30;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const { kind } = params;
  if (!isManualActivityKind(kind)) throw new ActionError('VALIDATION_FAILED', 'Unknown activity kind');
  const direction = params.direction ?? null;
  if (direction != null && direction !== 'in' && direction !== 'out') {
    throw new ActionError('VALIDATION_FAILED', "direction is 'in' or 'out'");
  }
  const body = typeof params.body === 'string' ? params.body.trim() : '';
  if (body.length > 4000) throw new ActionError('VALIDATION_FAILED', 'body is longer than 4000 characters');
  if (kind === 'note' && !body) throw new ActionError('VALIDATION_FAILED', 'A note needs text');

  const nowMs = Date.now();
  let at = new Date(nowMs).toISOString();
  if (params.at != null) {
    const t = Date.parse(String(params.at));
    if (!Number.isFinite(t)) throw new ActionError('VALIDATION_FAILED', 'at must be an ISO date');
    if (t > nowMs + CLOCK_SKEW_MS) throw new ActionError('VALIDATION_FAILED', 'at is in the future');
    if (t < nowMs - BACKDATE_DAYS * 86_400_000) {
      throw new ActionError('VALIDATION_FAILED', `at is more than ${BACKDATE_DAYS} days ago`);
    }
    at = new Date(t).toISOString();
  }

  const store = leadStore(strapi, context.fetch);
  const lead = await loadLeadInProject(store, String(params.leadId), projectId);
  if (!lead) throw new ActionError('NOT_FOUND', 'No such lead in this rikma');

  const activityId = await recordActivity(store, {
    leadId: lead.id,
    kind,
    direction: kind === 'note' ? null : direction,
    body: body || null,
    actorId: context.userId,
    at,
    meetingId: params.meetingId ? String(params.meetingId) : null
  });

  const next = statusAfterActivity(lead.status, kind, direction);
  const patch: Record<string, unknown> = { lastActivityAt: laterOf(lead.lastActivityAt, at) };
  if (next) patch.status = next;
  await updateLead(store, lead.id, patch);
  if (next) {
    await recordActivity(store, {
      leadId: lead.id,
      kind: 'statusChange',
      fromStatus: lead.status,
      toStatus: next,
      actorId: context.userId
    });
  }

  return { leadId: lead.id, activityId, status: next ?? lead.status };
};

export const logLeadActivityConfig: ActionConfig = {
  key: 'logLeadActivity',
  description: 'Record a call, message, meeting or note with a lead',
  graphqlOperation: handler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma' },
    leadId: { type: 'string', required: true, description: 'The lead' },
    kind: { type: 'string', required: true, description: 'note · call · whatsapp · email · meeting' },
    direction: { type: 'string', required: false, description: "'out' (we reached them) or 'in' (they reached us)" },
    body: { type: 'string', required: false, description: 'What was said or agreed (≤4000 chars)' },
    at: { type: 'string', required: false, description: 'When it happened (default now; up to 30 days back)' },
    meetingId: { type: 'string', required: false, description: 'A magik-meetings meeting, if one was opened' }
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
