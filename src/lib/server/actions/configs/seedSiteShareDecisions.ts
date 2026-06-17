/**
 * Action: seedSiteShareDecisions
 *
 * Seeds a `pending` site-share contribution for each member of a freshly created
 * tosplit (PLAN_SITE_SHARE_PER_MEMBER §1/§3), so the gate-3 reminder can list
 * "open decisions" as a queryable source of truth (`des_status = pending`),
 * rather than deriving them. A member closes their record by deciding/skipping
 * (`decideSiteShare`), which upserts the SAME row in place.
 *
 * Called right after createTosplit in whowhat.ask(). The creator's gate-1 choice
 * is persisted separately (decideSiteShare) and upserts their seeded row to
 * decided/skipped. Idempotent: skips any member who already has a record (so a
 * re-run, or the creator's prior decision, never duplicates or overwrites).
 *
 * No money moves here — these are placeholders. Each row's identity is the
 * member's own userId (public project members); the session user must be a member
 * of the rikma (authRule). 0/skip invariant is unaffected (pending feeds nothing).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

type SeedMember = { userId: string; basisAmount?: number; proposedAmount?: number };

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId, projectId, recive_project, members } = params as {
    tosplitId: string;
    projectId: string;
    recive_project?: string | null;
    members: SeedMember[];
  };

  const list = Array.isArray(members) ? members : [];
  let created = 0;
  let skipped = 0;

  for (const m of list) {
    const userId = m?.userId ? String(m.userId) : '';
    if (!userId) continue;

    // Idempotent: never duplicate or clobber an existing decision for this pair.
    const existing = await strapi.execute(
      '209getSiteShareContributionByUserTosplit',
      { user: userId, tosplit: String(tosplitId) },
      context.jwt,
      context.fetch,
    );
    if (existing?.data?.siteShareContributions?.data?.[0]?.id) {
      skipped += 1;
      continue;
    }

    const data: Record<string, unknown> = {
      users_permissions_user: userId,
      tosplit: String(tosplitId),
      project: String(projectId),
      des_status: 'pending',
      amount: 0,
      direction: 'as_is',
      basisAmount: typeof m.basisAmount === 'number' ? m.basisAmount : undefined,
      proposedAmount: typeof m.proposedAmount === 'number' ? m.proposedAmount : undefined,
      recive_project: recive_project ? String(recive_project) : undefined,
      matbea: '2',
      // Publish immediately — a draft (no publishedAt) is hidden from Strapi's
      // default LIVE GraphQL reads, so the reminder/aggregate would never see it.
      publishedAt: new Date().toISOString(),
    };
    for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];

    const res = await strapi.execute(
      '207createSiteShareContribution',
      { data },
      context.jwt,
      context.fetch,
    );
    if (res?.data?.createSiteShareContribution?.data?.id) created += 1;
  }

  return {
    data: { success: true, created, skipped },
    updateStrategy: { type: 'none' },
  };
};

export const seedSiteShareDecisionsConfig: ActionConfig = {
  key: 'seedSiteShareDecisions',
  description:
    "Seed pending site-share decisions for a new tosplit's members (source of truth for the gate-3 reminder).",
  graphqlOperation: handler,
  paramSchema: {
    tosplitId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    recive_project: { type: 'string', required: false },
    members: { type: 'array', required: true, description: 'List of { userId, basisAmount, proposedAmount }' },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to seed site share decisions' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to seed its site share decisions',
    },
  ],
  updateStrategy: { type: 'none' },
};
