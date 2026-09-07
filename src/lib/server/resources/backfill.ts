/**
 * The M2 backfill and the M3 shadow comparison, as one runnable pair
 * (docs/PLAN_RESOURCE_CALENDAR.md §8).
 *
 * The rollout the plan describes is three moves, in this order and no other:
 *
 *   1. `RESOURCE_BOOKINGS=shadow` — new grants start writing ledger rows.
 *   2. **backfill** — every grant that went out *before* step 1 gets its row.
 *      Without this the ledger is a calendar that starts today, and
 *      `syncPanui` would hand back resources that are physically out.
 *   3. **compare** — put `panui` and the ledger side by side, read the
 *      disagreements, and only then flip to `enforce`.
 *
 * Both runs are read-mostly, idempotent, and driven from
 * `/api/resource-bookings`, which is key-gated the same way `/api/monthi` is.
 *
 * GraphQL is written as raw documents here for the same reason
 * `bookingStore.ts` does it: these are one-off operational queries, not part
 * of the client-facing qid whitelist.
 */

import { run, type Exec } from '$lib/server/archive/gql.js';
import { createBooking, bookingMode, syncPanui } from './bookingStore.js';
import {
  planBackfill,
  summarizePlan,
  type BackfillPlan,
  type ExistingBooking,
  type PlannedBooking
} from '$lib/resources/backfillPlan.js';
import {
  comparePanui,
  summarizeComparisons,
  type ComparisonSummary,
  type PanuiComparison
} from '$lib/resources/panuiCompare.js';
import type { BookingLike } from '$lib/resources/types.js';

const PAGE = 100;
/** A hard stop, so a runaway cursor cannot walk the whole database twice. */
const MAX_PAGES = 200;

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

/**
 * Page through one collection until it stops returning rows.
 *
 * Strapi answers `start`/`limit` rather than a cursor, and a page shorter than
 * `limit` is the end. The page size stays modest because these rows carry
 * several relations each.
 */
