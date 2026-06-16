/**
 * Action: getRikmaSplitsArchive (M5, PLAN_SITE_SHARE_PER_MEMBER §6)
 *
 * Read-only. The comprehensive distribution archive for a rikma's split screen:
 * EVERY tosplit the rikma has had (finished + open), newest first, with each
 * member's fair-share allocation (`hervachti.amount` = "מגיע" — what the split
 * allocates to them), plus a per-member all-time summary and the grand total
 * distributed across all splits.
 *
 * This is the "all splits" half the user asked for, complementing the site-share
 * archive (getSiteShareArchive) which only covers giving to the main rikma.
 *
 * Per-member figures mirror the haluka card (lev/cards/haluka.svelte) EXACTLY,
 * because the card is the source of truth for the split math:
 *   • amount  ("מגיע")  = the member's fair profit share (`hervachti.amount`).
 *   • noten            = Σ real transfers (`halukas`) where the member is `usersend`.
 *   • meca             = Σ real transfers where the member is `userrecive`.
 *   • actual ("בפועל") = amount + noten − meca.
 *   • transfers        = the member's outgoing transfers (→ who, how much).
 * `hervachti.amount` alone is only the proportional share, NOT a transfer — the
 * real "who paid whom" lives solely in `halukas{ usersend, userrecive, amount }`.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

interface Transfer {
  toId: string;
  toName: string;
  amount: number;
}

interface Allocation {
  userId: string;
  username: string;
  pic: string | null;
  amount: number; // מגיע — fair share
  noten: number; // total given away (real transfers)
  meca: number; // total received (real transfers)
  actual: number; // בפועל = amount + noten − meca
  isNoten: boolean;
  isMekabel: boolean;
  transfers: Transfer[];
}

interface SplitRow {
  id: string;
  name: string;
  percentage: number | null;
  finished: boolean;
  createdAt: string | null;
  total: number;
  transferCount: number;
  confirmedTransferCount: number;
  allocations: Allocation[];
}

interface MemberTotal {
  userId: string;
  username: string;
  pic: string | null;
  total: number; // Σ מגיע (fair share earned) across all splits
  given: number; // Σ noten across all splits
  received: number; // Σ meca across all splits
  splitsCount: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const picOf = (node: any): string | null =>
  node?.attributes?.profilePic?.data?.attributes?.url ?? null;

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { projectId } = params as { projectId: string };

  const res = await strapi.execute(
    '218getRikmaSplitsArchive',
    { project: String(projectId) },
    context.jwt,
    context.fetch,
  );

  const rows = res?.data?.project?.data?.attributes?.tosplits?.data ?? [];

  const splits: SplitRow[] = [];
  const members = new Map<string, MemberTotal>();
  let totalDistributed = 0;

  for (const row of rows) {
    const a = row.attributes ?? {};
    const hervachti = Array.isArray(a.hervachti) ? a.hervachti : [];

    // 1. Seed one row per member from hervachti (fair share + role flags).
    const rowsByUid = new Map<string, Allocation>();
    let splitTotal = 0;

    for (const h of hervachti) {
      const userNode = h?.users_permissions_user?.data ?? null;
      const amount = Number(h?.amount) || 0;
      const uid = userNode?.id ? String(userNode.id) : '';
      if (!uid) continue;
      const username = userNode?.attributes?.username ?? '';
      const pic = picOf(userNode);

      rowsByUid.set(uid, {
        userId: uid,
        username,
        pic,
        amount,
        noten: 0,
        meca: 0,
        actual: 0,
        isNoten: !!h?.noten,
        isMekabel: !!h?.mekabel,
        transfers: [],
      });
      splitTotal += amount;
    }

    // 2. Apply the real transfers — the only place "who paid whom" lives.
    const halukas = a.halukas?.data ?? [];
    for (const hk of halukas) {
      const ha = hk?.attributes ?? {};
      const fromNode = ha.usersend?.data ?? null;
      const toNode = ha.userrecive?.data ?? null;
      const fromId = fromNode?.id ? String(fromNode.id) : '';
      const toId = toNode?.id ? String(toNode.id) : '';
      const amount = Number(ha.amount) || 0;
      if (amount <= 0.001) continue;

      const giver = rowsByUid.get(fromId);
      const receiver = rowsByUid.get(toId);
      if (giver) {
        giver.noten += amount;
        giver.transfers.push({
          toId,
          toName: receiver?.username || toNode?.attributes?.username || '—',
          amount: round2(amount),
        });
      }
      if (receiver) receiver.meca += amount;
    }

    // 3. בפועל = מגיע + נתן − קיבל (exactly as the haluka card computes it).
    const allocations: Allocation[] = [];
    for (const u of rowsByUid.values()) {
      u.actual = round2(u.amount + u.noten - u.meca);
      u.amount = round2(u.amount);
      u.noten = round2(u.noten);
      u.meca = round2(u.meca);
      allocations.push(u);

      // All-time per-member rollup.
      const cur =
        members.get(u.userId) ??
        {
          userId: u.userId,
          username: u.username,
          pic: u.pic,
          total: 0,
          given: 0,
          received: 0,
          splitsCount: 0,
        };
      cur.total += u.amount;
      cur.given += u.noten;
      cur.received += u.meca;
      cur.splitsCount += 1;
      if (u.username) cur.username = u.username;
      if (u.pic) cur.pic = u.pic;
      members.set(u.userId, cur);
    }

    const confirmedTransferCount = halukas.filter(
      (hk: any) => !!hk?.attributes?.confirmed,
    ).length;

    splits.push({
      id: String(row.id),
      name: a.name ?? '',
      percentage: a.prectentage != null ? Number(a.prectentage) : null,
      finished: !!a.finished,
      createdAt: a.createdAt ?? null,
      total: round2(splitTotal),
      transferCount: halukas.length,
      confirmedTransferCount,
      allocations: allocations.sort((x, y) => y.amount - x.amount),
    });
    totalDistributed += splitTotal;
  }

  const byMember = [...members.values()]
    .map((m) => ({
      ...m,
      total: round2(m.total),
      given: round2(m.given),
      received: round2(m.received),
    }))
    .sort((x, y) => y.total - x.total);

  return {
    data: {
      splits,
      byMember,
      totalDistributed: round2(totalDistributed),
      splitsCount: splits.length,
    },
    updateStrategy: { type: 'none' },
  };
};

export const getRikmaSplitsArchiveConfig: ActionConfig = {
  key: 'getRikmaSplitsArchive',
  description:
    "Comprehensive distribution archive for a rikma's split screen: all tosplits (finished + open) with per-member fair-share allocations, a per-member all-time summary, and the grand total distributed.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to read the splits archive' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma to read its splits archive',
    },
  ],
  updateStrategy: { type: 'none' },
};
