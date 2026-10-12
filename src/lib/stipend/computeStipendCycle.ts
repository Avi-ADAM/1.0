/**
 * computeStipendCycle — how much is due for one cycle (PLAN_STIPEND §6).
 *
 * The funder never types a number. The amount is derived from hours that were
 * **approved** (a closed `finiapruval`), never from hours merely logged: if the
 * approval is later refused, money has already been paid for work the rikma
 * did not recognise, and there is no elegant way back.
 *
 *     hours  = approved in the window − hours other pledges already metered
 *     amount = min(hours × rate, monthlyCap × months, remaining totalCap,
 *                  program cap, the recipient's remaining equity ÷ α)
 *
 * `months` is how many months the window has opened (see `capMonths`): a
 * settlement that carries two unpaid months forward is owed two ceilings, not
 * one.
 *
 * What the monthly ceiling holds back does not fall. It is `overCap`: the hours
 * stay unmetered, and whether they are paid is the two sides' decision — the
 * funder may choose to pay them, the recipient's receipt is still their yes
 * (or a counter), and only the recipient can let them go
 * (`computeOverCapBalance`).
 *
 * The last two terms of `hours` and of `amount` are the ones that keep the
 * model honest when more than one stipend exists at once: hours the rikma
 * approved are finite, and the equity they bought cannot be given away twice
 * (docs/inprogress/FIXES.md §2).
 */

import type { PartialStipendTerms } from './types.js';
import { normalizeTerms } from './computeStipendEquity.js';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** One approved chunk of work inside the cycle window. */
export interface ApprovedHours {
  /** Hours the rikma approved. */
  hours: number;
  /** When they were approved — decides which cycle they fall into. */
  approvedAt: string | Date;
  /** Market rate on the mission, used for the rate ≤ market guard. */
  perhour?: number | null;
  /** Mission the hours belong to, for a `singleMission`/`selectedMissions` pledge. */
  mesimabetahalichId?: string | null;
}

export interface CycleInput {
  terms: PartialStipendTerms;
  /** Everything approved for this recipient in this rikma. */
  approved: ApprovedHours[];
  cycleStart: string | Date;
  cycleEnd: string | Date;
  /** ₪ already paid under this pledge. */
  paidTotal?: number | null;
  /** ₪ left in the program's budget, when the pledge sits inside one. */
  programRemaining?: number | null;
  /** Missions the pledge covers — empty/undefined means "all of them". */
  missionIds?: string[] | null;
  /**
   * Hours of this recipient that stipend payments have already metered in this
   * rikma — **whichever pledge** wrote them.
   *
   * Approved hours are a finite thing: the rikma signed them once. Each pledge
   * used to know only its own `lastSettledAt`, so two pledges covering the same
   * person each paid for the same hours from scratch (docs/inprogress/FIXES.md §2).
   */
  hoursAlreadyMetered?: number | null;
  /**
   * ₪ of equity debit still available before the recipient's own contribution
   * would go negative — `contribution − Σ equityDebit so far`.
   *
   * `stipendRate ≤ perhour` bounds one hour's rate; nothing bounded the sum,
   * and a live run ended with the recipient at −2.25% of their own rikma.
   * Null = don't check (a gift, or the caller has no figure).
   */
  equityHeadroom?: number | null;
  /**
   * "Now", for counting how many months the window has opened. Defaults to the
   * real clock; the window never counts past `cycleEnd`.
   */
  asOf?: string | Date | null;
  /**
   * Pay past the monthly ceiling too. Only ever true when the funder chose it
   * (and the recipient's receipt is still awaited) — never a default: the
   * ceiling is the agreed term, stepping over it is a new agreement.
   */
  includeOverCap?: boolean;
}

export interface CycleResult {
  /** Approved hours that fall inside the window and inside the pledge's scope. */
  hours: number;
  /** hours × rate, before any cap. */
  gross: number;
  /** What is actually due. */
  amount: number;
  /** Which limit bit, when `amount < gross`. */
  cappedBy: 'monthlyCap' | 'totalCap' | 'programCap' | 'equityFloor' | null;
  /** Months of monthly ceiling this window is owed (≥ 1). */
  capMonths: number;
  /**
   * ₪ the monthly ceiling held back — and only it. Not lost: those hours stay
   * unmetered, so they remain open for the two sides to decide on.
   */
  overCap: number;
  /** Hours this payment pays for (≤ `hours`); the meter moves by this much. */
  paidHours: number;
  /** ₪ left under the pledge's own totalCap after this payment. */
  remainingAfter: number | null;
  /** True when this payment exhausts the pledge — it closes itself (§6). */
  exhausts: boolean;
}

function toTime(v: string | Date | null | undefined): number {
  if (v == null) return NaN;
  const d = v instanceof Date ? v : new Date(String(v));
  return d.getTime();
}

