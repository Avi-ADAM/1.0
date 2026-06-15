/**
 * Action: createSiteShareTransfer
 *
 * The receiving side's money leg (PLAN_SITE_SHARE_PER_MEMBER §5, M4). Once a
 * platform member has volunteered to receive (the income Sheirut's `iCanGetMonay`),
 * each contributing member's PERSONAL transfer Haluka (member → chosen volunteer)
 * is created here and tracked end-to-end via the existing `SheirutHalukaCard`.
 *
 * The transfer points at a CHOSEN volunteer, never `user_1s[0]` — that hardcoding
 * is exactly what the per-member model rejects.
 *
 * 0/skip invariant (§5, hard): only a `decided & amount>0` contribution opens a
 * transfer window. A `skipped`/0 record is rejected here — "no transfer for 0".
 *
 * Idempotent: a contribution already carrying a `haluka` returns it unchanged, so
 * a double-tap never spawns a second transfer.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { contributionId, projectId, receiverId } = params as {
    contributionId: string;
    projectId: string;
    receiverId: string;
  };
  const userId = String(context.userId);

  const exec = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);

  const cRes = await exec('214getSiteShareContributionById', { id: String(contributionId) });
  const node = cRes?.data?.siteShareContribution?.data ?? null;
  if (!node) {
    return { data: { success: false, error: 'contribution_not_found' }, updateStrategy: { type: 'none' } };
  }
  const a = node.attributes ?? {};

  // Identity: only the owning member moves their own money.
  const ownerId = a.users_permissions_user?.data?.id;
  if (String(ownerId) !== userId) {
    return { data: { success: false, error: 'not_contribution_owner' }, updateStrategy: { type: 'none' } };
  }

  // 0/skip invariant — no transfer window for a closed-with-nothing decision.
  if (a.des_status !== 'decided' || !(Number(a.amount) > 0)) {
    return { data: { success: false, error: 'no_transfer_for_zero_or_skip' }, updateStrategy: { type: 'none' } };
  }

  // Idempotent: the transfer already exists.
  const existingHalukaId = a.haluka?.data?.id ?? null;
  if (existingHalukaId) {
    return {
      data: { success: true, halukaId: String(existingHalukaId), alreadyExisted: true },
      updateStrategy: { type: 'none' },
    };
  }

  if (!receiverId || String(receiverId) === userId) {
    return { data: { success: false, error: 'invalid_receiver' }, updateStrategy: { type: 'none' } };
  }

  const givingProjectId = a.project?.data?.id ? String(a.project.data.id) : String(projectId);
  const platformId = a.recive_project?.data?.id ? String(a.recive_project.data.id) : null;
  const tosplitId = a.tosplit?.data?.id ? String(a.tosplit.data.id) : null;
  const sheirutId = a.sheirut?.data?.id ? String(a.sheirut.data.id) : null;
  const matbeaId = a.matbea?.data?.id ? String(a.matbea.data.id) : '2';

  const halukaData: Record<string, unknown> = {
    usersend: userId,
    userrecive: String(receiverId),
    amount: Number(a.amount),
    matbea: matbeaId,
    project: givingProjectId,
    isSiteShare: true,
    ushar: true,
    confirmed: false,
    site_share_contribution: String(contributionId),
    publishedAt: new Date().toISOString(),
  };
  if (platformId) halukaData.recive_project = platformId;
  if (tosplitId) halukaData.source_tosplit = tosplitId;
  if (sheirutId) halukaData.sheirut = sheirutId;

  const created = await exec('69createHaluka', { data: halukaData });
  if (created?.errors) {
    throw new Error(`createSiteShareTransfer: createHaluka failed: ${JSON.stringify(created.errors)}`);
  }
  const halukaId = created?.data?.createHaluka?.data?.id ?? null;
  if (!halukaId) {
    return { data: { success: false, error: 'haluka_create_failed' }, updateStrategy: { type: 'none' } };
  }

  // Link the transfer back onto the contribution (source of truth → its money leg).
  await exec('208updateSiteShareContribution', {
    id: String(contributionId),
    data: { haluka: String(halukaId) },
  });

  return {
    data: { success: true, halukaId: String(halukaId) },
    updateStrategy: { type: 'none' },
  };
};

export const createSiteShareTransferConfig: ActionConfig = {
  key: 'createSiteShareTransfer',
  description:
    "Create a member's personal site-share transfer Haluka to a chosen platform volunteer (decided & amount>0 only; idempotent).",
  graphqlOperation: handler,
  paramSchema: {
    contributionId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    receiverId: { type: 'string', required: true },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to transfer site share' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the giving rikma to transfer its site share',
    },
  ],
  updateStrategy: { type: 'none' },
};
