/**
 * Action: signBomAssignment — the owner of a new recipe line says yes
 * (PLAN_PRODUCT_FORM_UNIFIED, phase 3).
 *
 * Their signature is explicit, and for a resource it says which of their own it is:
 * one they already have (`spId`) or a new one from the line's terms (`create`), as
 * `provideAssignedResource` does for a resource offered on its own. The choice goes
 * onto the version on the table, so the one vote registers it when it matures.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { withResourcePicks } from '$lib/server/archive/bomTerms.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { fetchObjectChangeDecision, standingRound } from '$lib/server/archive/read.js';
import { setStandingBom, signObjectChange } from '$lib/server/archive/vote.js';
import { dealSignersFor } from '$lib/server/sheirut/dealEdit.js';
import { bomAssignees, bomResourcesToPick } from '$lib/shop/bomEditor.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const decisionId = String(params.decisionId ?? '');
  if (!decisionId) throw new Error('decisionId is required');
  const me = String(context.userId);
  const exec = execFromContext(context);

  const decision = await fetchObjectChangeDecision(exec, decisionId);
  if (!decision || decision.kind !== 'editObject') throw new ActionError('NOT_FOUND', 'This proposal was not found');
  const standing = standingRound(decision).bom ?? [];
  if (!bomAssignees(standing).includes(me)) throw new ActionError('FORBIDDEN', 'Nothing in this version is assigned to you');

  if (bomResourcesToPick(standing, me).length) {
    await setStandingBom(exec, decision, me, await withResourcePicks(exec, standing, me, params.picks));
  }

  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const outcome = await signObjectChange(exec, decisionId, me, dealSignersFor(run));

  return {
    data: { decisionId, order: outcome.order, consensus: outcome.consensus, awaiting: outcome.awaiting, projectId: decision.projectId, productId: decision.targetId },
    updateStrategy: { type: 'none' as const }
  };
};

export const signBomAssignmentConfig: ActionConfig = {
  key: 'signBomAssignment',
  description:
    'The owner of a new recipe line signs the version on the table; for a resource, this also says which of their own it is.',
  graphqlOperation: handler,
  paramSchema: {
    decisionId: { type: 'string', required: true, description: 'The editObject Decision on the product' },
    picks: { type: 'array', required: false, description: '[{ index, spId? , create?: { myp } }] for each new resource assigned to you' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('project', r?.data?.projectId), decisionScope('decision', p.decisionId), scope('product', r?.data?.productId)])
  }
};
