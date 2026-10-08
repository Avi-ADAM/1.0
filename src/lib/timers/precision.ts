/**
 * How precise a work hour and its money are — one rule for every place that
 * counts, stores or shows them.
 *
 * A timer measures milliseconds, so the hours it filed used to carry the seconds
 * with them: 8h + 6h39m + 21m04s came to 15.0013 hours, which at 150 ₪ an hour
 * is 2,250.20 ₪ against a price agreed at 2,250 — and the deal page told the
 * customer that 0.20 ₪ had been "approved above the agreed price". Nobody worked
 * those twenty agorot; they are the second hand of a clock (QA_CONCIERGE_E2E C-14).
 *
 *  - **Hours are counted in whole minutes.** A filed figure is rounded to the
 *    nearest minute, so up to 29 seconds either way is no one's claim. The value
 *    is kept to six decimals (a minute is 0.016667 h), which is exact enough for
 *    `× 60` to land back on the whole minute and clean enough not to grow float
 *    dust in a sum.
 *  - **Money is counted in agorot** (two decimals), and a value is always priced
 *    from the rounded hours: `roundMoney(roundHours(h) × rate)`.
 *  - **An overrun smaller than 1 ₪, or than a minute of the line's own work, is
 *    noise** — still never charged (the cap rule does not change), but not
 *    reported to anyone as a claim either.
 */

/** One minute, in hours. */
export const MINUTE_HOURS = 1 / 60;

/** Below this an amount above the agreed price is not worth a line (₪, or the deal's currency). */
export const OVERRUN_MIN_MONEY = 1;

function finite(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** Hours to the nearest whole minute. Junk (NaN, null, a string) is 0. */
export function roundHours(hours: unknown): number {
  const h = finite(hours);
  const minutes = Math.round(h * 60);
  // 6 decimals: 20 minutes is 0.333333, and 0.333333 × 60 rounds back to 20.
  const v = Math.round((minutes / 60) * 1e6) / 1e6;
  return Object.is(v, -0) ? 0 : v;
}

/** Hours of a span of milliseconds, to the nearest whole minute. */
export function hoursOfMs(ms: unknown): number {
  return roundHours(finite(ms) / 3_600_000);
}

/**
 * Hours as a person reads them: whole minutes, shown to two decimals — 15h00m04s
 * is `15`, 15h20m is `15.33`. For display only; what is stored is `roundHours`.
 */
export function displayHours(hours: unknown): number {
  return Math.round(roundHours(hours) * 100) / 100;
}

/** Money to the agora, without floating-point dust (1.005 → 1.01). */
export function roundMoney(amount: unknown): number {
  const n = finite(amount);
  const v = Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;
  return Object.is(v, -0) ? 0 : v;
}

/** What `hours` of work are worth at `rate`: whole minutes, priced to the agora. */
export function workValue(hours: unknown, rate: unknown): number {
  return roundMoney(roundHours(hours) * finite(rate));
}

/**
 * Whether an amount approved above the agreed price is a real claim — at least
 * 1 ₪, and at least a minute of work at the line's hourly rate when that is known.
 * Anything smaller is what a clock's seconds or a float's last digit leave behind.
 */
export function isRealOverrun(amount: unknown, ratePerHour?: unknown): boolean {
  const a = roundMoney(amount);
  if (!(a >= OVERRUN_MIN_MONEY)) return false;
  const rate = finite(ratePerHour);
  if (rate > 0 && roundHours(a / rate) < MINUTE_HOURS - 1e-9) return false;
  return true;
}
