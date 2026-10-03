/**
 * What a card needs to know about a proposal's negotiation, from one side's point
 * of view — computed here, on the server, from the rules in
 * `$lib/wish/proposalRounds`, so no card re-implements whose turn it is.
 */

import {
  isTurnOf,
  standing,
  type Party,
  type ProposalRef,
  type WillingnessEntry
} from '$lib/wish/proposalRounds.js';
import { coveredVersion } from './proposal.js';

export interface NegotiationView {
  /** Whether terms can be negotiated at all: one open slot, and no product behind it. */
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
  viewer: Party
): NegotiationView | null {
  const { slot, version } = coveredVersion(attrs);
  if (!slot) return null;

  const ref: ProposalRef = {
    wisherIds: parties.wisherIds,
    proposerIds: parties.proposerIds,
    openedBy: attrs?.open_mission?.data?.id ? 'provider' : 'wisher'
  };
  const entries: WillingnessEntry[] = attrs?.ratson_willingness_entry ?? [];
  const st = standing(ref, entries, version);

  return {
    canCounter: !attrs?.matanot?.data?.id && !attrs?.project?.data?.id && OPEN.has(attrs?.status_proposal ?? 'suggested'),
    round: st.round,
    signedBy: st.signedBy,
    yourTurn: isTurnOf(viewer, st),
    amount: version.amount,
    price: version.price,
    counters: st.counters.map((c) => ({
      round: c.round,
      by: c.by,
      amount: c.version.amount,
      price: c.version.price,
      note: c.note
    }))
  };
}
