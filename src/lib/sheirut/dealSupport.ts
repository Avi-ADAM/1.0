/**
 * A symbolic price, or none: a fixed price below what the work is worth
 * (docs/inprogress/PLAN_DEAL_PRICING_TRACKS.md §5, P7).
 *
 *     planValue = Σ the plan's lines (hours × rate + resource prices)   // what the work is worth
 *     price     = the fixed price agreed                               // what she pays
 *     support   = max(0, planValue − price)                            // what the providers give
 *
 * "Help" is not a stored value: it is this gap, and it is continuous — no threshold turns
 * a deal into help. A discount is the same thing, smaller. The gift is the providers',
 * never hers, so each of them says yes to it themselves: their silence does not give
 * their work away (§5.2, `matureWishProposal`).
 *
 * Pure.
 */
import { effectivePricingTrack } from './pricingTrack';

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const nonNeg = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export type SupportKind = 'none' | 'discount' | 'help';

export interface DealSupport {
  planValue: number;
  price: number;
  /** What the providers give: max(0, planValue − price). */
  support: number;
  /** `help` — nothing is paid; `discount` — part of it is; `none` — all of it. */
  kind: SupportKind;
}

export function dealSupport(planValue: unknown, price: unknown): DealSupport {
  const plan = money(nonNeg(planValue));
  const paid = money(nonNeg(price));
  const support = money(Math.max(0, plan - paid));
  const kind: SupportKind = support < 0.005 ? 'none' : paid < 0.005 ? 'help' : 'discount';
  return { planValue: plan, price: paid, support, kind };
}

/**
 * The price of a deal, from what she said she can pay and what the plan is worth. On a
 * fixed price with an amount given (0 included — `bounti`), she pays that amount, but
 * never more than the plan the providers offered. Anything else pays the plan, as before.
 */
export function fixedDealPrice(input: { track: unknown; given: unknown; amount: unknown; planValue: unknown }): number {
  const plan = money(nonNeg(input.planValue));
  if (effectivePricingTrack(input.track) !== 'fixed' || input.given !== true) return plan;
  return money(Math.min(nonNeg(input.amount), plan));
}

/** Whether the providers of this wish give part of their work (the price is below the plan). */
export function wishGivesSupport(input: { track: unknown; given: unknown; amount: unknown; planValue: unknown }): boolean {
  return dealSupport(input.planValue, fixedDealPrice(input)).kind !== 'none';
}

/**
 * One line's part of the price, split by what each line is worth (§7.2), and the part
 * of its worth its provider gives.
 */
export function lineShare(input: { value: unknown; planValue: unknown; price: unknown }): { money: number; gift: number } {
  const value = nonNeg(input.value);
  const plan = nonNeg(input.planValue);
  const got = plan > 0 ? money((nonNeg(input.price) * value) / plan) : 0;
  return { money: Math.min(got, money(value)), gift: money(Math.max(0, value - got)) };
}
