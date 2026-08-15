/**
 * Turning a raw stipend Decision into what the card needs (PLAN_STIPEND §8).
 *
 * Pure and shared: the lev extractor calls it and the tests exercise it
 * directly. It answers the same three questions the archive view does —
 * which version is on the table, is it my move, what does approving cost —
 * and one more that only a stipend has: **what does it do to my percentage**.
 */

import { computeStipendDilution, normalizeTerms } from './computeStipendEquity.js';
import type { StipendTerms } from './types.js';

export type StipendDecisionKind = 'stipendProgram' | 'stipendPledge';

export interface StipendRoundView extends StipendTerms {
  ordern: number;
  why: string | null;
  proposedById: string | null;
  proposedByName: string | null;
  zman: string | null;
}

export interface StipendDecisionView {
  decisionId: string;
  kind: StipendDecisionKind;
  decisionName: string;
  why: string | null;
  funderId: string | null;
  funderName: string | null;
  funderPic: string | null;
  recipientId: string | null;
  recipientName: string | null;
  recipientPic: string | null;
  programId: string | null;
  pledgeId: string | null;
  standingOrder: number;
  standing: StipendRoundView;
  original: StipendRoundView | null;
  rounds: StipendRoundView[];
  signedIds: string[];
  awaitingIds: string[];
  myTurn: boolean;
  /** Who has to sign — the two parties, or the whole rikma. */
  signerIds: string[];
  signerCount: number;
  /** Am I the one who would be paying? Drives the card's wording. */
  iAmFunder: boolean;
  iAmRecipient: boolean;
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function roundOf(raw: any): StipendRoundView {
  const terms = normalizeTerms({
    mode: raw?.mode,
    costShare: num(raw?.costShare) ?? undefined,
    equityMultiplier: num(raw?.equityMultiplier) ?? undefined,
    stipendRate: num(raw?.stipendRate) ?? undefined,
    monthlyCap: num(raw?.monthlyCap),
    totalCap: num(raw?.totalCap),
    noticeCycles: num(raw?.noticeCycles),
    revenueTrigger: num(raw?.revenueTrigger),
    recourse: raw?.recourse ?? undefined,
    scope: raw?.scope ?? undefined,
    start: raw?.start ?? null,
    end: raw?.end ?? null,
    cycleSize: num(raw?.cycleSize)
  });
  return {
    ...terms,
    ordern: Number(raw?.ordern ?? 1),
    why: raw?.why ?? null,
    proposedById: raw?.proposedBy?.data?.id ? String(raw.proposedBy.data.id) : null,
    proposedByName: raw?.proposedBy?.data?.attributes?.username ?? null,
    zman: raw?.zman ?? null
  };
}

/**
 * Build the view, or return null when the Decision is not a stipend one or is
 * too malformed to act on. Never throws — it runs inside the lev extractor,
 * where one bad row must not take down every other card.
 */
export function buildStipendDecisionView(
  decision: any,
  memberIds: string[],
  myId: string
): StipendDecisionView | null {
  const a = decision?.attributes;
  const kind = a?.kind;
  if (kind !== 'stipendProgram' && kind !== 'stipendPledge') return null;

  const rounds: StipendRoundView[] = (a.negostip ?? [])
    .map(roundOf)
    .sort((x: StipendRoundView, y: StipendRoundView) => x.ordern - y.ordern);
  if (rounds.length === 0) return null; // no terms on the table — nothing to decide

  const standingOrder = rounds[rounds.length - 1].ordern;
  const standing = rounds[rounds.length - 1];
  const original = rounds.find((r) => r.ordern === 1) ?? null;

  const funder = a.stipFunder?.data;
  const recipient = a.stipRecipient?.data;
  const funderId = funder?.id ? String(funder.id) : null;
  const recipientId = recipient?.id ? String(recipient.id) : null;

  // Bilateral for a pledge, rikma-wide for a program — the same rule the
  // server derives, kept here so the card's counts match the server's.
  const signerIds =
    kind === 'stipendPledge'
      ? ([funderId, recipientId].filter(Boolean) as string[])
      : memberIds.map(String);

  // Signatures are per round: standing behind round 1 says nothing about
  // round 2, which is what makes a counter a real question.
  const signedIds = (
    Array.from(
      new Set(
        (a.vots ?? [])
          .filter((v: any) => v.what !== false && Number(v.order ?? 1) === standingOrder)
          .map((v: any) => String(v.users_permissions_user?.data?.id ?? ''))
      )
    ) as string[]
  ).filter(Boolean);

  return {
    decisionId: String(decision.id),
    kind,
    decisionName: a.decisionName ?? '',
    why: a.archWhy ?? null,
    funderId,
    funderName: funder?.attributes?.username ?? null,
    funderPic: funder?.attributes?.profilePic?.data?.attributes?.url ?? null,
    recipientId,
    recipientName: recipient?.attributes?.username ?? null,
    recipientPic: recipient?.attributes?.profilePic?.data?.attributes?.url ?? null,
    programId: a.stipendProgram?.data?.id ? String(a.stipendProgram.data.id) : null,
    pledgeId: a.stipendPledge?.data?.id ? String(a.stipendPledge.data.id) : null,
    standingOrder,
    standing,
    original,
    rounds,
    signedIds,
    awaitingIds: signerIds.filter((id) => !signedIds.includes(id)),
    myTurn: signerIds.includes(String(myId)) && !signedIds.includes(String(myId)),
    signerIds,
    signerCount: signerIds.length,
    iAmFunder: funderId != null && funderId === String(myId),
    iAmRecipient: recipientId != null && recipientId === String(myId)
  };
}

/**
 * What the standing version does to *my* share if the whole budget is spent.
 * Returns null where there is nothing to show — no budget, or terms that move
 * nobody (which is the honest answer, not a missing feature).
 */
export function dilutionForVoter(
  view: StipendDecisionView,
  myTotal: number,
  rikmaTotal: number
) {
  const budget = Number(view.standing.totalCap ?? 0);
  if (!(budget > 0) || !(rikmaTotal > 0)) return null;
  const result = computeStipendDilution({ myTotal, rikmaTotal, budget, terms: view.standing });
  return result.deltaPoints === 0 ? { ...result, moves: false } : { ...result, moves: true };
}
