/**
 * Action: decideSiteShare
 *
 * One member's per-member site-share decision for one tosplit
 * (PLAN_SITE_SHARE_PER_MEMBER §1/§2). Writes the decision RECORD only — the
 * `site-share-contribution` collection is the queryable source of truth for
 * "what does this member still owe a decision on".
 *
 * Decision states:
 *   - `decided` → the member commits `amount` (> 0) of their personal share.
 *   - `skipped` → the member explicitly chooses to give nothing (closes the
 *     reminder, no transfer).
 *
 * NOTE (M2): this action does NOT create the member→platform transfer Haluka.
 * The transfer needs a chosen RECEIVER (a volunteer, PLAN §5) which is the
 * receiving side (M4). Creating it now would force the `user_1s[0]` hardcoding
 * the per-member model explicitly rejects. So the commitment lives here; the
 * money moves in M4 and is linked back via the contribution's `haluka` field.
 *
 * Identity (`users_permissions_user`) is taken from the session (`context.userId`),
 * never trusted from the client. Upserts: one contribution per (member, tosplit).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { computeSiteShare } from '$lib/revenue/computeSiteShare.js';
import { DEFAULT_SITE_SHARE_CONFIG } from '$lib/revenue/config.js';
import { ensurePlatformIncomeSheirut } from '$lib/server/revenue/siteShareIncome.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const {
    tosplitId,
    projectId,
    recive_project,
    decision,
    amount,
    proposedAmount,
    basisAmount,
    direction,
    reason,
    matbeaId,
  } = params as {
    tosplitId: string;
    projectId: string;
    recive_project?: string | null;
    decision: 'decided' | 'skipped';
    amount?: number;
    proposedAmount?: number;
    basisAmount?: number;
    direction?: 'as_is' | 'less' | 'more';
    reason?: string | null;
    matbeaId?: string | null;
  };

  const userId = String(context.userId);
  const isDecided = decision === 'decided';
  const dir = direction || 'as_is';
  let finalAmount = isDecided ? Number(amount) || 0 : 0;

  // Server is authoritative for the "give as suggested" path. A gate can emit a
  // stale/zero `amount` (e.g. its `proposed` prop hadn't computed yet at confirm
  // time), which would silently demote an "agreed to give" decision to a 0/skip
  // and leave the aggregate sum stuck at 0. So for `as_is` we recompute the
  // suggestion from the member's own basis (their fair share) rather than trust
  // the client value. `more`/`less` keep the explicitly typed amount.
  if (isDecided && dir === 'as_is') {
    const basis = Number(basisAmount);
    if (Number.isFinite(basis) && basis > 0) {
      const recomputed = computeSiteShare({
        payerRole: 'provider',
        baseAmount: basis,
        matbea: '2',
        config: DEFAULT_SITE_SHARE_CONFIG,
      }).siteAmount;
      if (recomputed > 0) finalAmount = recomputed;
    }
    // Last resort: honour a positive proposal the client did send.
    if (finalAmount <= 0 && Number(proposedAmount) > 0) finalAmount = Number(proposedAmount);
  }

  // Guard: a real "less" choice owes a reason (PLAN §2). "more"/"as_is" don't.
  if (isDecided && dir === 'less' && !(reason && String(reason).trim())) {
    return {
      data: { success: false, error: 'reason_required_for_less' },
      updateStrategy: { type: 'none' },
    };
  }
  if (isDecided && finalAmount <= 0) {
    // Committing nothing IS a skip — normalise so the record stays meaningful.
    return decide('skipped');
  }
  return decide(decision);

  async function decide(state: 'decided' | 'skipped') {
    // SiteShareContributionInput — passthrough (qids 207/208).
    const data: Record<string, unknown> = {
      users_permissions_user: userId,
      tosplit: String(tosplitId),
      project: String(projectId),
      des_status: state,
      amount: state === 'decided' ? finalAmount : 0,
      direction: state === 'decided' ? dir : 'as_is',
      proposedAmount: typeof proposedAmount === 'number' ? proposedAmount : undefined,
      basisAmount: typeof basisAmount === 'number' ? basisAmount : undefined,
      reason: state === 'decided' && dir !== 'as_is' ? reason || null : null,
      recive_project: recive_project ? String(recive_project) : undefined,
      matbea: matbeaId ? String(matbeaId) : '2',
      // Publish immediately — without publishedAt the entry is a draft, which
      // Strapi's default GraphQL queries (LIVE) hide, so the upsert/aggregate/
      // reminder reads would never see it.
      publishedAt: new Date().toISOString(),
    };
    // Strip undefined so we never overwrite with nulls on update.
    for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];

    // Upsert: one contribution per (member, tosplit). Look up first so a
    // re-decision updates in place instead of proliferating rows.
    const existing = await strapi.execute(
      '209getSiteShareContributionByUserTosplit',
      { user: userId, tosplit: String(tosplitId) },
      context.jwt,
      context.fetch,
    );
    const existingId = existing?.data?.siteShareContributions?.data?.[0]?.id ?? null;

    let res;
    if (existingId) {
      res = await strapi.execute(
        '208updateSiteShareContribution',
        { id: String(existingId), data },
        context.jwt,
        context.fetch,
      );
    } else {
      res = await strapi.execute(
        '207createSiteShareContribution',
        { data },
        context.jwt,
        context.fetch,
      );
    }

    const node =
      res?.data?.updateSiteShareContribution?.data ??
      res?.data?.createSiteShareContribution?.data ??
      null;
    const contributionId = node?.id ?? existingId ?? null;

    // Receiving side (M4): a decided & amount>0 contribution feeds the platform's
    // income — one Sheirut per source split, accumulated. Lazily ensured here so
    // there's a single source of truth and no manual trigger. The transfer Haluka
    // waits for a volunteer (createSiteShareTransfer), so we only link the income
    // Sheirut now. 0/skip never reaches this branch (no transfer window for 0).
    let incomeSheirutId: string | null = null;
    if (contributionId && state === 'decided' && finalAmount > 0 && recive_project) {
      try {
        const exec = (qid: string, vars: Record<string, unknown>) =>
          strapi.execute(qid, vars, context.jwt, context.fetch);
        incomeSheirutId = await ensurePlatformIncomeSheirut(exec, {
          tosplitId: String(tosplitId),
          platformProjectId: String(recive_project),
          sourceProjectId: String(projectId),
        });
        if (incomeSheirutId) {
          // Link the contribution to its income Sheirut (idempotent on re-decide).
          await exec('208updateSiteShareContribution', {
            id: String(contributionId),
            data: { sheirut: String(incomeSheirutId) },
          });
        }
      } catch (e) {
        // Income aggregation is best-effort — never fail the member's decision on it.
        console.error('[SiteShare] ensure income Sheirut failed:', e);
      }
    }

    return {
      data: contributionId
        ? {
            success: true,
            contributionId: String(contributionId),
            des_status: state,
            amount: state === 'decided' ? finalAmount : 0,
            incomeSheirutId,
          }
        : { success: false },
      updateStrategy: { type: 'none' as const },
    };
  }
};

export const decideSiteShareConfig: ActionConfig = {
  key: 'decideSiteShare',
  description:
    "Record a member's per-member site-share decision (decided/skipped) for a tosplit. Source of truth; the transfer is created on the receiving side (M4).",
  graphqlOperation: handler,
  paramSchema: {
    tosplitId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    recive_project: { type: 'string', required: false },
    decision: {
      type: 'string',
      required: true,
      validate: (v) => v === 'decided' || v === 'skipped',
    },
    amount: { type: 'number', required: false },
    proposedAmount: { type: 'number', required: false },
    basisAmount: { type: 'number', required: false },
    direction: {
      type: 'string',
      required: false,
      validate: (v) => v == null || v === 'as_is' || v === 'less' || v === 'more',
    },
    reason: { type: 'string', required: false },
    matbeaId: { type: 'string', required: false },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to decide site share' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to decide its site share',
    },
  ],
  updateStrategy: { type: 'none' },
};
