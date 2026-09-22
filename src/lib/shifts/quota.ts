/**
 * quota — how many "number one" places each member gets in a cycle
 * (docs/PLAN_SHIFTS.md §6.2).
 *
 * The rule, in the sentence the UI shows: **everyone gets the same number,
 * except where their own commitment caps them lower or floors them higher.**
 * That is max-min fair "water-filling": find one common level L such that
 *
 *     sum over members of clamp(L − carry_i, lo_i, hi_i) = slots
 *
 * where lo/hi are the member's agreed `shiftsMin`/`shiftsMax` (a term of their
 * assignment, §3.8) — hi further capped by how many shifts they actually
 * declared themselves available for — and carry_i is what they owe or are owed
 * from earlier cycles (balance.ts). Then round to integers with the largest
 * remainder method so the quotas add up to the number of places *exactly*:
 * naive rounding invents a hole or a phantom extra place.
 *
 * Two edges are reported, never forced (§6.2 point 5):
 *   shortage — sum(hi) < slots: the rikma's commitments cannot cover the cycle.
 *              Known before any draft; it opens the hole card early.
 *   belowMin — sum(lo) > slots: more commitment than work. Nobody's minimum is a
 *              claim on the rikma — no shifts are invented — so quotas drop
 *              below lo evenly and the list says who is affected.
 */

export interface QuotaMember {
  userId: string;
  /** Agreed minimum per cycle (`shiftsMin`). Null = 0. */
  min?: number | null;
  /** Agreed maximum per cycle (`shiftsMax`). Null = no cap. */
  max?: number | null;
  /** Shifts they declared want/can/ifNeeded for this cycle — a hard cap too. */
  available: number;
  /** Carry-over from earlier cycles: positive = took more than their share. */
  carry?: number;
}

export interface QuotaResult {
  quotas: Record<string, number>;
  /** The effective bounds used, for the fairness view and the snapshot. */
  bounds: Record<string, { lo: number; hi: number; carry: number }>;
  /** Places no commitment can cover (sum(hi) < slots). */
  shortage: number;
  /** Members whose quota fell below their agreed minimum (sum(lo) > slots). */
  belowMin: string[];
  /** The common level L (continuous), for explaining the result. */
  level: number;
}

const EPS = 1e-9;
const toInt = (v: number | null | undefined, fallback: number) =>
  v == null || !Number.isFinite(Number(v)) ? fallback : Math.max(0, Math.floor(Number(v)));

interface Bound {
  userId: string;
  lo: number;
  hi: number;
  carry: number;
}

/** sum of clamp(L − c, lo, hi) — monotone non-decreasing in L. */
function fill(bounds: Bound[], L: number): number {
  let s = 0;
  for (const b of bounds) s += Math.min(b.hi, Math.max(b.lo, L - b.carry));
  return s;
}

/**
 * The continuous level at which fill(L) = target, found exactly: between
 * consecutive breakpoints (lo+c, hi+c) the function is linear, so locate the
 * segment and solve it. Assumes sum(lo) ≤ target ≤ sum(hi).
 */
function solveLevel(bounds: Bound[], target: number): number {
  const points = [
    ...new Set(bounds.flatMap((b) => [b.lo + b.carry, b.hi + b.carry]).filter(Number.isFinite))
  ].sort((a, b) => a - b);
  if (points.length === 0) return 0;

  let prev = points[0];
  if (fill(bounds, prev) >= target - EPS) return prev;
  for (const p of points.slice(1)) {
    const f = fill(bounds, p);
    if (f >= target - EPS) {
      const fPrev = fill(bounds, prev);
      const slope = (f - fPrev) / (p - prev);
      return slope > 0 ? prev + (target - fPrev) / slope : p;
    }
    prev = p;
  }
  // Beyond the last finite breakpoint only uncapped members still rise.
  const slope = bounds.filter((b) => b.hi === Infinity && prev >= b.lo + b.carry).length;
  return slope > 0 ? prev + (target - fill(bounds, prev)) / slope : prev;
}

/**
 * Largest remainder: floor everything, then hand the missing units to the
 * biggest fractional parts. Ties go to whoever is owed more (lower carry),
 * then by user id so the result never depends on input order.
 */
function roundToTotal(bounds: Bound[], continuous: number[], total: number): number[] {
  const floors = continuous.map((q) => Math.floor(q + EPS));
  let missing = total - floors.reduce((a, b) => a + b, 0);
  const order = continuous
    .map((q, i) => ({ i, frac: q - floors[i] }))
    .filter(({ i }) => floors[i] < bounds[i].hi)
    .sort(
      (a, b) =>
        b.frac - a.frac ||
        bounds[a.i].carry - bounds[b.i].carry ||
        bounds[a.i].userId.localeCompare(bounds[b.i].userId)
    );
  for (const { i } of order) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors;
}

export function computeQuotas(slots: number, members: QuotaMember[]): QuotaResult {
  const target = Math.max(0, Math.floor(slots));
  const bounds: Bound[] = members.map((m) => {
    const available = toInt(m.available, 0);
    const hi = Math.min(m.max == null ? Infinity : toInt(m.max, 0), available);
    // A minimum above what they can actually do is not a minimum.
    const lo = Math.min(toInt(m.min, 0), hi);
    return { userId: String(m.userId), lo, hi, carry: Number(m.carry) || 0 };
  });

  const sumLo = bounds.reduce((a, b) => a + b.lo, 0);
  const sumHi = bounds.reduce((a, b) => a + b.hi, 0);
  const result = (values: number[], level: number, shortage: number, belowMin: string[]): QuotaResult => ({
    quotas: Object.fromEntries(bounds.map((b, i) => [b.userId, values[i]])),
    bounds: Object.fromEntries(bounds.map((b) => [b.userId, { lo: b.lo, hi: b.hi, carry: b.carry }])),
    shortage,
    belowMin,
    level
  });

  if (bounds.length === 0) return result([], 0, target, []);

  // Not enough commitment to go round: everyone at their cap, the rest is shortage.
  if (sumHi <= target) {
    return result(bounds.map((b) => b.hi), Infinity, target - sumHi, []);
  }

  // More commitment than work: water-fill *down* inside [0, lo] instead.
  if (sumLo > target) {
    const down = bounds.map((b) => ({ ...b, hi: b.lo, lo: 0 }));
    const L = solveLevel(down, target);
    const values = roundToTotal(down, down.map((b) => Math.min(b.hi, Math.max(b.lo, L - b.carry))), target);
    return result(values, L, 0, bounds.filter((b, i) => values[i] < b.lo).map((b) => b.userId).sort());
  }

  const L = solveLevel(bounds, target);
  const continuous = bounds.map((b) => Math.min(b.hi, Math.max(b.lo, L - b.carry)));
  return result(roundToTotal(bounds, continuous, target), L, 0, []);
}
