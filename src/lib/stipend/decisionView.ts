/**
 * Turning a raw stipend Decision into what the card needs (PLAN_STIPEND §8).
 *
 * Pure and shared: the lev extractor calls it and the tests exercise it
 * directly. It answers the same three questions the archive view does —
 * which version is on the table, is it my move, what does approving cost —
 * and one more that only a stipend has: **what does it do to my percentage**.
 */

import { computeStipendDilution, normalizeTerms } from './computeStipendEquity.js';
// Mission descriptions are rich text. The card prints them as text, so the tags
// have to come off here — rendering them raw would put markup in front of a
// voter, and rendering them as HTML would put someone else's markup in the card.
import { htmlToPlainText } from '$lib/acts/publishAsMission.js';
import type { StipendTerms } from './types.js';

export type StipendDecisionKind = 'stipendProgram' | 'stipendPledge';

export interface StipendRoundView extends StipendTerms {
  ordern: number;
  why: string | null;
  proposedById: string | null;
  proposedByName: string | null;
  zman: string | null;
}

/**
 * The work a stipend pays for, as the card must state it: a voter is being
 * asked to dilute themselves (or to pay), and neither question can be answered
 * without knowing which mission this is and what it is worth.
 */
export interface StipendMissionView {
  /** `open` = nobody has taken this work yet; the stipend waits with it. */
  kind: 'inProgress' | 'open';
  id: string;
  name: string;
  descrip: string | null;
  /** Hours committed on the mission. */
  hours: number | null;
  /** Hours already logged against it. */
  hoursDone: number | null;
  /** The mission's market rate — the M in M×H. */
  perhour: number | null;
  /** M×H, the market value of the work. Null when either factor is missing. */
  value: number | null;
  /** A standing monthly commitment rather than a one-off. */
  recurring: boolean;
  assigneeName: string | null;
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
  /** The viewer this view was built for — the card reads it back for lookups. */
  myId: string;
  /** Am I the one who would be paying? Drives the card's wording. */
  iAmFunder: boolean;
  iAmRecipient: boolean;
  /** The missions this stipend pays for — empty when it covers all of them. */
  missions: StipendMissionView[];
  /** A program nobody has agreed to fund yet (`seekingFunder`). */
  seekingFunder: boolean;
  /**
   * No closed budget: the stipend runs month after month until somebody stops
   * it. Honest but unbounded, so the card says it in words rather than leaving
   * a blank where the budget should be.
   */
  openEnded: boolean;
  /**
   * Has the member who would actually pay signed the version on the table?
   * Paying is not something silence can agree to (PLAN_STIPEND §5), so this
   * decides whether the restime clock may mature the proposal at all — the
   * same rule the server enforces in `applyStandingStipend`.
   */
  funderSigned: boolean;
  /** There is a named funder and they have not signed the standing round. */
  awaitingFunder: boolean;
  /** May silence approve this? False while the funder has not signed. */
  maturesOnSilence: boolean;
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
 * The missions on the proposed pledge, in the shape the card reads — both the
 * ones already being worked on and the still-open ones the stipend was agreed
 * for. A stipend always names its mission (it is what the monthly amount is
 * metered on); only the *performer* can be missing.
 */
function missionsOf(raw: any): StipendMissionView[] {
  const inProgress = (raw?.mesimabetahaliches?.data ?? [])
    .filter((m: any) => m?.id)
    .map((m: any): StipendMissionView => {
      const at = m.attributes ?? {};
      const hours = num(at.hoursassinged);
      const perhour = num(at.perhour);
      return {
        kind: 'inProgress',
        id: String(m.id),
        name: at.name ?? '',
        descrip: htmlToPlainText(at.descrip) || null,
        hours,
        hoursDone: num(at.howmanyhoursalready),
        perhour,
        value: hours != null && perhour != null ? hours * perhour : null,
        recurring: at.iskvua === true,
        assigneeName: at.users_permissions_user?.data?.attributes?.username ?? null
      };
    });

  const open = (raw?.open_missions?.data ?? [])
    .filter((m: any) => m?.id)
    .map((m: any): StipendMissionView => {
      const at = m.attributes ?? {};
      const hours = num(at.noofhours);
      const perhour = num(at.perhour);
      return {
        kind: 'open',
        id: String(m.id),
        name: at.name ?? '',
        descrip: htmlToPlainText(at.descrip) || null,
        hours,
        hoursDone: null,
        perhour,
        value: hours != null && perhour != null ? hours * perhour : null,
        recurring: at.iskvua === true,
        assigneeName: null
      };
    });

  return [...inProgress, ...open];
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
  // server derives, kept here so the card's counts match the server's. The
  // funder is always in the list even when they are not otherwise a signer:
  // nobody is committed to paying without signing for it.
  const baseSigners =
    kind === 'stipendPledge'
      ? ([funderId, recipientId].filter(Boolean) as string[])
      : memberIds.map(String);
  const signerIds = Array.from(
    new Set(funderId ? [...baseSigners, funderId] : baseSigners)
  );

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

  // Paying is a commitment, not an omission: while the funder has not signed
  // the standing round, silence must not approve it (PLAN_STIPEND §5).
  const funderSigned = funderId != null && signedIds.includes(funderId);
  const awaitingFunder = funderId != null && !funderSigned;

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
    myId: String(myId),
    iAmFunder: funderId != null && funderId === String(myId),
    iAmRecipient: recipientId != null && recipientId === String(myId),
    missions: missionsOf(a.stipendPledge?.data?.attributes),
    seekingFunder:
      funderId == null && a.stipendProgram?.data?.attributes?.seekingFunder === true,
    openEnded: standing.totalCap == null || Number(standing.totalCap) <= 0,
    funderSigned,
    awaitingFunder,
    maturesOnSilence: !awaitingFunder
  };
}

/** Months an open-ended stipend is projected over, for want of a closed budget. */
export const OPEN_ENDED_HORIZON_MONTHS = 12;

/**
 * What the standing version does to *my* share if the whole budget is spent.
 * Returns null where there is nothing to show — no budget at all, or terms that
 * move nobody (which is the honest answer, not a missing feature).
 *
 * An **open-ended** stipend has no closed budget to spend, so there is no final
 * number to show; the honest substitute is one year of its monthly ceiling,
 * flagged as such (`openEnded`) so the card can say "per year, and it keeps
 * going" rather than pretending the dilution stops there.
 */
export function dilutionForVoter(
  view: StipendDecisionView,
  myTotal: number,
  rikmaTotal: number
) {
  const totalCap = Number(view.standing.totalCap ?? 0);
  const monthlyCap = Number(view.standing.monthlyCap ?? 0);
  const openEnded = !(totalCap > 0);
  const budget = openEnded ? monthlyCap * OPEN_ENDED_HORIZON_MONTHS : totalCap;
  if (!(budget > 0) || !(rikmaTotal > 0)) return null;
  const result = computeStipendDilution({ myTotal, rikmaTotal, budget, terms: view.standing });
  return {
    ...result,
    moves: result.deltaPoints !== 0,
    openEnded,
    horizonMonths: openEnded ? OPEN_ENDED_HORIZON_MONTHS : null,
    budget
  };
}