async function paginate(
  exec: Exec,
  label: string,
  document: (start: number, limit: number) => string,
  pick: (data: any) => any[]
): Promise<any[]> {
  const out: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await run(exec, document(page * PAGE, PAGE), label);
    const rows = pick(data) ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// ── reading what exists ─────────────────────────────────────────────────────

/** Every ledger row, reduced to the keys the plan dedupes on. */
export async function loadExistingBookings(exec: Exec): Promise<ExistingBooking[]> {
  const nodes = await paginate(
    exec,
    'existingBookings',
    (start, limit) => `query {
      resourceBookings(pagination: { start: ${start}, limit: ${limit} }, sort: "id:asc") {
        data { id attributes {
          start end
          sp { data { id } }
          project { data { id } }
          rikmash { data { id } }
          mashabetahalich { data { id } }
        } }
      }
    }`,
    (data) => data?.resourceBookings?.data
  );

  return nodes.map((node: any) => {
    const a = node?.attributes ?? {};
    return {
      rikmashId: a.rikmash?.data?.id ?? null,
      mashabetahalichId: a.mashabetahalich?.data?.id ?? null,
      spId: a.sp?.data?.id ?? null,
      projectId: a.project?.data?.id ?? null,
      start: a.start ?? null,
      end: a.end ?? null
    };
  });
}

/**
 * Every grant archive that points at a resource, with its engine.
 *
 * `sp: { id: { notNull: true } }` is the filter that matters: a `Rikmash`
 * without a resource is a mission-side row and has nothing to book.
 *
 * The resource *template* (`mashaabim`) is read through the `Sp` and through
 * the engine, because `Rikmash` itself does not carry one.
 */
export async function loadGrants(exec: Exec): Promise<any[]> {
  return paginate(
    exec,
    'grants',
    (start, limit) => `query {
      rikmashes(
        filters: { sp: { id: { notNull: true } } }
        pagination: { start: ${start}, limit: ${limit} }
        sort: "id:asc"
      ) {
        data { id attributes {
          sqadualed sqadualef hm createdAt
          sp { data { id attributes { name mashaabim { data { id } } } } }
          project { data { id } }
          users_permissions_user { data { id } }
          open_mashaabim { data { id } }
          mashabetahalich { data { id attributes {
            start end status_mashab finnished quantityAssigned
            mashaabim { data { id } }
          } } }
        } }
      }
    }`,
    (data) => data?.rikmashes?.data
  );
}

/** Every live resource, with the fields availability is computed from. */
export async function loadResources(exec: Exec): Promise<any[]> {
  return paginate(
    exec,
    'resources',
    (start, limit) => `query {
      sps(
        filters: { or: [{ archived: { null: true } }, { archived: { eq: false } }] }
        pagination: { start: ${start}, limit: ${limit} }
        sort: "id:asc"
      ) {
        data { id attributes {
          name kindOf availability capacity unit sdate fdate leadTimeHours granularity panui
          users_permissions_user { data { id } }
        } }
      }
    }`,
    (data) => data?.sps?.data
  );
}

/** Every ledger row again, this time as availability input, grouped by resource. */
export async function loadBookingsBySp(exec: Exec): Promise<Map<string, BookingLike[]>> {
  const nodes = await paginate(
    exec,
    'bookingsBySp',
    (start, limit) => `query {
      resourceBookings(pagination: { start: ${start}, limit: ${limit} }, sort: "id:asc") {
        data { id attributes {
          start end quantity status holdExpiresAt source
          sp { data { id } }
        } }
      }
    }`,
    (data) => data?.resourceBookings?.data
  );

  const bySp = new Map<string, BookingLike[]>();
  for (const node of nodes) {
    const a = node?.attributes ?? {};
    const spId = a.sp?.data?.id == null ? null : str(a.sp.data.id);
    if (!spId) continue;
    const list = bySp.get(spId) ?? [];
    list.push({
      id: str(node.id),
      start: a.start,
      end: a.end ?? null,
      quantity: a.quantity ?? 1,
      status: a.status ?? 'confirmed',
      holdExpiresAt: a.holdExpiresAt ?? null,
      source: a.source ?? 'rikma'
    });
    bySp.set(spId, list);
  }
  return bySp;
}

// ── the backfill ────────────────────────────────────────────────────────────

export interface BackfillResult {
  mode: string;
  dry: boolean;
  summary: Record<string, number>;
  created: string[];
  failed: Array<{ key: string; error: string }>;
  /** Resources whose `panui` cache was recomputed after their rows landed. */
  resynced: number;
  plan?: PlannedBooking[];
}

/**
 * Write one ledger row per past grant, then rewrite the `panui` cache of every
 * resource touched.
 *
 * A failed row is recorded and the run continues: this is a repair pass over
 * years of history, and one malformed archive must not stop the other 900.
 * Re-running is safe — the dedupe reads what already landed.
 */
export async function runBackfill(
  exec: Exec,
  options: { dry?: boolean; now?: Date; includePlan?: boolean } = {}
): Promise<BackfillResult> {
  const dry = options.dry === true;
  const now = options.now ?? new Date();

  const [existing, grants] = await Promise.all([loadExistingBookings(exec), loadGrants(exec)]);
  const plan: BackfillPlan = planBackfill(grants, { now, existing });

  const created: string[] = [];
  const failed: Array<{ key: string; error: string }> = [];

  if (!dry) {
    for (const row of plan.create) {
      try {
        const id = await createBooking(exec, {
          spId: row.spId,
          ownerId: row.ownerId,
          mashaabimId: row.mashaabimId,
          start: row.start,
          end: row.end,
          quantity: row.quantity,
          status: row.status,
          source: row.source,
          projectId: row.projectId,
          mashabetahalichId: row.mashabetahalichId,
          rikmashId: row.rikmashId,
          openMashaabimId: row.openMashaabimId,
          note: row.note
        });
        if (id) created.push(id);
      } catch (e) {
        failed.push({ key: row.key, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  // `panui` stays a cache, and a cache written from an empty ledger is a lie.
  // Resyncing only the resources this run touched keeps the pass proportional
  // to the backfill rather than to the whole platform.
  let resynced = 0;
  if (!dry) {
    for (const spId of plan.spIds) {
      try {
        await syncPanui(exec, spId);
        resynced++;
      } catch (e) {
        failed.push({ key: `sp:${spId}`, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  return {
    mode: bookingMode(),
    dry,
    summary: { ...summarizePlan(plan), grants: grants.length, existing: existing.length },
    created,
    failed,
    resynced,
    plan: options.includePlan ? plan.create : undefined
  };
}

// ── the comparison ──────────────────────────────────────────────────────────

export interface CompareResult {
  mode: string;
  summary: ComparisonSummary;
  /** Every disagreeing row, so the list can be read rather than counted. */
  disagreements: PanuiComparison[];
}

/**
 * Ask both gates about every resource and report where they differ.
 *
 * Changes nothing — this is the read that decides whether `enforce` is safe,
 * and a comparison that repaired what it measured would have nothing left to
 * report.
 */
export async function runComparison(
  exec: Exec,
  options: { now?: Date; limit?: number } = {}
): Promise<CompareResult> {
  const now = options.now ?? new Date();
  const [resources, bySp] = await Promise.all([loadResources(exec), loadBookingsBySp(exec)]);

  const rows: PanuiComparison[] = resources.map((sp: any) =>
    comparePanui(sp, bySp.get(str(sp?.id)) ?? [], { now })
  );

  const limit = options.limit ?? 200;
  return {
    mode: bookingMode(),
    summary: summarizeComparisons(rows),
    disagreements: rows.filter((r) => r.verdict !== 'agree').slice(0, limit)
  };
}
