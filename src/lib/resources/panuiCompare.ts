/**
 * The shadow comparison (docs/PLAN_RESOURCE_CALENDAR.md §8, milestone M3).
 *
 * `RESOURCE_BOOKINGS=shadow` exists so that the two answers to "is this
 * resource available?" can be put side by side before either one is trusted:
 *
 *   · **today's answer** — the `panui` flag, as the live filters read it
 *     (`panui: { ne: false }`, so a null counts as available);
 *   · **the ledger's answer** — `hasFutureAvailability` over the booking rows.
 *
 * They are expected to disagree, and the direction of the disagreement is the
 * whole point:
 *
 *   · `staleLocked` — `panui: false` on a resource the ledger says is free.
 *     This is bug §0.2.1: nothing ever set `panui` back to true. Every one of
 *     these is a resource its holder cannot offer today, and flipping to
 *     `enforce` *returns* it. Expect many; they are the win.
 *   · `overOffered` — visible today, taken according to the ledger. This is
 *     the dangerous direction: `enforce` would hide a live offer. Each one is
 *     either a real double-booking that was invisible until now, or a bad
 *     backfill row — and it must be read one by one before the flip.
 *
 * Pure on purpose: the runner feeds it rows, the tests feed it fixtures.
 */

import { deriveAvailability, hasFutureAvailability, nextFreeFrom } from './availability.js';
import type { AvailabilityModel, BookingLike, ResourceLike } from './types.js';

export type PanuiVerdict = 'agree' | 'staleLocked' | 'overOffered';

/**
 * Why the ledger says "taken". Only the first — `bookedOut` — is a booking at
 * all; the rest are the holder's own offer window, and they read very
 * differently at flip time (§13.1 step 3): a real double-booking has to be
 * resolved, an offer that ended in 2024 is simply an offer that ended.
 *
 * `invalidWindow` is checked before `offerWindowEnded` because a row whose
 * `fdate` precedes its `sdate` (an empty date field stored as the epoch) is a
 * data bug, not an expiry, and no flip of a flag will fix it.
 */
export type TakenReason =
  | 'bookedOut'
  | 'invalidWindow'
  | 'offerWindowEnded'
  | 'offerNotYetOpen'
  | 'unknown';

export interface PanuiComparison {
  spId: string;
  name: string;
  ownerId: string | null;
  kindOf: string | null;
  model: AvailabilityModel;
  /** The raw flag, nulls kept — `null` is legacy, not `false`. */
  panui: boolean | null;
  /** How the live filters read that flag today. */
  visibleToday: boolean;
  /** What the ledger says. */
  derivedFree: boolean;
  verdict: PanuiVerdict;
  /** Live rows holding capacity right now — the reason for a `taken` answer. */
  holdingBookings: number;
  totalBookings: number;
  /** When it frees up, when it does not now. Null means "not within a year". */
  nextFreeFrom: string | null;
  /** Why it is taken. Null while the ledger says it is free. */
  reason: TakenReason | null;
  /** The holder's own window, echoed so a blocker can be read without a second query. */
  offerStartsAt: string | null;
  offerEndsAt: string | null;
}

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function time(value: string | Date | null | undefined): number | null {
  if (value == null) return null;
  const t = (value instanceof Date ? value : new Date(value)).getTime();
  return Number.isNaN(t) ? null : t;
}

function isoOrNull(value: string | Date | null | undefined): string | null {
  const t = time(value);
  return t == null ? null : new Date(t).toISOString();
}

/** The same year `hasFutureAvailability` looks ahead over. */
const HORIZON_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Name the reason a resource reads as taken. The window is checked before the
 * bookings because it is dispositive: outside it there is no availability to
 * book against, so calling such a row `bookedOut` would point the reader at
 * bookings that are not what is holding it.
 */
function takenReason(resource: ResourceLike, holding: number, now: Date): TakenReason {
  const start = time(resource.sdate);
  const end = time(resource.fdate);
  if (end != null && start != null && end < start) return 'invalidWindow';
  if (end != null && end < now.getTime()) return 'offerWindowEnded';
  if (start != null && start > now.getTime() + HORIZON_MS) return 'offerNotYetOpen';
  if (holding > 0) return 'bookedOut';
  return 'unknown';
}

/**
 * Compare one resource. `bookings` must be *all* of its rows, not a window:
 * a booking starting next month is exactly what makes today's answer wrong.
 */
