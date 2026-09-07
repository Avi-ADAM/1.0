/**
 * Presentation-side helpers for the resource calendar
 * (docs/PLAN_RESOURCE_CALENDAR.md §6).
 *
 * Everything here is pure: Strapi nodes in, plain objects out. The calendar
 * component only paints — it does not reach into `attributes.data.attributes`,
 * and it does not decide what "taken" means. That keeps the mobile list view
 * and the month grid showing the same thing.
 *
 * No user-facing strings live here. Labels come back as translation keys so
 * `$t()` stays the only source of copy (a `{ he, en }` object here would be a
 * regression — see CLAUDE.md).
 */

import type { BookingLike, BookingSource, BookingStatus, Range, ResourceLike } from './types.js';

/** A booking flattened out of Strapi's `{ id, attributes }` nesting. */
export interface BookingView extends BookingLike {
  id: string;
  start: string;
  end: string | null;
  quantity: number;
  status: BookingStatus;
  source: BookingSource;
  note: string | null;
  /** The resource this booking sits on. */
  spId: string | null;
  spName: string;
  /** Who holds it during this range. Exactly one of these is set, or none. */
  counterparty: {
    kind: 'project' | 'sheirut' | 'user' | 'none';
    id: string | null;
    name: string;
    pic: string | null;
  };
}

export interface BookingFilters {
  /** Empty or omitted = every resource. */
  spIds?: string[];
  /** Empty or omitted = every kind of counterparty. */
  counterparties?: ('project' | 'sheirut' | 'user' | 'none')[];
  statuses?: BookingStatus[];
  sources?: BookingSource[];
  /** Only bookings overlapping this range. */
  range?: Range;
  /** Hide `done` and `cancelled`. */
  liveOnly?: boolean;
}

const LIVE: BookingStatus[] = ['hold', 'confirmed', 'active'];

function pick(node: any): any {
  return node?.data?.attributes ? node.data : null;
}

function str(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value);
}

function firstUrl(pic: any): string | null {
  return pic?.data?.attributes?.url ?? null;
}

/**
 * Flatten one `resource-booking` node. Unknown statuses fall back to
 * `confirmed` — the same safe direction `isHolding` takes, so a row the client
 * does not recognise still shows as occupied rather than vanishing.
 */
export function normalizeBookingNode(node: any): BookingView | null {
  if (!node) return null;
  const a = node.attributes ?? node;
  if (!a || a.start == null) return null;

  const sp = pick(a.sp);
  const project = pick(a.project);
  const sheirut = pick(a.sheirut);
  const user = pick(a.consumer_user);

  let counterparty: BookingView['counterparty'] = {
    kind: 'none',
    id: null,
    name: '',
    pic: null
  };
  if (project) {
    counterparty = {
      kind: 'project',
      id: str(project.id),
      name: str(project.attributes?.projectName),
      pic: firstUrl(project.attributes?.profilePic)
    };
  } else if (sheirut) {
    counterparty = { kind: 'sheirut', id: str(sheirut.id), name: str(sheirut.attributes?.name), pic: null };
  } else if (user) {
    counterparty = {
      kind: 'user',
      id: str(user.id),
      name: str(user.attributes?.username),
      pic: firstUrl(user.attributes?.profilePic)
    };
  }

  const status = str(a.status, 'confirmed') as BookingStatus;
  const quantity = Number(a.quantity);

  return {
    id: str(node.id ?? a.id),
    start: str(a.start),
    end: a.end == null ? null : str(a.end),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    status: (['hold', 'confirmed', 'active', 'done', 'cancelled'] as string[]).includes(status)
      ? status
      : 'confirmed',
    holdExpiresAt: a.holdExpiresAt ?? null,
    source: (str(a.source, 'rikma') as BookingSource) ?? 'rikma',
    note: a.note ?? null,
    spId: sp ? str(sp.id) : null,
    spName: str(sp?.attributes?.name || a.spName || ''),
    counterparty
  };
}

