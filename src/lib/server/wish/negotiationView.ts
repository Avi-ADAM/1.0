/**
 * What a card needs to know about a proposal's negotiation, from one side's point
 * of view — computed here, on the server, from the rules in
 * `$lib/wish/proposalRounds`, so no card re-implements whose turn it is.
 */

import {
  isTurnOf,
  proposalPath,
  standing,
  type Party,
  type ProposalRef,
  type WillingnessEntry
} from '$lib/wish/proposalRounds.js';
import { lastSignedAt, proposalDeadline } from '$lib/wish/restime.js';
import { coveredVersion } from './proposal.js';

export interface NegotiationView {
  /** Whether the proposal is still open for a counter (it is negotiable at all, or this view is null). */
  canCounter: boolean;
  /** Counters made so far (0 = the terms as first put). */
  round: number;
  /** Who signed the version on the table last. */
  signedBy: Party;
  /** Is it the viewer's move? */
  yourTurn: boolean;
  /** The terms on the table: hours (or quantity) and price. */
  amount: number | null;
  price: number | null;
  /**
   * When silence answers for whoever's move it is (ISO) — the last signature plus the
   * wish's pace. Null when the proposal is no longer open or the time is unknown.
   */
  deadlineAt: string | null;
  /** The negotiation so far, oldest first. */
  counters: { round: number; by: Party; amount: number | null; price: number | null; note: string }[];
}

const OPEN = new Set(['suggested', 'viewed']);

/**
 * `attrs` is a proposal as qid 105/111 return it. `null` when it covers no single
 * slot (nothing to negotiate there).
 */
export function negotiationView(
  attrs: any,
  parties: { wisherIds: string[]; proposerIds: string[] },
  viewer: Party,
  /** The wish's pace (`restime`); omit for the 48 h default. */
  restime?: unknown
): NegotiationView | null {
  const { slot, version } = coveredVersion(attrs);
  const path = proposalPath({
    kind: attrs?.kind,
    hasMatanot: !!attrs?.matanot?.data?.id,
    hasProject: !!attrs?.project?.data?.id,
    hasOpenMission: !!attrs?.open_mission?.data?.id
  });
  if (!slot || !path) return null;

  const ref: ProposalRef = {
    wisherIds: parties.wisherIds,
    proposerIds: parties.proposerIds,
    openedBy: path === 'volunteer' ? 'provider' : 'wisher'
  };
  const entries: WillingnessEntry[] = attrs?.ratson_willingness_entry ?? [];
  const st = standing(ref, entries, version);

  return {
    canCounter: OPEN.has(attrs?.status_proposal ?? 'suggested'),
    round: st.round,
    signedBy: st.signedBy,
    yourTurn: isTurnOf(viewer, st),
    amount: version.amount,
    price: version.price,
    deadlineAt: OPEN.has(attrs?.status_proposal ?? 'suggested')
      ? proposalDeadline(lastSignedAt(entries, attrs?.createdAt), restime)
      : null,
    counters: st.counters.map((c) => ({
      round: c.round,
      by: c.by,
      amount: c.version.amount,
      price: c.version.price,
      note: c.note
    }))
  };
}
