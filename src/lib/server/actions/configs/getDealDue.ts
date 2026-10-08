/**
 * Action: getDealDue — what a wish deal's customer owes, line by line (QA_CONCIERGE_E2E
 * C-14, $lib/sheirut/dealDue). Read-only. Her purchase card in the heart shows it before
 * she pays: the hours the rikma approved on each part, the price she agreed as its
 * ceiling, and whether the amount is final yet.
 *
 * Answers `{ due: null }` for a deal that is not a wish deal — it costs its agreed total,
 * as it always has. Only the deal's customer and the members of its rikma may ask.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { loadDealDue } from '$lib/server/sheirut/dealDue.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { sheirutId } = params as { sheirutId: string };
  if (!sheirutId) throw new Error('sheirutId is required');

  const due = await loadDealDue(
    (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch),
    String(sheirutId)
  );
  if (due) {
    const me = String(context.userId);
    if (!due.customerIds.includes(me) && !due.memberIds.includes(me)) {
      throw new Error('Only the customer of this deal and the members of its rikma can see what it costs');
    }
  }

  return { success: true, data: { due }, updateStrategy: { type: 'none' as const } };
};

export const getDealDueConfig: ActionConfig = {
  key: 'getDealDue',
  description:
    "What a wish deal's customer owes: per part, the value its rikma approved, capped at the price agreed for it (null for any other deal).",
  graphqlOperation: handler,
  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'Sheirut (deal) ID' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
