/**
 * The budget a stipend proposal should already be holding when the form opens
 * (docs/PLAN_STIPEND.md §6).
 *
 * Nobody should have to compute the ceiling by hand. Every input it needs is
 * already on the table the moment a mission is chosen: the stipend pays
 * `hours × stipendRate`, and the mission says how many hours it is. So the
 * number is *derived* and merely offered — the member can overwrite it, which
 * is the point of a proposal.
 *
 * The mission's own shape decides which ceiling is the honest one:
 *
 *   one-off (`recurring: false`) — the work has a size. `rate × hours` is the
 *       whole budget, and it is a **closed total**.
 *   recurring (`iskvua`) — the hours are per month, so `rate × hours` is a
 *       **monthly** amount. Whether that adds up to a final number depends on
 *       whether the mission ends: with a start and an end date the months are
 *       countable and the total is defined; without an end date there is no
 *       total to state, only "this much a month, until someone stops it".
 *
 * Pure and unit-tested, because it is the number members vote on.
 */

/** What the form is being told about the work. */
export interface StipendBudgetBasis {
  /** ₪ per hour the stipend pays. */
  stipendRate: number | null | undefined;
  /** Hours on the mission — per month when it is recurring. */
  hours: number | null | undefined;
  /** `iskvua`: a standing monthly commitment rather than a one-off. */
  recurring: boolean;
  /** The mission's start date, when it has one. */
  start?: string | null;
  /** The mission's end date. Null on a recurring mission = no end planned. */
  end?: string | null;
  /** Reference "today", for counting months from an unstarted mission. */
  now?: Date;
}

export interface StipendBudgetSuggestion {
  /** Which ceiling the form should be on: a closed total or a monthly one. */
  shape: 'total' | 'monthly';
  /** ₪ for the whole stipend, when that is a defined number. */
  totalCap: number | null;
  /** ₪ per month — set whenever the mission is recurring. */
  monthlyCap: number | null;
  /** `rate × hours` — the monthly amount when recurring, the total when not. */
  amount: number;
  /** How many months the total covers, when it was counted from dates. */
  months: number | null;
  /** Recurring with no end date: there is no final number, and that is honest. */
  openEnded: boolean;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Money is proposed in whole shekels; the vote is not about agorot. */
function round(n: number): number {
  return Math.round(n);
}

/**
 * Whole months from `start` to `end`, at least 1 — a stipend that runs for any
 * part of a month still pays that month's cycle, so rounding down to 0 would
 * suggest a budget of nothing. Returns null when the dates cannot be counted.
 */
export function monthsBetween(start: string | Date, end: string | Date): number | null {
  const a = start instanceof Date ? start : new Date(start);
  const b = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  if (b.getTime() <= a.getTime()) return null;
  const months =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 +
    (b.getUTCMonth() - a.getUTCMonth()) +
    // A remainder of days is another cycle, not a rounding error.
    (b.getUTCDate() > a.getUTCDate() ? 1 : 0);
  return Math.max(1, months);
}

/**
 * The budget to prefill. Returns null when there is nothing to derive from —
 * no rate yet, or a mission with no hours on it — and then the member types
 * the number themselves, exactly as before.
 */
export function suggestStipendBudget(
  basis: StipendBudgetBasis
): StipendBudgetSuggestion | null {
  const rate = num(basis.stipendRate);
  const hours = num(basis.hours);
  if (rate <= 0 || hours <= 0) return null;

  const amount = round(rate * hours);

  if (!basis.recurring) {
    // A one-off mission is its own ceiling: this much work, at this rate.
    return { shape: 'total', totalCap: amount, monthlyCap: null, amount, months: null, openEnded: false };
  }

  // Recurring: the amount is monthly. A mission that has not started yet still
  // has a countable horizon if it names its end — it starts when it starts, so
  // "now" stands in for the missing start date rather than voiding the count.
  const from = basis.start ?? (basis.now ?? new Date()).toISOString();
  const months = basis.end ? monthsBetween(from, basis.end) : null;

  if (months == null) {
    return { shape: 'monthly', totalCap: null, monthlyCap: amount, amount, months: null, openEnded: true };
  }

  return {
    shape: 'total',
    totalCap: round(amount * months),
    monthlyCap: amount,
    amount,
    months,
    openEnded: false
  };
}
