/**
 * Action: releaseBomAssignment — approve the work, not who does it
 * (PLAN_PRODUCT_FORM_UNIFIED, phase 3).
 *
 * A new recipe line with an owner waits for that owner's explicit signature. This
 * is the negotiation move that takes the owner off: the next round keeps everything
 * else, the line opens for anyone when it matures, and the clock resets. The owner
 * may do it for their own line, and any member who has not signed may propose it.
 * Once the rikma's clock ran out and only the owner's answer is missing, anyone may,
 * or a silent owner would hold the version forever.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchObjectChangeDecision, standingRound } from '$lib/server/archive/read.js';
import { counterObjectChange } from '$lib/server/archive/vote.js';
import { dealSignersFor } from '$lib/server/sheirut/dealEdit.js';
import { bomAssignees, releaseAssignments } from '$lib/shop/bomEditor.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');
  const indexes = (Array.isArray(params.indexes) ? params.indexes : []).map(Number);

  const exec = execFromContext(context);
  const current = await fetchObjectChangeDecision(exec, decisionId);
  if (!current || current.kind !== 'editObject') throw new Error('This proposal was not found');
  const standing = standingRound(current);
  const terms = standing.bom ?? [];
  const bom = releaseAssignments(terms, indexes);
  if (bomAssignees(bom).length === bomAssignees(terms).length) throw new Error('None of these lines has an owner to take off');

  const clockOut = !!current.timegramaDate && Date.parse(current.timegramaDate) <= Date.now();
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const result = await counterObjectChange(exec, {
    decisionId,
    userId: String(context.userId),
    round: { mode: 'keep', why: params.why ? String(params.why).trim() : null, bom },
    extraFor: dealSignersFor(run),
    evenIfSigned: clockOut
  });

  return {
    data: { decisionId, order: result.order, deadline: result.deadline, projectId: current.projectId, productId: current.targetId },
    updateStrategy: { type: 'none' as const }
  };
};

export const releaseBomAssignmentConfig: ActionConfig = {
  key: 'releaseBomAssignment',
  description:
    "Counter a product's recipe proposal by taking the owner off new lines: the work stays and opens for anyone. Opens the next round and resets the clock.",
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The editObject Decision on the product' },
    indexes: { type: 'array', required: true, description: 'Indexes of the standing version’s terms to take the owner off' },
    why: { type: 'string', required: false, description: 'Why' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('project', r?.data?.projectId), decisionScope('decision', p.decisionId), scope('product', r?.data?.productId)])
  }
};
