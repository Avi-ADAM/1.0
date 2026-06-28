/**
 * Shared negotiation gate for open-offer candidacy (Ask / Askm).
 *
 * The auto-approval decision for the 4 candidacy paths (see
 * docs/PLAN_NEGOTIATION_CANDIDATES.md §A) is derived purely from the rounds
 * (Negopendmission / NegoMash) plus the entity's vots — there are no scalar
 * negotiation-state fields. This module is the single source of truth for that
 * derivation, used by both cron finalizers (ask.svelte / askm.svelte) and,
 * later, the client cards.
 *
 * Rule: the latest round must be agreed by BOTH sides —
 *   approvable = hasPMyes && takerYes && !hasNo   (all measured at order ≥ L)
 * where L = ordern of the latest round (0 when there is no round / baseline),
 * the taker is the Ask/Askm owner (the one who'll be materialized), and a round
 * authored by the candidate (or the bare baseline application) counts as the
 * taker's implicit acceptance.
 */

export interface VoteLike {
  what?: boolean;
  order?: number;
  users_permissions_user?: unknown;
}

export interface RoundLike {
  ordern?: number;
  proposedBy?: string | null;
  attributes?: { ordern?: number; proposedBy?: string | null };
}

export interface NegoGateInput {
  /** Negopendmission / NegoMash rounds (any order; we take max ordern). */
  rounds?: RoundLike[];
  /** The Ask/Askm vots array. */
  vots?: VoteLike[];
  /** Ask/Askm owner — the candidate who'll be materialized on approval. */
  takerId: string | number | null | undefined;
  /** Project (rikma) member user ids. */
  memberIds?: Array<string | number>;
}

export interface NegoGateResult {
  approvable: boolean;
  /** Effective order threshold (latest round's ordern, or 0). */
  L: number;
  latestProposedBy: string | null;
  hasPMyes: boolean;
  hasNo: boolean;
  takerYes: boolean;
}

/** Normalize a user reference (id | {id} | {data:{id}}) to a string id. */
export function normId(u: unknown): string {
  if (u == null) return '';
  const anyU = u as any;
  return String(anyU?.data?.id ?? anyU?.id ?? anyU);
}

export function computeNegoGate({
  rounds = [],
  vots = [],
  takerId,
  memberIds = [],
}: NegoGateInput): NegoGateResult {
  const members = new Set((memberIds || []).map((m) => normId(m)).filter(Boolean));
  const tid = normId(takerId);

  // Latest round = highest ordern.
  let latest: { ordern: number; proposedBy: string | null } | null = null;
  for (const r of rounds || []) {
    const o = Number(r?.ordern ?? r?.attributes?.ordern ?? 0);
    const proposedBy = (r?.proposedBy ?? r?.attributes?.proposedBy ?? null) as string | null;
    if (!latest || o > latest.ordern) latest = { ordern: o, proposedBy };
  }

  const L = latest ? latest.ordern : 0;
  const votesAtL = (vots || []).filter((v) => Number(v?.order ?? 0) >= L);

  const hasNo = votesAtL.some((v) => v?.what === false);
  const hasPMyes = votesAtL.some(
    (v) => v?.what === true && members.has(normId(v?.users_permissions_user))
  );
  // The taker accepts the latest terms when: there is no round (baseline
  // application = acceptance), the latest round is the candidate's own, or the
  // taker explicitly voted in favor at/after the latest round.
  const takerYes =
    !latest ||
    latest.proposedBy === 'candidate' ||
    votesAtL.some((v) => v?.what === true && normId(v?.users_permissions_user) === tid);

  return {
    approvable: hasPMyes && takerYes && !hasNo,
    L,
    latestProposedBy: latest?.proposedBy ?? null,
    hasPMyes,
    hasNo,
    takerYes,
  };
}
