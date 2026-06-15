/**
 * Action: getOpenSiteShareDecisions
 *
 * Read-only. Gate 3 (PLAN_SITE_SHARE_PER_MEMBER §3): every OPEN site-share
 * decision (`des_status = pending`) for the current member, with enough context
 * to render the shared decision card inline (rikma name + logo, the share it was
 * computed from, the suggestion). Powers the persistent "open decisions" reminder.
 *
 * Pending records are seeded for a tosplit's members at creation
 * (`seedSiteShareDecisions`); a member closes one by deciding/skipping, which
 * removes it from this list. Identity is taken from the session, never the client.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  const userId = String(context.userId);

  const res = await strapi.execute(
    '211getOpenSiteShareDecisions',
    { user: userId },
    context.jwt,
    context.fetch,
  );

  const rows = res?.data?.siteShareContributions?.data ?? [];

  const decisions = rows
    .map((row: any) => {
      const a = row.attributes ?? {};
      const tosplitId = a.tosplit?.data?.id ? String(a.tosplit.data.id) : null;
      if (!tosplitId) return null; // a decision with no tosplit is unusable here
      const proj = a.project?.data;
      return {
        contributionId: String(row.id),
        tosplitId,
        reciveProjectId: a.recive_project?.data?.id
          ? String(a.recive_project.data.id)
          : null,
        projectId: proj?.id ? String(proj.id) : null,
        projectName: proj?.attributes?.projectName ?? '',
        projectLogo: proj?.attributes?.profilePic?.data?.attributes?.url ?? '',
        proposedAmount: Number(a.proposedAmount ?? 0),
        basisAmount: Number(a.basisAmount ?? 0),
      };
    })
    .filter(Boolean);

  return {
    data: { decisions, count: decisions.length },
    updateStrategy: { type: 'none' },
  };
};

export const getOpenSiteShareDecisionsConfig: ActionConfig = {
  key: 'getOpenSiteShareDecisions',
  description:
    "List the current member's open (pending) site-share decisions for the reminder card.",
  graphqlOperation: handler,
  paramSchema: {},
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read open site share decisions' },
  ],
  updateStrategy: { type: 'none' },
};
