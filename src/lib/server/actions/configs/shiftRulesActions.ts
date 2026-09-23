/**
 * setShiftRules — a member's standing rules on one mission ("never Fridays",
 * "Sunday mornings: want"). docs/PLAN_SHIFTS.md P10, src/lib/shifts/rules.ts.
 *
 * A rule is the member's own consent, said once for many shifts — so only the
 * member sets it, on their own seat, and nobody votes on it. That is the
 * difference from `shiftsMin`/`shiftsMax`: how many shifts a member owes is a
 * term the rikma agreed to (§3.8); when they are free is theirs alone.
 *
 * Saving stamps `shiftRulesAt`, which is the `declaredAt` of everything the
 * rules derive — changing a rule resets its place in the early-declaration
 * tie-break, exactly as changing a tapped stance does.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { asUser, run } from '$lib/server/shifts/exec.js';
import { shiftsEnabled } from '$lib/server/shifts/mode.js';
import { normalizeRules, validateRules, type StandingRule } from '$lib/shifts/rules.js';

const setShiftRules: ActionExecutionHandler = async (params, context) => {
  if (!shiftsEnabled()) return { data: { skipped: true, reason: 'SHIFTS is off' }, updateStrategy: { type: 'none' } };
  const exec = asUser(context);
  const id = String(params.mesimabetahalichId);
  const rules = Array.isArray(params.rules) ? (params.rules as StandingRule[]) : [];
  const issues = validateRules(rules);
  if (issues.length) throw new Error(`rules:${issues[0].code}:${issues[0].index}`);

  const d = await run(
    exec,
    `query ($id: ID!) { mesimabetahalich(id: $id) { data { id attributes { users_permissions_user { data { id } } } } } }`,
    'setShiftRules:owner',
    { id }
  );
  const owner = d?.mesimabetahalich?.data?.attributes?.users_permissions_user?.data?.id;
  if (!owner) throw new Error('Mission not found');
  if (String(owner) !== String(context.userId)) throw new Error('Forbidden: you can only set your own standing rules');

  const clean = normalizeRules(rules);
  const at = new Date().toISOString();
  await run(
    exec,
    `mutation ($id: ID!, $data: MesimabetahalichInput!) { updateMesimabetahalich(id: $id, data: $data) { data { id } } }`,
    'setShiftRules',
    { id, data: { shiftRules: clean, shiftRulesAt: at } }
  );
  return { data: { rules: clean, rulesAt: at }, updateStrategy: { type: 'none' } };
};

export const setShiftRulesConfig: ActionConfig = {
  key: 'setShiftRules',
  description: "Set my standing availability rules on one of my missions (e.g. never on Fridays). Mine alone — no vote.",
  graphqlOperation: setShiftRules,
  paramSchema: {
    mesimabetahalichId: { type: 'string', required: true, description: 'My own seat on the mission' },
    rules: { type: 'array', required: true, description: 'Ordered rules: { days: 0-6[], from?: "HH:MM", to?: "HH:MM", stance } — first match wins; [] clears' }
  },
  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' }
};