export function comparePanui(
  sp: {
    id: string | number;
    attributes?: any;
  },
  bookings: readonly BookingLike[],
  options: { now?: Date } = {}
): PanuiComparison {
  const now = options.now ?? new Date();
  const a = sp?.attributes ?? {};

  const resource: ResourceLike = {
    id: str(sp?.id),
    kindOf: a.kindOf ?? null,
    availability: a.availability ?? null,
    capacity: a.capacity ?? null,
    // `Sp.unit` is the per-unit quantity; `hm` is the same number's name
    // everywhere else, and the one `ResourceLike` uses.
    hm: a.unit ?? a.hm ?? null,
    sdate: a.sdate ?? null,
    fdate: a.fdate ?? null,
    leadTimeHours: a.leadTimeHours ?? null,
    granularity: a.granularity ?? null
  };

  const panui = a.panui == null ? null : Boolean(a.panui);
  // Mirrors `panui: { ne: false }` in qids — a null row is offered today.
  const visibleToday = panui !== false;
  const derivedFree = hasFutureAvailability(resource, bookings, { now });

  let verdict: PanuiVerdict = 'agree';
  if (visibleToday && !derivedFree) verdict = 'overOffered';
  else if (!visibleToday && derivedFree) verdict = 'staleLocked';

  const holding = bookings.filter((b) => {
    const status = b?.status == null ? 'confirmed' : String(b.status);
    return status === 'hold' || status === 'confirmed' || status === 'active';
  }).length;

  const free = derivedFree
    ? null
    : nextFreeFrom(resource, bookings, { start: now, end: null }, 1, { now });

  return {
    spId: str(sp?.id),
    name: str(a.name),
    ownerId: a.users_permissions_user?.data?.id ? str(a.users_permissions_user.data.id) : null,
    kindOf: a.kindOf ?? null,
    model: deriveAvailability(resource),
    panui,
    visibleToday,
    derivedFree,
    verdict,
    holdingBookings: holding,
    totalBookings: bookings.length,
    nextFreeFrom: free ? free.toISOString() : null,
    reason: derivedFree ? null : takenReason(resource, holding, now),
    offerStartsAt: isoOrNull(resource.sdate),
    offerEndsAt: isoOrNull(resource.fdate)
  };
}

export interface ComparisonSummary {
  resources: number;
  agree: number;
  staleLocked: number;
  overOffered: number;
  /** By possession model, because `consumable` is expected to lock and should not alarm. */
  byModel: Record<string, number>;
  /**
   * The blockers by reason — the line that decides the flip. A list that is
   * all `offerWindowEnded` is an offer that expired, not a double-booking;
   * a single `bookedOut` is the row somebody has to read.
   */
  blockersByReason: Record<string, number>;
  /** The rows that must be read before `enforce` — `overOffered` only. */
  blockers: PanuiComparison[];
}

/**
 * Fold a run into the one number that decides the flip.
 *
 * `blockers` is deliberately only `overOffered`: a `staleLocked` row is a
 * resource the flip gives back, and waiting for that list to be empty would
 * mean waiting for the bug to fix itself.
 */
export function summarizeComparisons(
  rows: readonly PanuiComparison[],
  options: { blockerLimit?: number } = {}
): ComparisonSummary {
  const limit = options.blockerLimit ?? 50;
  const byModel: Record<string, number> = {};
  const blockersByReason: Record<string, number> = {};
  let agree = 0;
  let staleLocked = 0;
  let overOffered = 0;
  const blockers: PanuiComparison[] = [];

  for (const row of rows) {
    if (row.verdict === 'agree') agree++;
    else if (row.verdict === 'staleLocked') staleLocked++;
    else {
      overOffered++;
      // Counted over every blocker, not only the ones the limit lets through —
      // the whole point is to know what the tail is made of.
      const reason = row.reason ?? 'unknown';
      blockersByReason[reason] = (blockersByReason[reason] ?? 0) + 1;
      if (blockers.length < limit) blockers.push(row);
    }
    if (row.verdict !== 'agree') byModel[row.model] = (byModel[row.model] ?? 0) + 1;
  }

  return {
    resources: rows.length,
    agree,
    staleLocked,
    overOffered,
    byModel,
    blockersByReason,
    blockers
  };
}
