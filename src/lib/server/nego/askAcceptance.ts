/**
 * Bilateral acceptance gate for the **immediate** (member-clicks-approve) path
 * of a mission candidacy — the server-side twin of what the timegrama finalizer
 * (`src/routes/api/timegrama/ask.svelte`) already does at restime expiry.
 *
 * Why this exists: `finalizeJoinAcceptance` / `finalizeAskAcceptance` used to
 * materialize the Mesimabetahalich purely on client-computed counts (`variant`,
 * `noofpu === noofusersOk`). For an **assigned offer** — `open_mission.isRishon`
 * true, i.e. a member created the mission ON someone else's behalf
 * (createMission branch 2) — that let the mission be registered under the
 * assignee's name without the assignee ever agreeing: the creator's own opening
 * vote was enough to satisfy the count.
 *
 * The rule (docs/done/PLAN_NEGOTIATION_CANDIDATES.md §A.1, project super-principles):
 * nothing is registered under a person's name without their consent. For an
 * assigned offer the taker never applied, so silence is NOT consent — only an
 * explicit yes at the current round (or their own counter round) is.
 *
 * Pure function: the caller fetches the Ask (qid `getAskNegoRounds`) and passes
 * its attributes in, so this stays unit-testable.
 */

import { type NegoGateResult } from './negoGate';
import {
  evaluateCandidacyVote,
  type CandidacyVoteRow,
  type NormalizedVote
} from './candidacyVote';

export type AskVoteRow = CandidacyVoteRow;
export type { NormalizedVote };

export type AskAcceptanceReason =
  | 'ok'
  /** The Ask was already resolved (raced with another approver / the timegrama). */
  | 'archived'
  /** The client asked to materialize under a user who isn't this Ask's candidate. */
  | 'takerMismatch'
  /**
   * The taker hasn't agreed to the standing version — an assigned offer whose
   * assignee never answered, or a project round (counter / terms edit) they
   * have yet to accept. Record the vote, don't materialize.
   */
  | 'awaitingAssigneeConsent'
  /**
   * The offer fills a line of a product a customer bought, and she has not signed the
   * standing round (QA C-19, `$lib/server/deal/offerDeal`). Record the vote, don't
   * materialize: what it ends on is added to what she pays.
   */
  | 'awaitingClientConsent';

export interface AskAcceptanceResult {
  /** May the Mesimabetahalich be created right now? */
  allowed: boolean;
  reason: AskAcceptanceReason;
  /** open_mission.isRishon — the mission was offered TO the taker, not asked for BY them. */
  assignedOffer: boolean;
  /** The Ask's candidate (`users_permissions_user`) — the only legal `acceptedUserId`. */
  takerId: string;
  /** Current negotiation round (latest `ordern`, 0 at baseline). */
  L: number;
  gate: NegoGateResult;
  /**
   * Authoritative vots (from the DB) with the approver's yes merged in at the
   * current round — persist these instead of trusting the client's array.
   */
  vots: NormalizedVote[];
  /**
   * Every member other than the candidate has said yes to the standing round
   * (see `evaluateCandidacyVote`). Deliberately *not* part of `allowed`:
   * `allowed` is the bilateral gate — may this be registered under the
   * candidate's name at all — and `signDealOffer` reads it that way. Whether the
   * rikma is done deciding *now*, rather than at restime, is this field, and the
   * finalize actions check both.
   */
  allMembersYes: boolean;
  membersPending: string[];
  /** The rikma's members as the DB has them now (empty when the read lacked them). */
  memberIds: string[];
}

export interface AskAcceptanceInput {
  /** `ask.data.attributes` as returned by qid `getAskNegoRounds`. */
  askAttributes: any;
  /** The member performing the approval (`context.userId`). */
  callerId: string | number;
  /** The user the client wants the mission registered under, when supplied. */
  acceptedUserId?: string | number | null;
  /** The deal's customers who must also sign (`OfferDeal.clientIds`); empty for ordinary offers. */
  clientIds?: Array<string | number>;
  /** Injectable clock (tests). */
  now?: Date;
}

export function evaluateAskAcceptance({
  askAttributes,
  callerId,
  acceptedUserId = null,
  clientIds = [],
  now = new Date(),
}: AskAcceptanceInput): AskAcceptanceResult {
  const attrs = askAttributes ?? {};

  // The approver's yes is part of this very request — counted, at the standing
  // round, over the DB's rows (see evaluateCandidacyVote).
  const assignedOffer = attrs.open_mission?.data?.attributes?.isRishon === true;
  const { takerId, L, gate, vots, allMembersYes, membersPending, memberIds } = evaluateCandidacyVote({
    attrs,
    side: 'ask',
    callerId,
    clientIds,
    takerApplied: !assignedOffer,
    now,
  });

  const base = { assignedOffer, takerId, L, gate, vots, allMembersYes, membersPending, memberIds };

  if (attrs.archived === true) {
    return { allowed: false, reason: 'archived', ...base };
  }
  if (acceptedUserId != null && takerId && String(acceptedUserId) !== takerId) {
    return { allowed: false, reason: 'takerMismatch', ...base };
  }
  // Nothing is registered under a person's name without their yes to the
  // version being registered. Two ways `takerYes` is false:
  //   - an assigned offer the invitee never answered (the original case), and
  //   - a project-side round standing unanswered — a counter, or the round an
  //     `editObject` sends to pending candidates when the rikma changes the
  //     terms they applied to (src/lib/server/archive/pendingOffers.ts).
  // The second is the one a member can reach by pressing approve, so the check
  // cannot be limited to assigned offers: it would materialize terms the
  // candidate never saw. This is the same bar the timegrama finalizer applies.
  if (!gate.takerYes) {
    return { allowed: false, reason: 'awaitingAssigneeConsent', ...base };
  }
  if (!gate.clientYes) {
    return { allowed: false, reason: 'awaitingClientConsent', ...base };
  }

  return { allowed: true, reason: 'ok', ...base };
}