/** `ms` plus `n` calendar months, clamped to the target month's last day (Jan 31 + 1 → Feb 28). */
function addMonthsUTC(ms: number, n: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(
    y,
    m,
    Math.min(d.getUTCDate(), lastDay),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );
}

/**
 * How many monthly ceilings a window starting at `from` is owed by `until`:
 * one for every month that has begun, counted from the window's own start.
 *
 * The ceiling is the funder's protection per month. Applying it once to a
 * window that had carried two unpaid months forward (29 Aug → 12 Oct) paid one
 * month's stipend for two months of approved work; counting calendar months
 * touched would instead give a three-day August a full ceiling of its own.
 */
export function capMonths(from: string | Date, until: string | Date): number {
  const a = toTime(from);
  const b = toTime(until);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 1;
  let n = 1;
  while (n < 1200 && addMonthsUTC(a, n) <= b) n++;
  return n;
}

export function computeStipendCycle(input: CycleInput): CycleResult {
  const terms = normalizeTerms(input.terms);
  const from = toTime(input.cycleStart);
  const to = toTime(input.cycleEnd);
  const scopeIds = input.missionIds && input.missionIds.length > 0 ? new Set(input.missionIds.map(String)) : null;

  let hours = 0;
  for (const a of input.approved ?? []) {
    const at = toTime(a.approvedAt);
    if (!Number.isFinite(at)) continue;
    if (Number.isFinite(from) && at < from) continue;
    if (Number.isFinite(to) && at > to) continue;
    if (scopeIds && !scopeIds.has(String(a.mesimabetahalichId ?? ''))) continue;
    const h = Number(a.hours);
    if (Number.isFinite(h) && h > 0) hours += h;
  }

  // Hours another pledge already paid for are spent, not available again.
  const metered = Math.max(0, Number(input.hoursAlreadyMetered ?? 0) || 0);
  hours = round2(Math.max(0, hours - metered));
  const gross = round2(hours * terms.stipendRate);

  const paidTotal = Math.max(0, Number(input.paidTotal ?? 0) || 0);
  const totalRemaining =
    terms.totalCap == null ? null : Math.max(0, round2(terms.totalCap - paidTotal));
  const programRemaining =
    input.programRemaining == null ? null : Math.max(0, Number(input.programRemaining) || 0);

  // Smallest binding limit wins, and we remember which one so the card can say
  // "this is the last cycle" rather than silently paying less than the hours.
  //
  // The monthly ceiling is applied last and on its own, because it is the one
  // limit two people may agree to step over: what it holds back is not lost,
  // it is `overCap` — hours left open for both of them to decide on.
  let amount = gross;
  let cappedBy: CycleResult['cappedBy'] = null;
  const limits: Array<[number, CycleResult['cappedBy']]> = [];
  const asOf = input.asOf == null ? Date.now() : toTime(input.asOf);
  const until = Number.isFinite(to) && (!Number.isFinite(asOf) || to < asOf) ? to : asOf;
  const months = capMonths(input.cycleStart, new Date(until));
  if (totalRemaining != null) limits.push([totalRemaining, 'totalCap']);
  if (programRemaining != null) limits.push([programRemaining, 'programCap']);
  // The recipient's own equity can never go below zero: the debit is α·P, so
  // the biggest payment their remaining contribution can carry is headroom/α.
  // Only `equity` mode debits anything, and α=0 debits nothing at all.
  if (input.equityHeadroom != null && terms.mode === 'equity' && terms.costShare > 0) {
    limits.push([Math.max(0, Number(input.equityHeadroom) || 0) / terms.costShare, 'equityFloor']);
  }
  for (const [limit, name] of limits) {
    if (amount > limit) {
      amount = limit;
      cappedBy = name;
    }
  }
  const beforeMonthly = round2(Math.max(0, amount));
  const monthlyLimit = terms.monthlyCap == null ? null : round2(terms.monthlyCap * months);
  let overCap = 0;
  if (monthlyLimit != null && amount > monthlyLimit) {
    if (input.includeOverCap) {
      overCap = 0;
    } else {
      amount = monthlyLimit;
      cappedBy = 'monthlyCap';
      overCap = round2(beforeMonthly - monthlyLimit);
    }
  }
  amount = round2(Math.max(0, amount));

  // The hours this payment actually pays for. Under the monthly ceiling that is
  // only its share — the rest stay unmetered and so stay owed (`overCap`). A
  // budget or equity-floor limit is different: the pledge cannot carry more,
  // so those hours are consumed with it, as they always were.
  const paidHours =
    cappedBy === 'monthlyCap' && gross > 0 && amount < gross
      ? round2(Math.min(hours, (hours * amount) / gross))
      : hours;

  const remainingAfter = totalRemaining == null ? null : round2(Math.max(0, totalRemaining - amount));

  return {
    hours,
    gross,
    amount,
    cappedBy: amount < gross ? cappedBy : null,
    capMonths: months,
    overCap,
    paidHours,
    remainingAfter,
    exhausts:
      (remainingAfter != null && remainingAfter <= 0) ||
      (programRemaining != null && programRemaining - amount <= 0)
  };
}

