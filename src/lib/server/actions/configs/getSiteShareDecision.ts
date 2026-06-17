/**
 * Action: getSiteShareDecision
 *
 * Read-only. Loads THIS member's existing per-member site-share decision for a
 * given tosplit (PLAN_SITE_SHARE_PER_MEMBER §2), so a collection gate can
 * prefill the SiteShareDecision UI when the member re-opens it.
 *
 * Identity (`users_permissions_user`) is taken from the session
 * (`context.userId`), never trusted from the client. Returns the decision node
 * (or null when the member hasn't decided yet) shaped for `SiteShareDecision`'s
 * `initial` prop: { des_status, amount, direction, reason }.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId } = params as { tosplitId: string };
  const userId = String(context.userId);

  const res = await strapi.execute(
    '209getSiteShareContributionByUserTosplit',
    { user: userId, tosplit: String(tosplitId) },
    context.jwt,
    context.fetch,
  );

  const node = res?.data?.siteShareContributions?.data?.[0] ?? null;
  if (!node) {
    return { data: { found: false, decision: null }, updateStrategy: { type: 'none' } };
  }

  const a = node.attributes ?? {};
  return {
    data: {
      found: true,
      decision: {
        id: String(node.id),
        des_status: a.des_status ?? null,
        amount: Number(a.amount ?? 0),
        direction: a.direction ?? 'as_is',
        reason: a.reason ?? null,
        proposedAmount: Number(a.proposedAmount ?? 0),
        basisAmount: Number(a.basisAmount ?? 0),
      },
    },
    updateStrategy: { type: 'none' },
  };
};

export const getSiteShareDecisionConfig: ActionConfig = {
  key: 'getSiteShareDecision',
  description:
    "Load the current member's existing site-share decision for a tosplit (prefill for the decision UI).",
  graphqlOperation: handler,
  paramSchema: {
    tosplitId: { type: 'string', required: true },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read site share decision' },
  ],
  updateStrategy: { type: 'none' },
};
