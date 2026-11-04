/**
 * The stage of a deal on its way to money — the ONE place it is computed
 * (docs/inprogress/PLAN_LEADS.md §4.0). The "in progress" table, the board,
 * the KPI strip, the API and the order/sale sync all ask this module.
 *
 * Three kinds of row walk the same path, and none is copied into another:
 *  - a lead — its own status, until an order or a sale linked to it speaks;
 *  - an order with no lead — a buyer who asked for an offer directly;
 *  - a concierge wish proposal (`RatsonProposal`) — an inbound lead that
 *    already has its own consent machinery; only projected here.
 *
 * The rule that holds them together: `offered` means an offer is on the
 * table, and `won` means money — a paid order or a linked sale. Neither is
 * ever chosen from a form.
 */

import type { LeadStatus, PausedReason } from './status';

export type Stage = LeadStatus;

/** Order statuses that are an offer the buyer still has to pay for. */
export const OFFER_ORDER_STATUSES = ['sent', 'seen', 'priced', 'accepted', 'pendingPayment'] as const;
/** Order statuses that mean the money came in. */
export const PAID_ORDER_STATUSES = ['paid', 'shipped', 'fulfilled'] as const;

const OFFER: ReadonlySet<string> = new Set(OFFER_ORDER_STATUSES);
const PAID: ReadonlySet<string> = new Set(PAID_ORDER_STATUSES);

/** What one order says about its deal; `null` for a cancelled one (it says nothing). */
export function stageOfOrder(status: string | null | undefined): 'offered' | 'won' | null {
  if (!status) return null;
  if (PAID.has(status)) return 'won';
  if (OFFER.has(status)) return 'offered';
  return null;
}

export interface MoneyLinks {
  /** Statuses of the orders linked to the lead. */
  orderStatuses?: Array<string | null | undefined>;
  /** How many sales are linked to it. */
  saleCount?: number;
}

/**
 * A lead's stage from its own status and what is linked to it.
 *
 * - Money beats everything: a paid order or a sale ⇒ `won`, whatever the
 *   status says (a member cannot "pause" a customer who has paid).
 * - An open offer ⇒ `offered` — unless a member put the lead aside
 *   (`paused`/`spam`) after the offer went out; their word stands.
 * - A lead the sync had moved to `offered`/`won` whose money link is gone
 *   (the order was cancelled) is back to `talking`: they talked, there is no
 *   deal on the table now.
 */
export function stageOf(lead: { status?: string | null }, links: MoneyLinks = {}): Stage {
  const status = (lead.status ?? 'new') as Stage;
  const orders = (links.orderStatuses ?? []).map(stageOfOrder);
  if ((links.saleCount ?? 0) > 0 || orders.includes('won')) return 'won';
  if (orders.includes('offered') && status !== 'paused' && status !== 'spam') return 'offered';
  if (status === 'offered' || status === 'won') return 'talking';
  return status;
}

/**
 * The status the sync should write when the stage moved, or null when the
 * stored status already says it. Only moves into or out of the derived
 * statuses are the sync's business — everything else is a member's.
 */
export function syncedStatus(lead: { status?: string | null }, links: MoneyLinks): Stage | null {
  const now = (lead.status ?? 'new') as Stage;
  const next = stageOf(lead, links);
  if (next === now) return null;
  const derived = (s: string) => s === 'offered' || s === 'won';
  return derived(next) || derived(now) ? next : null;
}

// ─── concierge wish proposals (§4.0, "incoming wishes") ─────────────────────

export interface ProposalFacts {
  /** `status_proposal`: suggested · viewed · accepted · rejected · expired. */
  status?: string | null;
  hiddenByWisher?: boolean | null;
  /** The rikma answered: a negotiation round, a willingness entry or a forum message. */
  hasConversation?: boolean;
  /** A price is on the table from the rikma (`total_price` / covered_* terms). */
  hasPrice?: boolean;
  /** The deal paid the rikma (169.8: a Sale held in the rikma). */
  hasSale?: boolean;
}

/**
 * A wish proposal's place on the same path. Its own consent clock decides
 * everything; this only says where it stands. "Expired", "rejected" and
 * "hidden" are `paused` with a reason — stopped, not lost.
 */
export function stageOfProposal(p: ProposalFacts): { stage: Stage; pausedReason?: PausedReason } {
  if (p.hasSale) return { stage: 'won' };
  if (p.hiddenByWisher || p.status === 'rejected') return { stage: 'paused', pausedReason: 'choseOther' };
  if (p.status === 'expired') return { stage: 'paused', pausedReason: 'timing' };
  if (p.status === 'accepted' || p.hasPrice) return { stage: 'offered' };
  if (p.hasConversation) return { stage: 'talking' };
  return { stage: 'new' };
}
