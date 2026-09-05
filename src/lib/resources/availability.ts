/**
 * availability — the single source of truth for "is this resource free?"
 * (docs/PLAN_RESOURCE_CALENDAR.md §3).
 *
 * Pure and deterministic, so the same answer is produced by the action that
 * opens a hold, by the calendar that paints the month, and by the matching
 * engine that decides whether to suggest the resource at all. If those three
 * ever disagree, someone books a projector that is already in another city.
 *
 * Two rules carry the whole module:
 *
 *  1. **Availability is derived, never stored.** `Sp.panui` is a cache, not a
 *     gate. What is stored is the booking ledger; free-ness is computed.
 *  2. **Concurrency is a peak, not a sum.** Three bookings inside one month do
 *     not take three units unless they actually overlap each other. Everything
 *     here runs a sweep over the interval boundaries for that reason.
 *
 * And one thing this module deliberately does *not* do: say no. A range that
 * only partly fits comes back as `partial` with the windows that do fit, so the
 * caller can offer a date counter-proposal instead of a rejection — the same
 * "no absolute no" rule the rest of the consent system follows.
 */

import type {
  AvailabilityModel,
  AvailabilityResult,
  BookingLike,
  Granularity,
  Range,
  ResourceLike,
  UsageSlice
} from './types.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const INF = Number.POSITIVE_INFINITY;

/** Statuses that hold capacity. A lapsed `hold` is filtered out separately. */
const HOLDING_STATUSES = new Set(['hold', 'confirmed', 'active']);

// ── coercion ────────────────────────────────────────────────────────────────

/** Milliseconds, or NaN. `null`/`undefined` become `+Infinity` (open-ended). */
function ms(value: Date | string | null | undefined, whenNull = INF): number {
  if (value == null) return whenNull;
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isNaN(t) ? NaN : t;
}

