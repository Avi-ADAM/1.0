/**
 * Notices from the concierge: proposals on a wish that wait for the viewer.
 *
 * The input is what the concierge already computes for its own pages —
 * `negotiationView` (server/wish/negotiationView.ts) for the terms and whose
 * move it is — so a notice never decides anything the wish page would decide
 * differently. Only "it is your move" becomes a notice: a proposal waiting on
 * the other side is not waiting for you.
 */

import { isUrgent } from '$lib/digest/hubSummary.js';
import { figuresStamp, k, terms, term, txt, type ApproveSpec, type Notice, type NoticeText } from './types';

/** The proposal statuses still open for an answer (as `negotiationView`'s OPEN). */
const OPEN = new Set(['suggested', 'viewed']);

/** `NegotiationView` — only the fields a notice reads. */
export interface WishNegotiationLike {
  /** Number of counters so far; 0 = the version as first put. */
  round: number;
  yourTurn: boolean;
  /** Hours (a task) or quantity (a resource) on the table. */
  amount: number | null;
  price: number | null;
  /** When silence approves the version on the table; null when it does not. */
  deadlineAt: string | null;
  counters?: { by: 'wisher' | 'provider'; note?: string | null }[];
}

export interface WishNoticeInput {
  /** Which side of the proposal the viewer is on. */
  viewer: 'wisher' | 'provider';
  wish: { id: string; name: string };
  proposal: {
    id: string;
    status: string | null;
    /** Who offered — the provider (a person, or the rikma behind a product). */
    proposerName: string;
    /** The wish's owner, for the provider's side of the sentence. */
    wisherName?: string | null;
    /** The need the proposal covers, by its name on the wish. */
    itemName: string | null;
    itemKind: 'mission' | 'resource' | null;
    /** A product proposal names a product instead, and is priced by quote. */
    productName?: string | null;
    totalPrice?: number | null;
    /** Null for a proposal whose terms are not negotiated here (a product). */
    negotiation: WishNegotiationLike | null;
    createdAt?: string | null;
  };
}

export function wishNotice(input: WishNoticeInput, now: number = Date.now()): Notice | null {
  const { viewer, wish, proposal: p } = input;
  if (!OPEN.has(p.status ?? 'suggested')) return null;

  const where = { kind: 'wish' as const, id: String(wish.id), name: wish.name };
  const href =
    viewer === 'wisher' ? `/concierge/${wish.id}#proposal-${p.id}` : `/wish/${wish.id}`;
  const item: NoticeText = txt(p.itemName) ?? k('notices.wish.someNeed');

  // A product / project proposal: priced by quote on its service request, not
  // negotiated here — so there is nothing to approve in one tap. Only the
  // wisher is asked about it.
  if (!p.negotiation) {
    if (viewer !== 'wisher') return null;
    const list = terms(term('price', p.totalPrice));
    return {
      key: `wish:${p.id}:p${figuresStamp(list)}`,
      subject: `proposal:${p.id}`,
      source: 'wish',
      kind: 'wishProduct',
      sentence: k('notices.wish.product', {
        who: p.proposerName,
        product: txt(p.productName) ?? item,
        wish: wish.name
      }),
      detail: null,
      terms: list,
      where,
      deadline: null,
      urgent: false,
      clockRuns: false,
      approve: null,
      expand: { kind: 'href', href },
      at: p.createdAt ?? null
    };
  }

  const n = p.negotiation;
  if (!n.yourTurn) return null;

  const list = terms(term(p.itemKind === 'resource' ? 'qty' : 'hours', n.amount), term('price', n.price));
  const other = viewer === 'wisher' ? p.proposerName : (p.wisherName ?? '');
  const lastCounter = n.round > 0 ? n.counters?.[n.counters.length - 1] : undefined;

  let kind: string;
  let sentence: NoticeText;
  if (n.round > 0) {
    kind = 'wishCounter';
    sentence = k(other ? 'notices.wish.counter' : 'notices.wish.counterAnon', {
      who: other,
      item,
      wish: wish.name
    });
  } else if (viewer === 'wisher') {
    kind = 'wishOffer';
    sentence = k('notices.wish.offer', { who: p.proposerName, item, wish: wish.name });
  } else {
    // Round 0 and the provider's move: the wisher authored the slot and invited them.
    kind = 'wishInvite';
    sentence = k(other ? 'notices.wish.invite' : 'notices.wish.inviteAnon', {
      who: other,
      item,
      wish: wish.name
    });
  }

  const approve: ApproveSpec = {
    // One entry for both sides, as WishOfferCard uses it: acceptRatsonProposal
    // hands an invitation, or a volunteer approving the wisher's counter, to
    // acceptWishOffer itself (QA C-9) — the path is the server's to read.
    actionKey: 'acceptRatsonProposal',
    params: { proposalId: String(p.id), ratsonId: String(wish.id), expectRound: n.round },
    terms: list,
    round: n.round
  };

  return {
    key: `wish:${p.id}:v${n.round}`,
    subject: `proposal:${p.id}`,
    source: 'wish',
    kind,
    sentence,
    detail: txt(lastCounter?.note),
    terms: list,
    where,
    deadline: n.deadlineAt,
    urgent: isUrgent(n.deadlineAt, now),
    // The wish's own silence clock (169.7): it runs only once the two sides are
    // talking, and `deadlineAt` is null whenever it does not.
    clockRuns: !!n.deadlineAt,
    // Approving signs exactly these figures; nothing to sign without them.
    approve: list.length ? approve : null,
    expand: { kind: 'href', href },
    at: p.createdAt ?? null
  };
}

/** Every notice across a viewer's wishes, most pressing first is the caller's sort. */
export function wishNotices(inputs: WishNoticeInput[], now: number = Date.now()): Notice[] {
  return inputs.map((i) => wishNotice(i, now)).filter((n): n is Notice => n !== null);
}
