/**
 * The booking ledger's transport layer (docs/PLAN_RESOURCE_CALENDAR.md §4).
 *
 * Every write to `resource-booking` goes through here, for one reason: this
 * collection is being introduced *underneath* flows that already work. A vote
 * on a resource must not start failing because the collection does not exist
 * yet, because a role permission is missing, or because a field was renamed in
 * Strapi. So every call site uses `bestEffort`, and the rollout is staged by
 * `RESOURCE_BOOKINGS`:
 *
 *   off      (default) — nothing is written or read. Today's behaviour, exactly.
 *   shadow             — rows are written and availability is computed, but
 *                        `Sp.panui` is still the gate. This is where the two
 *                        answers get compared before anyone trusts the new one.
 *   enforce            — availability is the gate.
 *
 * The staging matters more than it looks: `panui` is wrong today (it never goes
 * back to true), so flipping straight to `enforce` would swap one wrong answer
 * for another unverified one.
 *
 * GraphQL is written as raw documents rather than added to `qids.js`, the same
 * way `src/lib/server/archive/` does it — `npm run validate:qids` checks every
 * mutation against the live schema, and a collection that does not exist there
 * yet would fail the whole check.
 */

import { env } from '$env/dynamic/private';
import {
  dateField,
  enumField,
  fields,
  numField,
  strField,
  type Exec
} from '$lib/server/archive/gql.js';
import {
  checkAvailability,
  conflictingHolds,
  hasFutureAvailability
} from '$lib/resources/availability.js';
import type { BookingLike, BookingStatus, Range, ResourceLike } from '$lib/resources/types.js';

export type BookingMode = 'off' | 'shadow' | 'enforce';

const STATUSES = ['hold', 'confirmed', 'active', 'done', 'cancelled'] as const;
const SOURCES = ['rikma', 'concierge', 'personal', 'blackout', 'external'] as const;
const REASONS = ['conflict', 'withdrawn', 'expired', 'declined', 'replaced'] as const;

/** Read the rollout stage. Anything unrecognised is `off` — the safe direction. */
export function bookingMode(): BookingMode {
  const raw = String(env.RESOURCE_BOOKINGS ?? '').toLowerCase();
  if (raw === 'shadow' || raw === 'enforce') return raw;
  return 'off';
}

/** Is the ledger being written to at all? */
export function bookingsEnabled(): boolean {
  return bookingMode() !== 'off';
}

/** Does availability actually gate a grant, or is it still only observed? */
export function bookingsEnforced(): boolean {
  return bookingMode() === 'enforce';
}

/**
 * Run a ledger operation without ever letting it break the caller.
 *
 * The flows this hangs off — voting a resource in, accepting an askm, closing
 * an engine — are consent decisions people made. Losing a calendar row is a
 * bug to fix; losing the decision is not acceptable.
 */
