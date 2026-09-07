/**
 * Planning the M2 backfill (docs/PLAN_RESOURCE_CALENDAR.md §8).
 *
 * Every grant that ever went out already left a row — a `Rikmash` archive, and
 * for a recurring resource a live `Mashabetahalich` beside it. The ledger was
 * introduced underneath those flows, so on the day it is switched on it is
 * empty and every past grant reads as "never happened". `syncPanui` would then
 * cheerfully free a van that is out until December.
 *
 * So the backfill is not a nicety before `enforce` — it is its precondition.
 * This module decides *what* to write; `$lib/server/resources/backfill.ts`
 * does the talking to Strapi. Splitting it that way is what makes the rules
 * below testable without a database.
 *
 * The `Rikmash` is the anchor rather than the engine, because it is the only
 * row that carries `sp`: an engine reaches its resource *through* its archive
 * (see `bookingsFromLegacy.ts`), and an engine with no archive has no resource
 * to book.
 */

import type { BookingSource, BookingStatus } from './types.js';

/** One row we intend to create, flat and already resolved. */
export interface PlannedBooking {
  /** Stable identity of the source grant, for logs and dry runs. */
  key: string;
  rikmashId: string;
  mashabetahalichId: string | null;
  spId: string;
  ownerId: string | null;
  projectId: string | null;
  openMashaabimId: string | null;
  mashaabimId: string | null;
  start: string;
  end: string | null;
  quantity: number;
  status: BookingStatus;
  source: BookingSource;
  note: string;
}

export type SkipReason =
  | 'no-sp'
  | 'no-start'
  | 'exists-rikmash'
  | 'exists-mashabetahalich'
  | 'exists-signature';

export interface SkippedGrant {
  key: string;
  spId: string | null;
  reason: SkipReason;
}

export interface BackfillPlan {
  create: PlannedBooking[];
  skipped: SkippedGrant[];
  /** Distinct resources the plan touches — the input to the panui resync. */
  spIds: string[];
}

/** Bookings that already exist, reduced to the keys the plan dedupes on. */
export interface ExistingBooking {
  rikmashId?: string | number | null;
  mashabetahalichId?: string | number | null;
  spId?: string | number | null;
  projectId?: string | number | null;
  start?: string | null;
  end?: string | null;
}

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

