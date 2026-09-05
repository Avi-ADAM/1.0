/**
 * Reading occupancy out of the rows that exist *today*
 * (docs/PLAN_RESOURCE_CALENDAR.md §8, milestone M2).
 *
 * The plan's `resource-booking` collection does not exist yet, but the
 * information mostly does — scattered across two shapes that were never meant
 * to be read together:
 *
 *  - `Mashabetahalich` — the live engine, with `start`/`end`. Only recurring
 *    (`monthly`/`yearly`) resources get one, so it covers a minority of grants.
 *  - `Rikmash` — the grant archive, with `sqadualed`/`sqadualef`. For a `rent`
 *    or `total` resource this is the **only** record that a resource went out
 *    at all, which is exactly why the calendar has to read it.
 *
 * Merging them here means the calendar shows real occupancy before any backend
 * change, and keeps working afterwards: once real bookings land, they are
 * simply another source feeding the same `BookingView[]`.
 *
 * Note the field names — `Rikmash.sqadual**ef**` against
 * `OpenMashaabim.sqadual**edf**`. They differ by one letter for the same
 * concept, which is half the reason this plan exists.
 */

import type { BookingStatus, BookingSource } from './types.js';
import type { BookingView } from './bookingView.js';

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function pick(node: any): any {
  return node?.data?.attributes ? node.data : null;
}

/**
 * Who the *other* side is depends on who is looking.
 *
 * On the holder's own calendar the counterparty is the rikma that has their
 * van. On the rikma's calendar the rikma is the viewer, so the interesting name
 * is the member supplying it — showing the rikma its own name in every row
 * would be useless.
 */
export type Perspective = 'holder' | 'project';

function counterpartyOf(a: any, perspective: Perspective): BookingView['counterparty'] {
  if (perspective === 'project') {
    const u = pick(a?.users_permissions_user);
    if (!u) return { kind: 'none', id: null, name: '', pic: null };
    return {
      kind: 'user',
      id: str(u.id),
      name: str(u.attributes?.username),
      pic: u.attributes?.profilePic?.data?.attributes?.url ?? null
    };
  }
  const p = pick(a?.project);
  if (!p) return { kind: 'none', id: null, name: '', pic: null };
  return {
    kind: 'project',
    id: str(p.id),
    name: str(p.attributes?.projectName),
    pic: p.attributes?.profilePic?.data?.attributes?.url ?? null
  };
}

/**
 * Status from dates, for rows that have no status field of their own.
 *
 * A row whose window has closed is `done`; one that has started and not closed
 * is `active`; one still ahead is `confirmed` — it was agreed, it just has not
 * begun. Nothing here ever produces `hold`: every legacy row got here by
 * passing a vote, so none of them is still a claim.
 */
function statusFromDates(start: string | null, end: string | null, now: Date): BookingStatus {
  const s = start ? new Date(start).getTime() : NaN;
  const e = end ? new Date(end).getTime() : Infinity;
  const t = now.getTime();
  if (Number.isFinite(e) && e <= t) return 'done';
  if (Number.isNaN(s) || s <= t) return 'active';
  return 'confirmed';
}

function sourceOf(project: any): BookingSource {
  return pick(project) ? 'rikma' : 'personal';
}

/** One live engine → one booking. */
function fromEngine(
  node: any,
  spByRikmash: Map<string, { id: string; name: string }>,
  now: Date,
  perspective: Perspective
): BookingView | null {
  const a = node?.attributes;
  if (!a) return null;
  const start = a.start ?? null;
  if (!start) return null;

  const rikmashId = pick(a.rikmash)?.id;
  const sp = rikmashId ? spByRikmash.get(str(rikmashId)) : undefined;

  // The engine carries its own lifecycle, so prefer it over the dates.
  let status: BookingStatus;
  if (a.status_mashab === 'cancelled') status = 'cancelled';
  else if (a.finnished === true || a.status_mashab === 'closed') status = 'done';
  else if (a.status_mashab === 'draft') status = 'hold';
  else status = statusFromDates(start, a.end ?? null, now);

  const quantity = Number(a.quantityAssigned);

  return {
    id: `mash:${str(node.id)}`,
    start: str(start),
    end: a.end == null ? null : str(a.end),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    status,
    holdExpiresAt: null,
    source: sourceOf(a.project),
    note: null,
    spId: sp?.id ?? null,
    spName: sp?.name || str(a.mashaabim?.data?.attributes?.name || a.name),
    counterparty: counterpartyOf(a, perspective)
  };
}