export async function bestEffort<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  if (!bookingsEnabled()) return null;
  try {
    return await fn();
  } catch (e) {
    console.warn(`[resource-booking:${label}] non-fatal:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function run(exec: Exec, query: string, label: string): Promise<any> {
  const res = await exec(query);
  if (res?.errors?.length) {
    throw new Error(`[resource-booking:${label}] ${JSON.stringify(res.errors)}`);
  }
  return res?.data ?? null;
}

const SP_FIELDS = `sp { data { id attributes {
  name kindOf availability capacity hm sdate fdate leadTimeHours granularity panui
} } }`;

const BOOKING_FIELDS = `id attributes {
  start end quantity status holdExpiresAt source cancelReason note
  ${SP_FIELDS}
  project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
  sheirut { data { id attributes { name } } }
  consumer_user { data { id attributes { username } } }
}`;

export interface BookingInput {
  spId: string | number;
  ownerId?: string | number | null;
  mashaabimId?: string | number | null;
  start: Date | string;
  end?: Date | string | null;
  quantity?: number | null;
  status?: BookingStatus;
  holdExpiresAt?: Date | string | null;
  source?: (typeof SOURCES)[number];
  projectId?: string | number | null;
  sheirutId?: string | number | null;
  consumerUserId?: string | number | null;
  mashabetahalichId?: string | number | null;
  rikmashId?: string | number | null;
  maapId?: string | number | null;
  openMashaabimId?: string | number | null;
  note?: string | null;
}

/** All bookings on one resource, plus the resource's own occupancy settings. */
export async function loadSpLedger(
  exec: Exec,
  spId: string | number
): Promise<{
  resource: ResourceLike | null;
  bookings: BookingLike[];
  nodes: any[];
  /** The Sp's holder. The only trustworthy answer to "is this yours?". */
  ownerId: string | null;
}> {
  const data = await run(
    exec,
    `query {
      resourceBookings(
        filters: { sp: { id: { eq: ${JSON.stringify(String(spId))} } } }
        pagination: { limit: 500 }
        sort: "start:asc"
      ) { data { ${BOOKING_FIELDS} } }
      sp(id: ${JSON.stringify(String(spId))}) {
        data { id attributes {
          name kindOf availability capacity hm sdate fdate leadTimeHours granularity panui
          users_permissions_user { data { id } }
        } }
      }
    }`,
    'loadSpLedger'
  );

  const nodes: any[] = data?.resourceBookings?.data ?? [];
  const spAttrs = data?.sp?.data?.attributes ?? null;

  return {
    resource: spAttrs
      ? {
          id: String(spId),
          kindOf: spAttrs.kindOf ?? null,
          availability: spAttrs.availability ?? null,
          capacity: spAttrs.capacity ?? null,
          hm: spAttrs.hm ?? null,
          sdate: spAttrs.sdate ?? null,
          fdate: spAttrs.fdate ?? null,
          leadTimeHours: spAttrs.leadTimeHours ?? null,
          granularity: spAttrs.granularity ?? null
        }
      : null,
    bookings: nodes.map(toBookingLike),
    nodes,
    ownerId: spAttrs?.users_permissions_user?.data?.id
      ? String(spAttrs.users_permissions_user.data.id)
      : null
  };
}

function toBookingLike(node: any): BookingLike {
  const a = node?.attributes ?? {};
  return {
    id: String(node?.id),
    start: a.start,
    end: a.end ?? null,
    quantity: a.quantity ?? 1,
    status: a.status ?? 'confirmed',
    holdExpiresAt: a.holdExpiresAt ?? null,
    source: a.source ?? 'rikma'
  };
}

/** Create one booking row. Returns its id, or null when the ledger is off. */
export async function createBooking(exec: Exec, input: BookingInput): Promise<string | null> {
  const body = fields(
    `sp: ${JSON.stringify(String(input.spId))}`,
    input.ownerId == null ? null : `owner: ${JSON.stringify(String(input.ownerId))}`,
    input.mashaabimId == null ? null : `mashaabim: ${JSON.stringify(String(input.mashaabimId))}`,
    dateField('start', input.start),
    dateField('end', input.end),
    numField('quantity', input.quantity ?? 1),
    enumField('status', input.status ?? 'hold', STATUSES),
    dateField('holdExpiresAt', input.holdExpiresAt),
    enumField('source', input.source ?? 'rikma', SOURCES),
    input.projectId == null ? null : `project: ${JSON.stringify(String(input.projectId))}`,
    input.sheirutId == null ? null : `sheirut: ${JSON.stringify(String(input.sheirutId))}`,
    input.consumerUserId == null
      ? null
      : `consumer_user: ${JSON.stringify(String(input.consumerUserId))}`,
    input.mashabetahalichId == null
      ? null
      : `mashabetahalich: ${JSON.stringify(String(input.mashabetahalichId))}`,
    input.rikmashId == null ? null : `rikmash: ${JSON.stringify(String(input.rikmashId))}`,
    input.maapId == null ? null : `maap: ${JSON.stringify(String(input.maapId))}`,
    input.openMashaabimId == null
      ? null
      : `open_mashaabim: ${JSON.stringify(String(input.openMashaabimId))}`,
    strField('note', input.note)
    // No `publishedAt`: `resource-booking` has draftAndPublish off. A ledger
    // has no draft state — `status: 'hold'` is the draft — and an unpublished
    // row would silently free a resource that is actually out.
  );

  const data = await run(
    exec,
    `mutation { createResourceBooking(data: { ${body} }) { data { id } } }`,
    'createBooking'
  );
  const id = data?.createResourceBooking?.data?.id;
  return id == null ? null : String(id);
}

/** Move one booking to a new status. */
export async function setBookingStatus(
  exec: Exec,
  id: string | number,
  status: BookingStatus,
  cancelReason?: (typeof REASONS)[number]
): Promise<void> {
  const body = fields(
    enumField('status', status, STATUSES),
    cancelReason ? enumField('cancelReason', cancelReason, REASONS) : null
  );
  await run(
    exec,
    `mutation { updateResourceBooking(id: ${JSON.stringify(String(id))}, data: { ${body} }) { data { id } } }`,
    'setBookingStatus'
  );
}

/**
 * Confirm one hold and release the holds it collides with (§9.3).
 *
 * Two invariants come from `conflictingHolds`, not from here: only a `hold` is
 * ever released, and a pool with room for both keeps both. What this adds is
 * the reason code, so the released side can be told *why* — a released claim
 * that reads as an unexplained disappearance is exactly the "silent no" the
 * consent model forbids.
 */
export async function confirmBookingAndRelease(
  exec: Exec,
  args: { bookingId: string | number; spId: string | number; now?: Date }
): Promise<{ confirmed: string; released: string[] }> {
  const { resource, bookings } = await loadSpLedger(exec, args.spId);
  const winner = bookings.find((b) => String(b.id) === String(args.bookingId));

  await setBookingStatus(exec, args.bookingId, 'confirmed');

  if (!winner) return { confirmed: String(args.bookingId), released: [] };

  const losers = conflictingHolds(resource, bookings, { ...winner, status: 'confirmed' }, {
    now: args.now
  });

  const released: string[] = [];
  for (const loser of losers) {
    if (loser.id == null) continue;
    await setBookingStatus(exec, loser.id, 'cancelled', 'conflict');
    released.push(String(loser.id));
  }

  await syncPanui(exec, args.spId);
  return { confirmed: String(args.bookingId), released };
}

/**
 * Close out every live booking tying a resource to one consumer — what
 * "the resource came back" means in the ledger.
 */
export async function releaseBookings(
  exec: Exec,
  args: {
    spId: string | number;
    projectId?: string | number | null;
    mashabetahalichId?: string | number | null;
  }
): Promise<string[]> {
  const { nodes } = await loadSpLedger(exec, args.spId);
  const done: string[] = [];
  for (const node of nodes) {
    const a = node?.attributes ?? {};
    if (!['hold', 'confirmed', 'active'].includes(String(a.status ?? 'confirmed'))) continue;
    if (
      args.projectId != null &&
      String(a.project?.data?.id ?? '') !== String(args.projectId)
    ) {
      continue;
    }
    await setBookingStatus(exec, node.id, 'done');
    done.push(String(node.id));
  }
  await syncPanui(exec, args.spId);
  return done;
}

/**
 * Rewrite `Sp.panui` from the ledger.
 *
 * `panui` stops being the source of truth but stays a cache, because a dozen
 * existing filters (`panui: { ne: false }`) still read it. Recomputing it here
 * is what finally makes a returned resource available again — the bug that
 * `markResourceDone` has today.
 */
export async function syncPanui(exec: Exec, spId: string | number): Promise<boolean | null> {
  const { resource, bookings } = await loadSpLedger(exec, spId);
  if (!resource) return null;
  const free = hasFutureAvailability(resource, bookings);
  await run(
    exec,
    `mutation { updateSp(id: ${JSON.stringify(String(spId))}, data: { panui: ${free} }) { data { id } } }`,
    'syncPanui'
  );
  return free;
}

/**
 * Can this resource take the range? Returns the full shape, so a caller can
 * offer the free windows instead of only saying no.
 */
export async function checkSpAvailability(
  exec: Exec,
  spId: string | number,
  range: Range,
  quantity = 1
) {
  const { resource, bookings } = await loadSpLedger(exec, spId);
  return checkAvailability(resource, bookings, range, quantity);
}