/** Unwrap a Strapi single-relation payload, tolerating a missing `attributes`. */
function pick(node: any): any {
  const data = node?.data;
  if (!data) return null;
  return data.id == null && !data.attributes ? null : data;
}

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** `2026-04-01T09:00:00Z` becomes `2026-04-01`. Missing stays empty. */
function day(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/**
 * The second dedupe key.
 *
 * A row written by the live flow does not always carry `rikmash` — at the
 * moment `openGrantBooking` runs, the archive may not exist yet. Matching on
 * resource + counterparty + dates catches those, at day granularity so a start
 * that fell back to `now` still matches the archive's `sqadualed`.
 */
export function bookingSignature(b: ExistingBooking): string {
  return [str(b.spId), str(b.projectId), day(b.start ?? null), day(b.end ?? null)].join('|');
}

/**
 * Status of a backfilled row.
 *
 * The engine's own lifecycle wins when there is one — it is a decision someone
 * made, where the dates only describe it. With no engine the dates are all
 * there is: a window that closed is `done`, one that has not started is
 * `confirmed`, anything else is `active`.
 *
 * Nothing here ever produces `hold`: every one of these grants passed a vote,
 * so none of them is still a claim.
 */
export function statusOfGrant(
  archive: { sqadualed?: string | null; sqadualef?: string | null },
  engine: {
    start?: string | null;
    end?: string | null;
    status_mashab?: string | null;
    finnished?: boolean | null;
  } | null,
  now: Date
): BookingStatus {
  if (engine) {
    if (engine.status_mashab === 'cancelled') return 'cancelled';
    if (engine.finnished === true || engine.status_mashab === 'closed') return 'done';
  }
  const start = engine?.start ?? archive?.sqadualed ?? null;
  const end = engine?.end ?? archive?.sqadualef ?? null;
  const t = now.getTime();
  const e = end ? new Date(end).getTime() : Infinity;
  if (Number.isFinite(e) && e <= t) return 'done';
  const s = start ? new Date(start).getTime() : NaN;
  if (Number.isNaN(s) || s <= t) return 'active';
  return 'confirmed';
}

/**
 * Turn `Rikmash` nodes (each with its engine, resource and counterparty) into
 * the rows to create.
 *
 * Two deliberate non-decisions:
 *
 *  - **An open-ended past grant stays open-ended.** A `total` resource handed
 *    over in 2023 with no `sqadualef` becomes an `active` booking with
 *    `end: null`, i.e. permanently taken. That is exactly what `panui: false`
 *    says about it today, so the shadow comparison agrees and nothing moves.
 *    Freeing it is the holder's call (`availability: 'unlimited'`, §7), never
 *    a migration's.
 *  - **`done` and `cancelled` rows are written too.** They hold no capacity,
 *    but they are the calendar's history, and without them a holder opening
 *    `/me/resources` sees a blank past.
 */
export function planBackfill(
  nodes: any[],
  options: {
    now?: Date;
    existing?: readonly ExistingBooking[];
  } = {}
): BackfillPlan {
  const now = options.now ?? new Date();

  const byRikmash = new Set<string>();
  const byEngine = new Set<string>();
  const bySignature = new Set<string>();
  for (const e of options.existing ?? []) {
    if (e.rikmashId != null) byRikmash.add(str(e.rikmashId));
    if (e.mashabetahalichId != null) byEngine.add(str(e.mashabetahalichId));
    if (e.spId != null) bySignature.add(bookingSignature(e));
  }

  const create: PlannedBooking[] = [];
  const skipped: SkippedGrant[] = [];
  const spIds = new Set<string>();

  for (const node of nodes ?? []) {
    const a = node?.attributes;
    if (!a) continue;
    const rikmashId = str(node.id);
    const key = 'rikmash:' + rikmashId;

    const sp = pick(a.sp);
    if (!sp) {
      skipped.push({ key, spId: null, reason: 'no-sp' });
      continue;
    }
    const spId = str(sp.id);

    const engineNode = pick(a.mashabetahalich);
    const engine = engineNode?.attributes ?? null;
    const engineId = engineNode ? str(engineNode.id) : null;

    if (byRikmash.has(rikmashId)) {
      skipped.push({ key, spId, reason: 'exists-rikmash' });
      continue;
    }
    if (engineId && byEngine.has(engineId)) {
      skipped.push({ key, spId, reason: 'exists-mashabetahalich' });
      continue;
    }

    // `createdAt` is the honest fallback: the resource did go out, we were just
    // never told from when. Dropping the row would hide real occupancy.
    const start = engine?.start ?? a.sqadualed ?? a.createdAt ?? null;
    if (!start) {
      skipped.push({ key, spId, reason: 'no-start' });
      continue;
    }
    const end = engine?.end ?? a.sqadualef ?? null;

    const project = pick(a.project);
    const owner = pick(a.users_permissions_user);
    const openMashaabim = pick(a.open_mashaabim);
    // The resource template is denormalised onto the booking for filtering by
    // kind. `Rikmash` has no `mashaabim` field of its own, so it comes from the
    // `Sp` or from the engine — whichever the query managed to reach.
    const mashaabim = pick(sp.attributes?.mashaabim) ?? pick(engine?.mashaabim) ?? pick(a.mashaabim);

    const planned: PlannedBooking = {
      key,
      rikmashId,
      mashabetahalichId: engineId,
      spId,
      ownerId: owner ? str(owner.id) : null,
      projectId: project ? str(project.id) : null,
      openMashaabimId: openMashaabim ? str(openMashaabim.id) : null,
      mashaabimId: mashaabim ? str(mashaabim.id) : null,
      start: str(start),
      end: end == null ? null : str(end),
      quantity: Math.max(1, num(engine?.quantityAssigned ?? a.hm, 1)),
      status: statusOfGrant(a, engine, now),
      // A grant with no rikma behind it is the holder's own allocation.
      source: project ? 'rikma' : 'personal',
      note:
        'backfill · rikmash=' + rikmashId + (engineId ? ' · mashabetahalich=' + engineId : '')
    };

    const signature = bookingSignature(planned);
    if (bySignature.has(signature)) {
      skipped.push({ key, spId, reason: 'exists-signature' });
      continue;
    }

    // Two archives of the same grant inside one run must not both be written.
    bySignature.add(signature);
    byRikmash.add(rikmashId);
    if (engineId) byEngine.add(engineId);

    create.push(planned);
    spIds.add(spId);
  }

  return { create, skipped, spIds: [...spIds] };
}

/** Counts for the run summary, so a dry run reads at a glance. */
export function summarizePlan(plan: BackfillPlan): Record<string, number> {
  const out: Record<string, number> = {
    create: plan.create.length,
    skipped: plan.skipped.length,
    resources: plan.spIds.length
  };
  for (const row of plan.create) {
    out['status_' + row.status] = (out['status_' + row.status] ?? 0) + 1;
  }
  for (const row of plan.skipped) {
    out['skip_' + row.reason] = (out['skip_' + row.reason] ?? 0) + 1;
  }
  return out;
}
