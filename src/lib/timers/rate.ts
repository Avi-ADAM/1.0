/**
 * Pricing logged hours (PLAN_OBJECT_ARCHIVAL — hourly-value changes).
 *
 * An hour is worth what the mission was worth **when it was worked**, not what
 * it is worth when someone finally approves it. Before this module the rate
 * was read from the mission at close time in four places, so a single approved
 * `editObject` re-priced every hour the mission had ever accumulated —
 * including hours the rikma had already signed off months earlier.
 *
 * The fix is a stamp that travels with the hours: Timer.rate → Finiapruval.perhour
 * → FinnishedMission.perhour. This module holds the arithmetic all four call
 * sites share, so they cannot drift apart again.
 *
 * **Legacy is null.** Rows and timers written before the stamp existed carry
 * no rate, and for them the mission's current value is still the only answer
 * there is — `resolveRate` falls back to exactly the behaviour of the day they
 * were written.
 */

/** One FinnishedMission row, as every caller's query returns it. */
export interface RateRow {
  id: string;
  noofhours: number;
  /** null on legacy rows — read through `rowRate`, never directly. */
  perhour: number | null;
}

/** Float money compared at the cent, so 12.5 stays 12.5 across a JSON round-trip. */
const EPSILON = 1e-6;

export function sameRate(a: number | null | undefined, b: number | null | undefined): boolean {
  const x = toNum(a);
  const y = toNum(b);
  if (x == null || y == null) return x == null && y == null;
  return Math.abs(x - y) < EPSILON;
}

function toNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * The rate these hours were worked at: the first stamp that exists, in the
 * order the stamp was copied (finiapruval ← timer ← mission). Everything
 * unstamped ends at the mission's live value, which is what the code did
 * before stamps existed.
 */
export function resolveRate(...candidates: Array<number | null | undefined>): number {
  for (const c of candidates) {
    const n = toNum(c);
    if (n != null) return n;
  }
  return 0;
}

/** A row's own rate; a legacy row is read at whatever rate is being applied. */
export function rowRate(row: RateRow, fallback: number): number {
  return toNum(row?.perhour) ?? fallback;
}

/**
 * The row these hours belong on. One row per rate era: hours worked at ₪50
 * grow the ₪50 row, hours worked at ₪80 open a new one. Returning null means
 * "this era has no row yet" — the caller creates it.
 *
 * A legacy row (no stamp) matches anything, so a rikma that never changed its
 * rate keeps accumulating into the single row it always had.
 */
export function pickRateRow(rows: RateRow[] | null | undefined, rate: number): RateRow | null {
  const list = rows ?? [];
  const legacy = list.find((r) => toNum(r?.perhour) == null);
  const exact = list.find((r) => sameRate(r?.perhour, rate));
  return exact ?? legacy ?? null;
}

/**
 * Σ hours and Σ value across rate eras — what the mission is actually worth
 * when several rates are stacked on it. Never `Σ hours × currentRate`: that is
 * the bug this module exists to prevent.
 */
export function sumRowsValue(
  rows: RateRow[] | null | undefined,
  fallback: number,
): { hours: number; value: number } {
  let hours = 0;
  let value = 0;
  for (const row of rows ?? []) {
    const h = toNum(row?.noofhours) ?? 0;
    hours += h;
    value += h * rowRate(row, fallback);
  }
  return { hours, value };
}

/**
 * The average rate a mixed-rate total works out to. A collapsed row still has
 * to carry *some* `perhour`, and the only one that keeps `noofhours × perhour`
 * equal to `total` is the blend.
 */
export function blendedRate(hours: number, value: number, fallback: number): number {
  if (!(hours > 0)) return fallback;
  return value / hours;
}

/** Hours in a list of timer segments; an open segment runs until `now`. */
export function segmentHours(
  segments: Array<{ start?: string | null; stop?: string | null }> | null | undefined,
  now: number = Date.now(),
): number {
  let total = 0;
  for (const seg of segments ?? []) {
    if (!seg?.start) continue;
    const start = new Date(seg.start).getTime();
    if (Number.isNaN(start)) continue;
    const stopRaw = seg.stop ? new Date(seg.stop).getTime() : now;
    const stop = Number.isNaN(stopRaw) ? now : stopRaw;
    if (stop > start) total += (stop - start) / 3_600_000;
  }
  return total;
}