export interface OverCapInput
  extends Omit<CycleInput, 'cycleStart' | 'cycleEnd' | 'hoursAlreadyMetered' | 'includeOverCap'> {
  /** The pledge's own start — nothing approved before it is ever its business. */
  start: string | Date | null | undefined;
  /** `lastSettledAt`: everything before it has been read by some settlement. */
  watermark: string | Date | null | undefined;
  /** Hours metered by payments whose cycle opened in [start, watermark). */
  meteredBefore: number | null | undefined;
}

export interface OverCapBalance {
  hours: number;
  /** What paying them would cost, inside every limit except the monthly one. */
  amount: number;
  cappedBy: CycleResult['cappedBy'];
  /** The stretch the balance covers, for the payment row that settles it. */
  cycleStart: string | null;
  cycleEnd: string | null;
}

/**
 * Hours behind the watermark that were approved and never paid for — what the
 * monthly ceiling held back in earlier settlements.
 *
 * Nothing stores this number. A settlement under the ceiling meters only the
 * hours it paid for (`paidHours`), so the rest are simply approved hours no
 * payment row has metered: `approved in [start, watermark) − metered there`.
 * Paying them, or the recipient letting them go, writes a row that meters them,
 * and the balance goes to zero by itself.
 */
export function computeOverCapBalance(input: OverCapInput): OverCapBalance {
  const empty: OverCapBalance = { hours: 0, amount: 0, cappedBy: null, cycleStart: null, cycleEnd: null };
  const startMs = toTime(input.start);
  const asOf = input.asOf == null ? Date.now() : toTime(input.asOf);
  let markMs = toTime(input.watermark);
  if (!Number.isFinite(markMs)) return empty;
  // An old row may carry a cycle *end* as its watermark — a date still ahead.
  if (Number.isFinite(asOf) && markMs > asOf) markMs = asOf;
  if (Number.isFinite(startMs) && markMs <= startMs) return empty;

  const cycleStart = Number.isFinite(startMs) ? new Date(startMs).toISOString() : new Date(0).toISOString();
  // Hours approved exactly at the watermark belong to the window after it.
  const cycleEnd = new Date(markMs - 1).toISOString();
  const r = computeStipendCycle({
    ...input,
    cycleStart,
    cycleEnd,
    hoursAlreadyMetered: input.meteredBefore,
    includeOverCap: true
  });
  if (r.hours <= 0) return empty;
  return { hours: r.hours, amount: r.amount, cappedBy: r.cappedBy, cycleStart, cycleEnd };
}

/**
 * Where a settlement starts reading approved hours from.
 *
 * Not the start of the calendar window: hours the rikma approved and nobody
 * has paid for do not stop being owed because a month turned over. A funder
 * who settles on the 1st of the next month — the way people actually pay — saw
 * an empty card, and hours approved late in a settled month fell into a gap
 * between the watermark and the next window and were never paid at all
 * (docs/inprogress/FIXES.md §3, §6).
 *
 * So the origin is the **watermark**: everything approved since the last
 * settlement, never anything from before the pledge itself began. The monthly
 * ceiling still bounds it — once for every month the carried window has opened
 * (`capMonths`), so a late settlement is neither inflated nor cut to one month.
 */
export function settlementFrom(
  pledge: { lastSettledAt?: string | null; start?: string | null },
  windowStart: string | Date
): string {
  const startMs = toTime(pledge.start);
  const candidates = [pledge.lastSettledAt, pledge.start, windowStart];
  const first = candidates.find((c) => c != null && c !== '' && Number.isFinite(toTime(c as any)));
  const chosen = first ?? windowStart;
  const chosenMs = toTime(chosen as any);
  // A pledge never pays for work approved before it existed.
  const effective = Number.isFinite(startMs) && chosenMs < startMs ? pledge.start! : chosen;
  return effective instanceof Date ? effective.toISOString() : String(effective);
}

/**
 * The cycle window a settlement belongs to. `cycleSize` is in months, matching
 * the recurring `mashabetahalich` that carries the pledge's life cycle.
 */
export function cycleWindow(
  reference: string | Date,
  cycleSize = 1
): { cycleStart: string; cycleEnd: string } {
  const ref = reference instanceof Date ? new Date(reference) : new Date(String(reference));
  const size = Math.max(1, Math.round(Number(cycleSize) || 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1);
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - (size - 1), 1, 0, 0, 0, 0));
  return { cycleStart: start.toISOString(), cycleEnd: end.toISOString() };
}
