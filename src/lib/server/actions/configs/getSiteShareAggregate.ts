/**
 * Action: getSiteShareAggregate
 *
 * Read-only. Aggregates every member's per-member site-share decision for one
 * tosplit (PLAN_SITE_SHARE_PER_MEMBER §6), so the split card can show the
 * running "members gave ₪X · Y/N decided" line.
 *
 * 0/skip invariant (§5): a `skipped` record (or `decided` with amount 0) counts
 * as a CLOSED decision (`decidedCount`) but contributes 0 to `sum`. `N` (how many
 * members should decide) is the caller's concern — it's derived from the split's
 * membership client-side, not stored here.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId } = params as { tosplitId: string };

  const res = await strapi.execute(
    '210getSiteShareContributionsByTosplit',
    { tosplit: String(tosplitId) },
    context.jwt,
    context.fetch,
  );

  const rows = res?.data?.siteShareContributions?.data ?? [];

  let sum = 0;
  let decidedCount = 0; // closed decisions: decided OR skipped
  const decidedUserIds: string[] = [];

  for (const row of rows) {
    const a = row.attributes ?? {};
    const state = a.des_status;
    if (state !== 'decided' && state !== 'skipped') continue; // ignore stray pending
    decidedCount += 1;
    const uid = a.users_permissions_user?.data?.id;
    if (uid) decidedUserIds.push(String(uid));
    // Only decided & amount>0 feeds the sum (0/skip adds nothing — §5 invariant).
    if (state === 'decided') sum += Number(a.amount) || 0;
  }

  // round2 — keep the running sum clean for display.
  sum = Math.round((sum + Number.EPSILON) * 100) / 100;

  return {
    data: { sum, decidedCount, decidedUserIds },
    updateStrategy: { type: 'none' },
  };
};

export const getSiteShareAggregateConfig: ActionConfig = {
  key: 'getSiteShareAggregate',
  description:
    "Aggregate members' site-share decisions for a tosplit (running sum + how many decided).",
  graphqlOperation: handler,
  paramSchema: {
    tosplitId: { type: 'string', required: true },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read site share aggregate' },
  ],
  updateStrategy: { type: 'none' },
};