function toDate(t: number): Date | null {
  return Number.isFinite(t) ? new Date(t) : null;
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Normalize a `Range`-ish pair into finite-or-Infinity milliseconds. */
function span(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  return { s: ms(start, -INF), e: ms(end, INF) };
}

// ── the possession axis ─────────────────────────────────────────────────────

/**
 * `availability` when the field is set, otherwise derived from `kindOf`.
 *
 * The derivation is deliberately conservative: `total` becomes `consumable`,
 * not `unlimited`, because that is exactly how it behaves today. A resource
 * recorded as "one-time" stays one-time until its holder says otherwise —
 * flipping it automatically would re-offer things that no longer exist.
 */
export function deriveAvailability(resource: ResourceLike | null | undefined): AvailabilityModel {
  const explicit = resource?.availability;
  if (
    explicit === 'exclusive' ||
    explicit === 'pooled' ||
    explicit === 'unlimited' ||
    explicit === 'consumable'
  ) {
    return explicit;
  }
  switch (resource?.kindOf) {
    case 'perUnit':
      return 'pooled';
    case 'rent':
    case 'monthly':
    case 'yearly':
      return 'exclusive';
    case 'total':
    default:
      return 'consumable';
  }
}

/** How many units exist. `unlimited` is `Infinity`; `exclusive` is always 1. */
export function capacityOf(resource: ResourceLike | null | undefined): number {
  const model = deriveAvailability(resource);
  if (model === 'unlimited') return INF;
  if (model === 'exclusive') return 1;
  const raw = resource?.capacity ?? resource?.hm ?? 1;
  const n = num(raw, 1);
  return n > 0 ? n : 1;
}

/** The holder's own offer window, as a `Range` (nulls kept as unbounded). */
export function offerWindow(resource: ResourceLike | null | undefined): Range | null {
  const s = resource?.sdate == null ? null : new Date(resource.sdate);
  const e = resource?.fdate == null ? null : new Date(resource.fdate);
  if (s == null && e == null) return null;
  return { start: s ?? new Date(-8640000000000000), end: e };
}

// ── the ledger ──────────────────────────────────────────────────────────────

/**
 * Does this booking hold capacity right now?
 *
 * A missing status counts as holding. That is the safe direction: an
 * unrecognised row should not silently free a resource someone is using.
 */
export function isHolding(booking: BookingLike, now: Date = new Date()): boolean {
  const status = booking?.status == null ? 'confirmed' : String(booking.status);
  if (!HOLDING_STATUSES.has(status)) return false;
  if (status !== 'hold') return true;
  const expires = ms(booking.holdExpiresAt, INF);
  if (Number.isNaN(expires)) return true;
  return expires > now.getTime();
}

interface Seg {
  s: number;
  e: number;
  q: number;
  booking: BookingLike;
}

/**
 * Live bookings as millisecond segments, each widened by `leadTimeHours` on
 * both sides so a required gap between bookings reads as occupancy.
 */
function segmentsOf(
  bookings: readonly BookingLike[] | null | undefined,
  now: Date,
  leadMs: number
): Seg[] {
  const out: Seg[] = [];
  for (const booking of bookings ?? []) {
    if (!booking || !isHolding(booking, now)) continue;
    const { s, e } = span(booking.start, booking.end);
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    const q = Math.max(0, num(booking.quantity, 1));
    if (q === 0) continue;
    const start = s === -INF ? -INF : s - leadMs;
    const end = e === INF ? INF : e + leadMs;
    if (!(end > start)) continue;
    out.push({ s: start, e: end, q, booking });
  }
  return out;
}

/**
 * Concurrent usage across `[from, to)`, as consecutive slices.
 *
 * This is the sweep that makes "peak, not sum" true: boundaries are the
 * clipped segment edges, and each slice sums only the segments actually
 * covering it.
 */
function profile(segs: readonly Seg[], from: number, to: number): { s: number; e: number; q: number }[] {
  if (!(to > from)) return [];
  const points = new Set<number>([from]);
  for (const seg of segs) {
    if (seg.s > from && seg.s < to) points.add(seg.s);
    if (seg.e > from && seg.e < to) points.add(seg.e);
  }
  const sorted = [...points].sort((a, b) => a - b);
  sorted.push(to);

  const slices: { s: number; e: number; q: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (!(e > s)) continue;
    let q = 0;
    for (const seg of segs) if (seg.s <= s && seg.e > s) q += seg.q;
    slices.push({ s, e, q });
  }
  return slices;
}

/** Merge touching slices that share a quantity, so the output stays readable. */
function coalesce(slices: { s: number; e: number; q: number }[]) {
  const out: { s: number; e: number; q: number }[] = [];
  for (const slice of slices) {
    const last = out[out.length - 1];
    if (last && last.e === slice.s && last.q === slice.q) last.e = slice.e;
    else out.push({ ...slice });
  }
  return out;
}

/**
 * Merge touching slices regardless of quantity. Free windows must be merged
 * this way: two adjacent slices with 0 and 1 units booked are both free under a
 * capacity of 3, and reporting them separately would make a continuous week
 * look like two half-weeks — which `nextFreeFrom` would then reject as too
 * short for a week-long request.
 */
function coalesceAdjacent(slices: { s: number; e: number }[]) {
  const out: { s: number; e: number }[] = [];
  for (const slice of slices) {
    const last = out[out.length - 1];
    if (last && last.e === slice.s) last.e = slice.e;
    else out.push({ s: slice.s, e: slice.e });
  }
  return out;
}

// ── public geometry helpers ─────────────────────────────────────────────────

/**
 * Do two ranges overlap? Touching edges do **not** — ranges are half-open, so
 * a booking that ends at 14:00 leaves the resource free at 14:00.
 */
export function overlaps(a: Range, b: Range, leadTimeHours = 0): boolean {
  return overlapMs(a, b, leadTimeHours) > 0;
}

/** Overlapping milliseconds (0 when disjoint, `Infinity` when both are open). */
export function overlapMs(a: Range, b: Range, leadTimeHours = 0): number {
  const lead = Math.max(0, num(leadTimeHours, 0)) * MS_PER_HOUR;
  const A = span(a?.start, a?.end);
  const B = span(b?.start, b?.end);
  if (Number.isNaN(A.s) || Number.isNaN(A.e) || Number.isNaN(B.s) || Number.isNaN(B.e)) return 0;
  const start = Math.max(A.s, B.s - lead);
  const end = Math.min(A.e, B.e === INF ? INF : B.e + lead);
  if (!(end > start)) return 0;
  return end - start;
}

/** Overlapping days, fractional. `Infinity` only when both ranges are open. */
export function overlapDays(a: Range, b: Range, leadTimeHours = 0): number {
  const overlap = overlapMs(a, b, leadTimeHours);
  return overlap === INF ? INF : overlap / MS_PER_DAY;
}

/** Length of a range in days. `Infinity` when open-ended. */
export function rangeDays(range: Range): number {
  const { s, e } = span(range?.start, range?.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  if (e === INF || s === -INF) return INF;
  return Math.max(0, (e - s) / MS_PER_DAY);
}

/**
 * Peak concurrent units in use inside `range` — the number that must stay at
 * or under `capacityOf(resource)`.
 */
export function peakBookedQuantity(
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  options: { now?: Date; leadTimeHours?: number } = {}
): number {
  const now = options.now ?? new Date();
  const lead = Math.max(0, num(options.leadTimeHours, 0)) * MS_PER_HOUR;
  const { s, e } = span(range?.start, range?.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  const slices = profile(segmentsOf(bookings, now, lead), s, e);
  let peak = 0;
  for (const slice of slices) if (slice.q > peak) peak = slice.q;
  return peak;
}

/** The usage profile inside `range`, for painting a heat strip on the calendar. */
export function usageProfile(
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  options: { now?: Date; leadTimeHours?: number } = {}
): UsageSlice[] {
  const now = options.now ?? new Date();
  const lead = Math.max(0, num(options.leadTimeHours, 0)) * MS_PER_HOUR;
  const { s, e } = span(range?.start, range?.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return [];
  return coalesce(profile(segmentsOf(bookings, now, lead), s, e)).map((slice) => ({
    start: new Date(slice.s),
    end: toDate(slice.e),
    quantity: slice.q
  }));
}

/**
 * Sub-ranges of `range` where at least `quantity` units are free, clipped to
 * the holder's own `sdate..fdate`.
 */
export function freeWindows(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  quantity = 1,
  options: { now?: Date } = {}
): Range[] {
  const capacity = capacityOf(resource);
  const wanted = Math.max(0, num(quantity, 1)) || 1;
  if (capacity === INF) {
    const clipped = clipToOffer(resource, range);
    return clipped ? [clipped] : [];
  }

  const clipped = clipToOffer(resource, range);
  if (!clipped) return [];

  const now = options.now ?? new Date();
  const lead = Math.max(0, num(resource?.leadTimeHours, 0)) * MS_PER_HOUR;
  const { s, e } = span(clipped.start, clipped.end);
  const slices = coalesce(profile(segmentsOf(bookings, now, lead), s, e));

  const free: { s: number; e: number }[] = [];
  for (const slice of slices) {
    if (slice.q + wanted <= capacity) free.push({ s: slice.s, e: slice.e });
  }
  return coalesceAdjacent(free).map((slice) => ({
    start: new Date(slice.s),
    end: toDate(slice.e)
  }));
}

/** `range` clipped to the holder's offer window, or null when they are disjoint. */
function clipToOffer(resource: ResourceLike | null | undefined, range: Range): Range | null {
  const R = span(range?.start, range?.end);
  if (Number.isNaN(R.s) || Number.isNaN(R.e)) return null;
  const W = span(resource?.sdate, resource?.fdate);
  const s = Math.max(R.s, Number.isNaN(W.s) ? -INF : W.s);
  const e = Math.min(R.e, Number.isNaN(W.e) ? INF : W.e);
  if (!(e > s)) return null;
  return { start: new Date(s === -INF ? -8640000000000000 : s), end: toDate(e) };
}

// ── the answer ──────────────────────────────────────────────────────────────

/**
 * Can `quantity` units of `resource` be held across `range`?
 *
 * `partial` is the interesting case and the reason this returns a shape rather
 * than a boolean: it carries the windows that *do* fit, which is what a date
 * counter-proposal is built from.
 */
export function checkAvailability(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  quantity = 1,
  options: { now?: Date } = {}
): AvailabilityResult {
  if (deriveAvailability(resource) === 'unlimited') return { kind: 'unlimited', dateFit: 1 };

  const requestedDays = rangeDays(range);
  if (requestedDays === 0) return { kind: 'available', dateFit: 1, freeWindows: [] };

  const clipped = clipToOffer(resource, range);
  if (!clipped) return { kind: 'outOfWindow', dateFit: 0, window: offerWindow(resource) };

  const now = options.now ?? new Date();
  const windows = freeWindows(resource, bookings, range, quantity, { now });
  const freeDays = windows.reduce((sum, w) => sum + rangeDays(w), 0);

  // The clipped range is the most that could ever be granted, so a full fit is
  // measured against it — a request that runs past `fdate` is partial, not
  // available, even when nothing is booked.
  const grantableDays = rangeDays(clipped);
  const fits = freeDays >= grantableDays && grantableDays >= requestedDays;
  if (fits) return { kind: 'available', dateFit: 1, freeWindows: windows };

  const conflicts = conflictsIn(resource, bookings, clipped, quantity, now);

  if (freeDays <= 0) {
    return {
      kind: 'taken',
      dateFit: 0,
      nextFreeFrom: nextFreeFrom(resource, bookings, range, quantity, { now }),
      conflicts
    };
  }

  const dateFit = requestedDays === INF ? 0 : Math.min(1, freeDays / requestedDays);
  return { kind: 'partial', dateFit, freeWindows: windows, freeDays, requestedDays, conflicts };
}

/** The live bookings standing in the way inside `range`. */
function conflictsIn(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  quantity: number,
  now: Date
): BookingLike[] {
  const lead = Math.max(0, num(resource?.leadTimeHours, 0));
  const out: BookingLike[] = [];
  for (const booking of bookings ?? []) {
    if (!booking || !isHolding(booking, now)) continue;
    const other: Range = {
      start: new Date(booking.start),
      end: booking.end == null ? null : new Date(booking.end)
    };
    if (overlaps(range, other, lead)) out.push(booking);
  }
  return out;
}

/**
 * Earliest moment from `range.start` onward at which `quantity` units are free
 * for the *length* of the request. `null` when that never happens inside the
 * holder's offer window.
 */
export function nextFreeFrom(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  range: Range,
  quantity = 1,
  options: { now?: Date } = {}
): Date | null {
  if (deriveAvailability(resource) === 'unlimited') return range?.start ?? null;

  const R = span(range?.start, range?.end);
  if (Number.isNaN(R.s)) return null;
  const needed = R.e === INF ? INF : R.e - R.s;

  // Look ahead from the request start to the end of the offer window, or a
  // year past the request when the offer window is open-ended.
  const W = span(resource?.sdate, resource?.fdate);
  const horizonEnd = Number.isNaN(W.e) || W.e === INF ? R.s + 365 * MS_PER_DAY : W.e;
  const searchFrom = Math.max(R.s, Number.isNaN(W.s) ? -INF : W.s);
  if (!(horizonEnd > searchFrom)) return null;

  const windows = freeWindows(
    resource,
    bookings,
    { start: new Date(searchFrom), end: new Date(horizonEnd) },
    quantity,
    options
  );
  for (const window of windows) {
    const length = window.end == null ? INF : window.end.getTime() - window.start.getTime();
    if (needed === INF ? window.end == null : length >= needed) return window.start;
  }
  return null;
}

// ── writing side ────────────────────────────────────────────────────────────

/**
 * Round a range out to whole days when the resource is day-granular, so a
 * half-day rental still blocks the whole day on the calendar. Hour-granular
 * resources (a meeting room) are left alone.
 *
 * Granularity is a display and write-time concern only — nothing above reads
 * it, so a wrong value can never change whether two bookings collide.
 */
export function roundToGranularity(range: Range, granularity: Granularity | string | null | undefined): Range {
  if (granularity !== 'day') return range;
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  let end: Date | null = null;
  if (range.end != null) {
    end = new Date(range.end);
    if (end.getHours() || end.getMinutes() || end.getSeconds() || end.getMilliseconds()) {
      end.setHours(0, 0, 0, 0);
      end = new Date(end.getTime() + MS_PER_DAY);
    }
  }
  return { start, end };
}

/**
 * Holds that must be auto-cancelled when `winner` is confirmed: every other
 * live booking on the same resource whose range overlaps and which no longer
 * fits under capacity alongside it (§2.2, and the answer to open question 3 —
 * approving one proposal releases the other rather than leaving two claims on
 * the same week).
 *
 * Only `hold` rows are returned. A `confirmed` or `active` booking is somebody
 * else's standing agreement and is never cancelled by this path.
 */
export function conflictingHolds(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  winner: BookingLike,
  options: { now?: Date } = {}
): BookingLike[] {
  if (deriveAvailability(resource) === 'unlimited') return [];
  const now = options.now ?? new Date();
  const capacity = capacityOf(resource);
  const lead = Math.max(0, num(resource?.leadTimeHours, 0));
  const winnerRange: Range = {
    start: new Date(winner.start),
    end: winner.end == null ? null : new Date(winner.end)
  };
  const winnerQty = Math.max(0, num(winner.quantity, 1)) || 1;
  const winnerId = winner.id == null ? null : String(winner.id);

  // Everything that stays: the winner plus every non-hold live booking.
  const surviving: BookingLike[] = [winner];
  for (const booking of bookings ?? []) {
    if (!booking || !isHolding(booking, now)) continue;
    if (winnerId != null && String(booking.id) === winnerId) continue;
    if (String(booking.status ?? 'confirmed') !== 'hold') surviving.push(booking);
  }

  const losers: BookingLike[] = [];
  for (const booking of bookings ?? []) {
    if (!booking || !isHolding(booking, now)) continue;
    if (winnerId != null && String(booking.id) === winnerId) continue;
    if (String(booking.status ?? 'confirmed') !== 'hold') continue;

    const other: Range = {
      start: new Date(booking.start),
      end: booking.end == null ? null : new Date(booking.end)
    };
    if (!overlaps(winnerRange, other, lead)) continue;

    // A pool with room for both keeps both — only a real collision releases.
    const qty = Math.max(0, num(booking.quantity, 1)) || 1;
    const peak = peakBookedQuantity(surviving, other, { now, leadTimeHours: lead });
    if (peak + qty <= capacity) continue;

    losers.push(booking);
  }
  return losers;
}

/** Convenience: is `panui` still a truthful cache for this resource? */
export function hasFutureAvailability(
  resource: ResourceLike | null | undefined,
  bookings: readonly BookingLike[] | null | undefined,
  options: { now?: Date; horizonDays?: number } = {}
): boolean {
  if (deriveAvailability(resource) === 'unlimited') return true;
  const now = options.now ?? new Date();
  const horizon = Math.max(1, num(options.horizonDays, 365));
  const windows = freeWindows(
    resource,
    bookings,
    { start: now, end: new Date(now.getTime() + horizon * MS_PER_DAY) },
    1,
    { now }
  );
  return windows.length > 0;
}
