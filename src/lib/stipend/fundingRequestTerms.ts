/**
 * The terms a stipend funding request is published with
 * (docs/PLAN_STIPEND.md §12.2, `publishStipendFundingRequest`).
 *
 * An open-mashaabim states its money in three separate places, and they mean
 * three different things:
 *
 *   `price` / `easy` — ₪ for **one unit of one cycle**. `easy` is the
 *        value-for-calc (the ceiling the rikma will pay); every consumer reads
 *        `easy ?? price` and treats the result as a per-cycle rate.
 *   `hm`            — how many **units** per cycle. Not a duration.
 *   `sqadualed` / `sqadualedf` — the **duration**. `montsi()` counts the cycles
 *        from those two dates, and that count is what every display multiplies
 *        by.
 *
 * The publisher used to write the program's month count into `hm` and the
 * program's whole budget into `easy`, so a 36-month, ₪2,400/month program was
 * published as "₪86,400 per cycle × 36 units" — and, being open-ended, was read
 * as ₪3,110,400 *a month*: the budget squared over the month count. Two
 * multiplications of the same duration, on fields that never meant duration.
 *
 * This module is the one place that turns a program into those fields. It is
 * pure and tested because the number it produces is what a would-be funder is
 * being asked to commit to.
 */

import { monthsBetween } from './suggestBudget.js';

/** No end date and no budget to count from: ask for a year. */
const DEFAULT_MONTHS = 12;
/** 50 years. A longer run means a mistyped budget, not a real commitment. */
const MAX_MONTHS = 600;

export interface FundingRequestBasis {
  /** The program's closed budget, when it has one. */
  totalCap: number | null | undefined;
  /** The program's ₪-per-month ceiling, when it has one. */
  monthlyCap: number | null | undefined;
  /** Months of funding the publisher asked for. */
  months?: unknown;
  /** ₪ per month the publisher asked for, overriding the program's own. */
  monthlyAmount?: unknown;
  /** ISO start date. Defaults to `now`. */
  startDate?: unknown;
  /** ISO end date. When given it *defines* the duration — see below. */
  endDate?: unknown;
  /** Reference "today", for tests. */
  now?: Date;
}

export interface FundingRequestTerms {
  /** Cycles the request covers. Always a whole number ≥ 1. */
  months: number;
  /** ₪ per cycle — what `price` and `easy` are both set to. */
  monthly: number;
  /** ₪ over the whole run. For the description only; never a stored field. */
  total: number;
  /** `sqadualed`. */
  startISO: string;
  /** `sqadualedf`, so `montsi()` recovers exactly `months`. */
  endISO: string;
  /** `hm`. One funding stream is one unit per cycle. */
  hm: number;
}

function pos(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toDate(v: unknown): Date | null {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

function clampMonths(n: number): number {
  return Math.min(MAX_MONTHS, Math.max(1, Math.round(n)));
}

/** Money is committed in shekels and agorot, not in floating-point dust. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * `start` plus `n` calendar months, clamped to the end of the target month so
 * that 31/1 + 1 month is 28/2 rather than sliding into March — a slide would
 * make `montsi()` count 1.03 cycles and price the request above its budget.
 */
export function addMonths(start: Date, n: number): Date {
  const day = start.getUTCDate();
  const end = new Date(start.getTime());
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + n);
  const lastOfMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)
  ).getUTCDate();
  end.setUTCDate(Math.min(day, lastOfMonth));
  return end;
}

/**
 * Resolve a program (plus whatever the publisher typed) into the fields the
 * open-mashaabim actually stores.
 *
 * Duration is settled first, and **an explicit end date wins over an explicit
 * month count**: the dates are what every display counts from, so if the two
 * disagree the stored record must follow the dates or the page shows a run
 * length nobody asked for. With no end date the count comes from the asked
 * months, then from budget ÷ monthly ceiling, and only then from the default.
 *
 * The per-cycle amount prefers the program's own `monthlyCap` over
 * `budget ÷ months`: a publisher asking for 12 months of a 36-month program
 * wants a year of the same monthly stipend, not a third of the budget squeezed
 * into a year.
 */
export function resolveFundingRequestTerms(basis: FundingRequestBasis): FundingRequestTerms {
  const start = toDate(basis.startDate) ?? basis.now ?? new Date();
  const end = toDate(basis.endDate);

  const budget = pos(basis.totalCap);
  const monthlyCap = pos(basis.monthlyCap);
  const asked = pos(basis.months);

  const fromDates = end ? monthsBetween(start, end) : null;
  const fromBudget = budget != null && monthlyCap != null ? budget / monthlyCap : null;
  const months = clampMonths(fromDates ?? asked ?? fromBudget ?? DEFAULT_MONTHS);

  const monthly = money(
    pos(basis.monthlyAmount) ?? monthlyCap ?? (budget != null ? budget / months : 0)
  );

  return {
    months,
    monthly,
    total: money(monthly * months),
    startISO: start.toISOString(),
    // A given end date is kept verbatim; only a derived one is built from the
    // month count, so the publisher's own window is never quietly rewritten.
    endISO: (end ?? addMonths(start, months)).toISOString(),
    hm: 1
  };
}
