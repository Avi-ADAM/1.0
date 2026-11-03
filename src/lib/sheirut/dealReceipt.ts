/**
 * Receiving a fixed-price deal — the `dealReceipt` Decision
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §3, P6).
 *
 * On a fixed price she bought an outcome, so the deal is done when she has it. The rikma
 * says it delivered; she approves, or answers with what is still missing — a list of
 * defects, never a bare "no". The rikma fixes them and says it delivered again. Her
 * silence on a delivery, for the rikma's `restime`, is her receipt.
 *
 * The rounds ride the Decision's `vots` with the same shape as every bilateral consent on
 * the site (`$lib/fulfillment/consent`): `order` is the round, the one who opened it votes
 * yes with their words in `why`, everyone asked has a row with `what: null`.
 *
 *   - a **delivery** round is opened by a member of the rikma and asks every customer;
 *     its clock runs, and silence matures it;
 *   - a **defects** round is opened by a customer and asks whoever delivered. Silence on it
 *     matures nothing — the version on the table is "not yet", and only the rikma can
 *     answer it, by delivering again.
 *
 * At-cost deals never open one: each part closes on its own there.
 *
 * Pure; the writes live in `$lib/server/deal/receipt`.
 */
import {
  agreedIn,
  answerRound,
  askedIn,
  openRound,
  readRuleVotes,
  roundOf,
  type RuleVote
} from '$lib/fulfillment/consent';

export { readRuleVotes as readReceiptVotes, type RuleVote as ReceiptVote };

export type ReceiptStatus = 'none' | 'delivered' | 'defects' | 'accepted';

export interface ReceiptRound {
  order: number;
  kind: 'delivered' | 'defects';
  byId: string;
  why: string | null;
  zman: string | null;
}

export interface ReceiptState {
  status: ReceiptStatus;
  /** The standing round (0 = nothing said yet). */
  round: number;
  /** Who opened the standing round. */
  openerId: string | null;
  /** Their words — what was delivered, or what is missing. */
  why: string | null;
  /** Customers who still have to answer the standing delivery round. */
  pendingCustomers: string[];
  /** Every round, oldest first. */
  history: ReceiptRound[];
}

/** The first yes of a round is the one who opened it. */
function openerOf(votes: RuleVote[], round: number): RuleVote | null {
  return (
    votes
      .filter((v) => v.order === round && v.what === true)
      .sort((a, b) => (a.zman ?? '').localeCompare(b.zman ?? ''))[0] ?? null
  );
}

export function receiptState(input: {
  votes: RuleVote[];
  customerIds: string[];
  /** `Sheirut.productExepted` — she has it, by her yes or by her silence. */
  accepted?: boolean | null;
}): ReceiptState {
  const customers = new Set(input.customerIds.map(String));
  const votes = input.votes;
  const history: ReceiptRound[] = [];
  for (let order = 1; order <= roundOf(votes); order++) {
    const o = openerOf(votes, order);
    if (!o) continue;
    history.push({ order, kind: customers.has(o.userId) ? 'defects' : 'delivered', byId: o.userId, why: o.why, zman: o.zman });
  }
  const round = roundOf(votes);
  const standing = history.find((h) => h.order === round) ?? null;
  const base = { round, openerId: standing?.byId ?? null, why: standing?.why ?? null, history };
  if (input.accepted === true) return { ...base, status: 'accepted', pendingCustomers: [] };
  if (!standing) return { ...base, status: 'none', pendingCustomers: [] };
  if (standing.kind === 'defects') return { ...base, status: 'defects', pendingCustomers: [] };
  const agreed = new Set(agreedIn(votes, round));
  const pendingCustomers = askedIn(votes, round).filter((u) => customers.has(u) && !agreed.has(u));
  return { ...base, status: pendingCustomers.length === 0 ? 'accepted' : 'delivered', pendingCustomers };
}

/** A member of the rikma says it delivered: a new round that asks every customer. */
export function deliverRound(votes: RuleVote[], memberId: string, customerIds: string[], nowIso: string, why?: string | null): RuleVote[] {
  return openRound(votes, String(memberId), customerIds.map(String), nowIso, why?.trim() || null);
}

/** A customer answers with what is missing: a new round that asks whoever delivered. */
export function defectsRound(votes: RuleVote[], customerId: string, deliveredBy: string | null, nowIso: string, why: string): RuleVote[] {
  return openRound(votes, String(customerId), deliveredBy ? [String(deliveredBy)] : [], nowIso, why.trim());
}

/** A customer's yes on the standing delivery. */
export function acceptRound(votes: RuleVote[], customerId: string, nowIso: string): RuleVote[] {
  return answerRound(votes, String(customerId), nowIso);
}

/** What may be said now, by whom. */
export function canDeliver(state: ReceiptState): boolean {
  return state.status === 'none' || state.status === 'defects';
}

export function canAnswer(state: ReceiptState, userId: string): boolean {
  return state.status === 'delivered' && state.pendingCustomers.includes(String(userId));
}

/** The clock ran out: only a delivery matures, and then every customer asked has it. */
export function maturesOnSilence(state: ReceiptState): boolean {
  return state.status === 'delivered';
}

/** What the deal page shows of the receipt, for one viewer. */
export interface ReceiptView {
  status: ReceiptStatus;
  /** When her silence becomes her receipt (a delivery waiting for her). */
  deadline: string | null;
  history: Array<{ kind: 'delivered' | 'defects'; byName: string; why: string | null; zman: string | null }>;
  /** The viewer is a member of the rikma and may say it was delivered now. */
  canDeliver: boolean;
  /** The viewer is a customer asked about the standing delivery. */
  canAnswer: boolean;
  /** The viewer is a customer who may confirm receipt on her own (nothing delivered yet). */
  canConfirm: boolean;
}

export function receiptView(
  r: { state: ReceiptState; deadline: string | null; memberIds: string[]; customerIds: string[]; names: Record<string, string> },
  viewerId: string
): ReceiptView {
  const me = String(viewerId);
  const isCustomer = r.customerIds.includes(me);
  return {
    status: r.state.status,
    deadline: r.deadline,
    history: r.state.history.map((h) => ({ kind: h.kind, byName: r.names[h.byId] ?? '', why: h.why, zman: h.zman })),
    canDeliver: r.memberIds.includes(me) && canDeliver(r.state),
    canAnswer: isCustomer && canAnswer(r.state, me),
    canConfirm: isCustomer && (r.state.status === 'none' || r.state.status === 'defects')
  };
}