/** One grant archive → one booking. */
function fromArchive(node: any, now: Date, perspective: Perspective): BookingView | null {
  const a = node?.attributes;
  if (!a) return null;
  // `createdAt` is the honest fallback: the resource did go out, we just were
  // not told from when. Dropping the row instead would hide a real occupancy.
  const start = a.sqadualed ?? a.createdAt ?? null;
  if (!start) return null;

  const sp = pick(a.sp);
  const quantity = Number(a.hm);

  return {
    id: `rikmash:${str(node.id)}`,
    start: str(start),
    end: a.sqadualef == null ? null : str(a.sqadualef),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    status: statusFromDates(str(start), a.sqadualef ?? null, now),
    holdExpiresAt: null,
    source: sourceOf(a.project),
    note: null,
    spId: sp ? str(sp.id) : null,
    spName: str(sp?.attributes?.name || a.name),
    counterparty: counterpartyOf(a, perspective)
  };
}

/**
 * Merge the two legacy shapes into one booking list.
 *
 * An archive that already has an engine is dropped: `Rikmash.mashabetahalich`
 * and the engine describe the same grant, and showing both would paint the
 * resource as doubly occupied — the exact error this whole module exists to
 * prevent.
 */
export function bookingsFromLegacy(
  data: any,
  options: { now?: Date; perspective?: Perspective } = {}
): BookingView[] {
  const now = options.now ?? new Date();
  const perspective = options.perspective ?? 'holder';
  const attrs =
    data?.usersPermissionsUser?.data?.attributes ??
    data?.project?.data?.attributes ??
    data?.attributes ??
    data ??
    {};
  const engines: any[] = attrs?.mashabetahaliches?.data ?? [];
  const archives: any[] = attrs?.rikmashes?.data ?? [];
  const services: any[] = attrs?.sheiruts?.data ?? [];

  // Engines have no `sp` relation of their own; the paired archive does.
  const spByRikmash = new Map<string, { id: string; name: string }>();
  const engineRikmashIds = new Set<string>();
  for (const engine of engines) {
    const rikmashId = pick(engine?.attributes?.rikmash)?.id;
    if (rikmashId != null) engineRikmashIds.add(str(rikmashId));
  }
  for (const archive of archives) {
    const sp = pick(archive?.attributes?.sp);
    if (sp) spByRikmash.set(str(archive.id), { id: str(sp.id), name: str(sp.attributes?.name) });
  }

  const out: BookingView[] = [];
  for (const engine of engines) {
    const view = fromEngine(engine, spByRikmash, now, perspective);
    if (view) out.push(view);
  }
  for (const archive of archives) {
    const id = str(archive?.id);
    const linkedEngine = pick(archive?.attributes?.mashabetahalich);
    if (linkedEngine || engineRikmashIds.has(id)) continue;
    const view = fromArchive(archive, now, perspective);
    if (view) out.push(view);
  }
  for (const service of services) {
    const view = fromService(service, now);
    if (view) out.push(view);
  }

  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * A customer engagement → one booking, for the rikma's own calendar.
 *
 * This is the other direction: not what the rikma is holding, but what it has
 * committed to supply. A rikma that has sold the same week twice needs to see
 * that, and today nothing puts those two rows on one screen.
 */
function fromService(node: any, now: Date): BookingView | null {
  const a = node?.attributes;
  if (!a) return null;
  const start = a.startDate ?? a.createdAt ?? null;
  if (!start) return null;
  if (a.archived === true) return null;

  const quantity = Number(a.quant);

  return {
    id: `sheirut:${str(node.id)}`,
    start: str(start),
    end: a.finnishDate == null ? null : str(a.finnishDate),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    // An unapproved service is still only a claim on the calendar.
    status: a.isApruved === false ? 'hold' : statusFromDates(str(start), a.finnishDate ?? null, now),
    holdExpiresAt: null,
    source: 'concierge',
    note: null,
    spId: null,
    spName: str(a.matanot?.data?.attributes?.name || a.name),
    counterparty: {
      kind: 'sheirut',
      id: str(node.id),
      name: str(a.name),
      pic: null
    }
  };
}

/**
 * The holder's resources as `availability.ts` sees them, from `308myResourcesViaUser`.
 * Kept here so the page has one place to turn a Strapi payload into inputs.
 */
export function resourcesFromSps(data: any): { id: string; name: string; kindOf: string | null }[] {
  const nodes: any[] = data?.usersPermissionsUser?.data?.attributes?.sps?.data ?? [];
  return nodes.map((node) => ({
    id: str(node.id),
    name: str(node.attributes?.name),
    kindOf: node.attributes?.kindOf ?? null
  }));
}