export function normalizeBookings(nodes: any[] | null | undefined): BookingView[] {
  const out: BookingView[] = [];
  for (const node of nodes ?? []) {
    const view = normalizeBookingNode(node);
    if (view) out.push(view);
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** Flatten an `Sp` node into the shape `availability.ts` expects. */
export function normalizeResourceNode(node: any): (ResourceLike & { id: string; name: string }) | null {
  if (!node) return null;
  const a = node.attributes ?? node;
  if (!a) return null;
  return {
    id: str(node.id ?? a.id),
    name: str(a.name),
    kindOf: a.kindOf ?? null,
    availability: a.availability ?? null,
    capacity: a.capacity ?? null,
    // `Sp` spells the per-unit quantity `unit`; `Rikmash`/`OpenMashaabim` spell
    // the same number `hm`. Both shapes reach this mapper, so read either.
    hm: a.unit ?? a.hm ?? null,
    sdate: a.sdate ?? null,
    fdate: a.fdate ?? null,
    leadTimeHours: a.leadTimeHours ?? null,
    granularity: a.granularity ?? null
  };
}

/** Apply the calendar's filter bar. An empty filter list means "no filter". */
export function filterBookings(bookings: BookingView[], filters: BookingFilters = {}): BookingView[] {
  const { spIds, counterparties, statuses, sources, range, liveOnly } = filters;
  return bookings.filter((booking) => {
    if (spIds?.length && (booking.spId == null || !spIds.includes(booking.spId))) return false;
    if (counterparties?.length && !counterparties.includes(booking.counterparty.kind)) return false;
    if (statuses?.length && !statuses.includes(booking.status)) return false;
    if (sources?.length && !sources.includes(booking.source)) return false;
    if (liveOnly && !LIVE.includes(booking.status)) return false;
    if (range) {
      const s = new Date(booking.start).getTime();
      const e = booking.end == null ? Infinity : new Date(booking.end).getTime();
      const rs = range.start.getTime();
      const re = range.end == null ? Infinity : range.end.getTime();
      if (!(e > rs && s < re)) return false;
    }
    return true;
  });
}

/**
 * CSS custom properties per status. Held ranges get the warm palette; a
 * self-blackout is neutral, because it is the holder's own note to themselves
 * rather than a commitment to anyone.
 */
export function bookingColor(booking: Pick<BookingView, 'status' | 'source'>): {
  background: string;
  border: string;
  dashed: boolean;
} {
  if (booking.source === 'blackout') {
    return { background: 'var(--surface-muted)', border: 'var(--surface-line)', dashed: true };
  }
  switch (booking.status) {
    case 'hold':
      return { background: 'var(--surface-2)', border: 'var(--gold)', dashed: true };
    case 'active':
      return { background: 'var(--barbi-pink)', border: 'var(--mpink)', dashed: false };
    case 'confirmed':
      return { background: 'var(--gold)', border: 'var(--goldink)', dashed: false };
    default:
      return { background: 'var(--surface-2)', border: 'var(--surface-line)', dashed: true };
  }
}

/** Translation key for a status chip. */
export function statusKey(status: BookingStatus): string {
  return `resources.status.${status}`;
}

/** Translation key for who holds it, when there is no name to show. */
export function sourceKey(source: BookingSource): string {
  return `resources.source.${source}`;
}

/** An `@event-calendar` event. Titles are built by the caller so `$t()` owns copy. */
export interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  title: string;
  backgroundColor: string;
  extendedProps: { booking: BookingView };
}

/**
 * Map bookings to calendar events.
 *
 * An open-ended booking has no end the grid can draw, so it is clamped to
 * `openEndedUntil` (the far edge of the visible window). The booking itself is
 * untouched — only its rectangle stops at the edge of the screen.
 */
export function toCalendarEvents(
  bookings: BookingView[],
  options: { title: (booking: BookingView) => string; openEndedUntil: Date }
): CalendarEvent[] {
  return bookings.map((booking) => {
    const color = bookingColor(booking);
    const end = booking.end ?? options.openEndedUntil.toISOString();
    return {
      id: booking.id,
      start: booking.start,
      end,
      title: options.title(booking),
      backgroundColor: color.background,
      extendedProps: { booking }
    };
  });
}

export interface AgendaGroup {
  /** `YYYY-MM`, the key the list view groups by. */
  month: string;
  bookings: BookingView[];
}

/**
 * Group bookings by the month they start in — the mobile list view.
 *
 * A booking that has already started is filed under the current month rather
 * than the month it began, so "what is out right now" stays at the top of the
 * screen instead of scrolling away into the past.
 */
export function agendaGroups(bookings: BookingView[], now: Date = new Date()): AgendaGroup[] {
  const currentMonth = monthKey(now);
  const groups = new Map<string, BookingView[]>();
  for (const booking of bookings) {
    const start = new Date(booking.start);
    const end = booking.end == null ? null : new Date(booking.end);
    const ongoing = start <= now && (end == null || end > now);
    const key = ongoing ? currentMonth : monthKey(start);
    const list = groups.get(key);
    if (list) list.push(booking);
    else groups.set(key, [booking]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, list]) => ({
      month,
      bookings: list.sort((a, b) => a.start.localeCompare(b.start))
    }));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** The distinct resources present in a booking list, for the filter chips. */
export function resourcesInBookings(bookings: BookingView[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const booking of bookings) {
    if (booking.spId && !seen.has(booking.spId)) seen.set(booking.spId, booking.spName);
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}
