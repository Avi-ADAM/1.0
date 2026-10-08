/**
 * One member's vote on a candidacy (Ask = mission, Askm = resource), computed
 * from what the DB holds — never from the array a card happens to have.
 *
 * Every write path used to rebuild the `vots` component from the client's copy:
 * `voteOnAskm` took both `order` and `existingVotes` from the request,
 * `finalizeAskmAcceptance` (variant `partial`) and `addVote` (type `ask`)
 * rebuilt the list from `existingVotes`, and the askm materializers archived
 * with it. `updateAskm/updateAsk(vots: …)` *replaces* the component, so:
 *
 *   - a vote another member cast after this card loaded was deleted (lost update);
 *   - the askm paths dropped `order` from every row, so after a negotiation round
 *     every vote — not only the new one — fell back to round 0, below the
 *     standing round `computeNegoGate` counts from;
 *   - `addVote` wrote the new yes without `order`, i.e. at round 0, so a member's
 *     yes on renegotiated terms never counted for them.
 *
 * And "everyone has said yes" (`variant: 'allVoted'`) was the card's arithmetic
 * (`noofpu === noofusersOk`) — the server materialized on the client's word.
 *
 * This module is the server's own answer to all of it: read the candidacy,
 * take the standing round from its rounds, merge the caller's vote at that round
 * over the DB rows, and report whether the rikma, the candidate and any paying
 * customer have all agreed. Pure; the actions do the reading and writing.
 */

import { computeNegoGate, normId, type NegoGateResult } from './negoGate';
import { ActionError } from '../actions/errors.js';

export type CandidacySide = 'ask' | 'askm';

export interface CandidacyVoteRow {
  what?: boolean | null;
  why?: string | null;
  zman?: string | null;
  ide?: number | string | null;
  order?: number | null;
  users_permissions_user?: unknown;
}

/** A vote row as it is written back through `120addVoteToAsk` / `133addVoteToAskm`. */
export interface NormalizedVote {
  what: boolean;
  users_permissions_user: string;
  order: number;
  ide: number | null;
  zman: string;
  why?: string;
}

export interface CandidacyVoteInput {
  /** The Ask / Askm attributes as `getAskNegoRounds` / `getAskmForFinalize` return them. */
  attrs: any;
  side: CandidacySide;
  /** The member casting the vote (`context.userId`). */
  callerId: string | number;
  /** Yes (default) or "not these terms". */
  what?: boolean;
  why?: string | null;
  /** The deal's customers who must also sign (`OfferDeal.clientIds`). */
  clientIds?: Array<string | number>;
  /** Did the taker apply themselves? False for an assigned offer. Default true. */
  takerApplied?: boolean;
  now?: Date;
}

export interface CandidacyVoteResult {
  /** The standing round — the latest `ordern`, 0 when nobody has countered. */
  L: number;
  takerId: string;
  memberIds: string[];
  /** DB rows with the caller's vote at L in place of any earlier one of theirs at L. */
  vots: NormalizedVote[];
  gate: NegoGateResult;
  /**
   * Every member of the rikma other than the candidate has said yes to the
   * standing round, and nobody has said "not these terms". This — not the
   * card's count — is what lets an approval materialize immediately instead of
   * waiting for the rikma's restime. Unknown membership (the read came back
   * without it) is never "everyone".
   */
  allMembersYes: boolean;
  /** Members (other than the candidate) still without a yes at the standing round. */
  membersPending: string[];
}

/** The candidacy's negotiation rounds, whichever side it is. */
export function candidacyRounds(attrs: any, side: CandidacySide) {
  const list = side === 'ask' ? attrs?.negopendmissions?.data : attrs?.nego_mashes?.data;
  return (list ?? []).map((r: any) => ({
    ordern: r?.attributes?.ordern,
    proposedBy: r?.attributes?.proposedBy
  }));
}

export function normalizeVote(v: CandidacyVoteRow, fallbackZman: string): NormalizedVote {
  const uid = normId(v?.users_permissions_user);
  const ideRaw = v?.ide ?? uid;
  const ide = Number.parseInt(String(ideRaw), 10);
  const row: NormalizedVote = {
    what: v?.what === true,
    users_permissions_user: uid,
    order: Number(v?.order ?? 0),
    ide: Number.isNaN(ide) ? null : ide,
    zman: v?.zman ?? fallbackZman
  };
  if (v?.why) row.why = v.why;
  return row;
}

export function evaluateCandidacyVote({
  attrs,
  side,
  callerId,
  what = true,
  why = null,
  clientIds = [],
  takerApplied = true,
  now = new Date()
}: CandidacyVoteInput): CandidacyVoteResult {
  const nowISO = now.toISOString();
  const takerId = normId(attrs?.users_permissions_user);
  const memberIds: string[] = (attrs?.project?.data?.attributes?.user_1s?.data ?? []).map(
    (m: any) => String(m.id)
  );
  const rounds = candidacyRounds(attrs, side);
  const L = rounds.reduce((max: number, r: any) => Math.max(max, Number(r?.ordern ?? 0)), 0);

  // The caller's vote is part of this very request — count it, and replace any
  // earlier vote of theirs in the same round (a change of mind, not a second vote).
  const caller = String(callerId);
  const callerIde = Number.parseInt(caller, 10);
  const mine: NormalizedVote = {
    what: what === true,
    users_permissions_user: caller,
    order: L,
    ide: Number.isNaN(callerIde) ? null : callerIde,
    zman: nowISO
  };
  if (why) mine.why = why;
  const vots: NormalizedVote[] = [
    ...(attrs?.vots ?? [])
      .map((v: CandidacyVoteRow) => normalizeVote(v, nowISO))
      // A row without a user can't be re-serialized into the vots component.
      .filter((v: NormalizedVote) => v.users_permissions_user !== '')
      .filter((v: NormalizedVote) => !(v.users_permissions_user === caller && v.order === L)),
    mine
  ];

  const gate = computeNegoGate({ rounds, vots, takerId, memberIds, takerApplied, clientIds });

  const yesAtL = new Set(
    vots.filter((v) => v.what && v.order >= L).map((v) => v.users_permissions_user)
  );
  const membersPending = memberIds.filter((m) => m !== takerId && !yesAtL.has(m));
  const allMembersYes = memberIds.length > 0 && membersPending.length === 0 && !gate.hasNo;

  return { L, takerId, memberIds, vots, gate, allMembersYes, membersPending };
}

/**
 * Refuse a vote cast on terms that are no longer the ones on the table.
 *
 * The server always votes on the standing round — it never trusted the
 * client's `order` for that. But that means a yes clicked on "5 hours" lands on
 * the 8-hour counter that arrived while the card (or a notification) sat open.
 * A caller that knows which round it showed passes it as `expectRound`; when
 * the round has moved, nothing is written and the client gets the round to
 * reload. Callers that do not pass it behave exactly as before.
 */
export function assertStandingRound(expectRound: unknown, L: number): void {
  if (expectRound === undefined || expectRound === null || expectRound === '') return;
  const expected = Number(expectRound);
  if (!Number.isFinite(expected) || expected === L) return;
  throw new ActionError(
    'ROUND_MOVED',
    'The terms changed while you were looking at them — reload to see the version now on the table',
    { expected, standing: L }
  );
}
