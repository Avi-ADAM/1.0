/**
 * Monthly mission-hours ledger — pure, no I/O.
 *
 * A `kvua` (fixed) mission accumulates hours in `howmanyhoursalready` and, at
 * the turn of each month, /api/monthi files them as a `monter` row
 * ({ monthStart, hours, isDone, hoursDone }) and resets the counter.
 *
 * `howmanyhoursalready` is a single scalar with **no month attached**, so it
 * cannot say which month its hours belong to. Treating it as the closing
 * month's total is what let a run on the 2nd of August file August's hours
 * under July and then zero them — losing both months. The Timer rows are the
 * only month-aware record (every Timer is created with `mesimabetahalich` set,
 * qid `33CreateTimer`, and carries `timers { start stop }` segments), so all
 * month arithmetic here derives from segments and never from the counter.
 *
 * Everything is local-time: `monthStart` values are compared and produced as
 * `YYYY-MM` strings by slicing, never by re-parsing through `Date` — Strapi
 * returns `"2026-07-01"`, which `new Date()` reads as UTC midnight and can slide
 * into the previous month.
 */

export type TimerSegment = { start?: string | null; stop?: string | null };

export type MonterRow = {
  monthStart: string;
  hours: number;
  isDone: boolean;
  hoursDone: number;
};

/** `YYYY-MM` for a Date, an ISO string, or a stored `monthStart`. */
export function monthKeyOf(value: Date | string | null | undefined): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})/.exec(value.trim());
    return m ? `${m[1]}-${m[2]}` : null;
  }
  return null;
}

/** The `monthStart` a `YYYY-MM` key is stored as. */
export function monthStartString(key: string): string {
  return `${key}-01`;
}

/**
 * Hours per calendar month across all segments, splitting any segment that
 * crosses a month boundary. A segment with no `stop` is still running and is
 * measured up to `nowMs`.
 */
export function hoursByMonth(
  segments: TimerSegment[] | null | undefined,
  nowMs: number = Date.now()
): Map<string, number> {
  const out = new Map<string, number>();
  for (const seg of segments ?? []) {
    if (!seg?.start) continue;
    const start = new Date(seg.start).getTime();
    if (!Number.isFinite(start)) continue;
    const parsedStop = seg.stop ? new Date(seg.stop).getTime() : nowMs;
    const stop = Number.isFinite(parsedStop) ? parsedStop : nowMs;
    if (stop <= start) continue;

    let cursor = start;
    while (cursor < stop) {
      const d = new Date(cursor);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const chunkEnd = Math.min(stop, nextMonth);
      out.set(key, (out.get(key) ?? 0) + (chunkEnd - cursor) / 3600000);
      cursor = chunkEnd;
    }
  }
  return out;
}

/**
 * The month a stretch of work belongs to: the one holding most of its hours.
 *
 * An approval is stamped with a month, and stamping it with *today* files
 * August's work under September the moment a member saves on the 1st — which is
 * exactly when they do. The hours themselves know when they happened, so ask
 * them. Returns a `YYYY-MM-01` string, or null when there is nothing to go on.
 */
export function workMonthOf(
  segments: TimerSegment[] | null | undefined,
  nowMs: number = Date.now()
): string | null {
  const byMonth = hoursByMonth(segments, nowMs);
  let best: string | null = null;
  let most = 0;
  for (const [key, hours] of byMonth) {
    // Ties go to the later month — work that straddles midnight on the 1st
    // reads as belonging to the month it carried on into.
    if (hours > most || (hours === most && best !== null && key > best)) {
      most = hours;
      best = key;
    }
  }
  return best ? monthStartString(best) : null;
}

/** Hours inside one calendar month (0-indexed `month`, as `Date` uses). */
export function hoursInMonth(
  segments: TimerSegment[] | null | undefined,
  year: number,
  month: number,
  nowMs: number = Date.now()
): number {
  const norm = new Date(year, month, 1);
  const key = `${norm.getFullYear()}-${String(norm.getMonth() + 1).padStart(2, '0')}`;
  return hoursByMonth(segments, nowMs).get(key) ?? 0;
}

/** Normalize whatever Strapi returned for a `monter` entry. */
export function normalizeRows(monter: unknown): MonterRow[] {
  return (Array.isArray(monter) ? monter : [])
    .filter((r): r is Record<string, unknown> => Boolean(r))
    .map((r) => ({
      monthStart: String(r.monthStart ?? ''),
      hours: Number(r.hours ?? 0) || 0,
      isDone: r.isDone === true,
      hoursDone: Number(r.hoursDone ?? 0) || 0
    }));
}

/**
 * Flatten Strapi Timer entities into segments.
 *
 * A Timer holds its work as `timers { start stop }` components; the entity's
 * own `start`/`finnish` are the outer bounds of the session and are used only
 * as a fallback for timers saved before the component existed (using both would
 * count the same hours twice).
 */
export function segmentsFromTimers(timers: any[] | null | undefined): TimerSegment[] {
  const out: TimerSegment[] = [];
  for (const timer of Array.isArray(timers) ? timers : []) {
    const attrs = timer?.attributes ?? timer ?? {};
    const parts = Array.isArray(attrs.timers) ? attrs.timers : [];
    if (parts.length) {
      for (const part of parts) {
        if (part?.start) out.push({ start: part.start, stop: part.stop ?? null });
      }
      continue;
    }
    if (attrs.start) {
      // A running legacy timer has no finish yet — `hoursByMonth` measures an
      // open segment up to now, which is exactly what "live" means here.
      out.push({ start: attrs.start, stop: attrs.finnish ?? null });
    }
  }
  return out;
}

/** Hours are shown to two decimals; a smaller gap is not a disagreement. */
const DISPLAY_EPSILON = 0.005;

/** One month as the UI shows it. */
export type LedgerMonth = {
  /** `YYYY-MM`. */
  key: string;
  monthStart: string;
  /** Planned hours for the month (`monter.hours`, else the mission's assignment). */
  assigned: number;
  /** The hours to display — the best available truth for this month. */
  hoursDone: number;
  /** What the stored ledger says, or null when no row exists for the month. */
  filed: number | null;
  /** What the timers say. */
  computed: number;
  /** Approved/closed month — paid out, never rewritten. */
  isDone: boolean;
  /** The month we are standing in: still accumulating, not filed yet. */
  isOpen: boolean;
  /**
   *  · `approved`   — closed and signed off; `filed` is the truth.
   *  · `live`       — the open month, counting up from the timers right now.
   *  · `filed`      — closed month whose stored row matches the timers.
   *  · `mismatch`   — the timers disagree with the stored row (or no row was
   *                   ever written); `/api/fixer` is what repairs it.
   *  · `unverified` — a stored row no timer backs.
   */
  state: 'approved' | 'live' | 'filed' | 'mismatch' | 'unverified';
};

export type LedgerResult = {
  /** Newest month first. */
  months: LedgerMonth[];
  /** The open month, also present inside `months`. */
  openMonth: LedgerMonth | null;
  /** Sum of every month's displayed hours, the open one included. */
  totalDone: number;
};

/**
 * The monthly ledger as it should be *read* — the same arithmetic
 * `reconcileMonter` writes, but non-destructive and including the open month.
 *
 * The stored ledger only ever describes closed months, so a page that renders
 * `monter` alone shows nothing for the month in progress, and `howmanyhoursalready`
 * (which it would fall back to) misses a timer that is still running. Deriving
 * every month from the timer segments makes the current month live and shows,
 * for past months, where the stored row and the timers disagree.
 */
export function buildMonthlyLedger(input: {
  /** `monter` as stored (raw or normalized). */
  rows: unknown;
  /** Every timer segment of the mission, saved or still running. */
  segments: TimerSegment[] | null | undefined;
  /** Mission `hoursassinged` — the monthly plan when a row has none. */
  hoursassinged?: number | null;
  /** `howmanyhoursalready`, the fallback for the open month of a timer-less mission. */
  counter?: number | null;
  now?: Date;
}): LedgerResult {
  const now =
    input.now instanceof Date && !Number.isNaN(input.now.getTime()) ? input.now : new Date();
  const openKey = monthKeyOf(now)!;
  const byMonth = hoursByMonth(input.segments, now.getTime());
  const hasTimers = byMonth.size > 0;
  const assignedDefault = Number(input.hoursassinged ?? 0) || 0;

  const rows = normalizeRows(input.rows);
  const groups = new Map<string, MonterRow[]>();
  for (const row of rows) {
    const key = monthKeyOf(row.monthStart);
    if (!key) continue; // an unreadable monthStart has no month to show it in
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const keys = new Set<string>([...groups.keys(), ...byMonth.keys(), openKey]);
  const months: LedgerMonth[] = [];

  for (const key of [...keys].sort().reverse()) {
    const group = groups.get(key) ?? [];
    const approved = group.find((r) => r.isDone) ?? null;
    const stored = approved ?? group[0] ?? null;
    const computed = byMonth.get(key) ?? 0;
    const isOpen = key === openKey;

    let hoursDone: number;
    let state: LedgerMonth['state'];
    if (approved) {
      hoursDone = approved.hoursDone;
      state = 'approved';
    } else if (isOpen) {
      // Never read the open month off `monter` — a row there is a leftover the
      // fixer leaves alone, not a total. Without timers the counter is all we have.
      hoursDone = hasTimers ? computed : (Number(input.counter ?? 0) || 0);
      state = 'live';
    } else if (computed > 0) {
      hoursDone = computed;
      // Compared at the precision the hours are *shown* in. Below that the two
      // numbers are the same number, and flagging it would put a note on screen
      // ("the ledger says 8.7") next to an identical figure.
      state = stored && Math.abs(stored.hoursDone - computed) < DISPLAY_EPSILON ? 'filed' : 'mismatch';
    } else {
      hoursDone = stored?.hoursDone ?? 0;
      state = stored ? 'unverified' : 'filed';
    }

    months.push({
      key,
      monthStart: stored?.monthStart || monthStartString(key),
      assigned: stored?.hours ?? assignedDefault,
      hoursDone,
      filed: stored ? stored.hoursDone : null,
      computed,
      isDone: Boolean(approved),
      isOpen,
      state
    });
  }

  return {
    months,
    openMonth: months.find((m) => m.isOpen) ?? null,
    totalDone: months.reduce((sum, m) => sum + m.hoursDone, 0)
  };
}

export type ReconcileInput = {
  /** Existing `monter` rows, as stored. */
  rows: MonterRow[];
  /** Every timer segment of the mission, saved or still running. */
  segments: TimerSegment[] | null | undefined;
  /** Mission `hoursassinged`, used as `hours` on rows that did not exist. */
  hoursassinged?: number | null;
  /** "Now" — its calendar month stays on the counter and is not filed. */
  now?: Date;
  /**
   * Remove unapproved rows for months the timers show no work in. Off by
   * default: hours entered without a timer are indistinguishable from a bogus
   * row, and dropping them silently would delete real history.
   */
  dropEmpty?: boolean;
};

export type MonterChange = {
  month: string;
  kind: 'added' | 'corrected' | 'collapsed' | 'dropped' | 'unverified';
  from?: number;
  to?: number;
};

export type ReconcileResult = {
  /** The `monter` list as it should be stored, chronological. */
  rows: MonterRow[];
  /** What `howmanyhoursalready` should be: this month's hours so far. */
  counter: number;
  changes: MonterChange[];
};

/**
 * Rebuild a mission's monthly ledger from its timers.
 *
 * Rules that make this safe to re-run:
 *  - an **approved** row (`isDone`) is never touched — it has been paid out;
 *  - the **open** (current) month is never filed, it belongs on the counter,
 *    which is what /api/monthi will file when the month turns;
 *  - a month with two rows collapses to one (the duplicate a pre-fix monthi
 *    run could append);
 *  - a month the timers show no work in keeps its row unless `dropEmpty`.
 */
export function reconcileMonter(input: ReconcileInput): ReconcileResult {
  const now = input.now instanceof Date && !Number.isNaN(input.now.getTime()) ? input.now : new Date();
  const openKey = monthKeyOf(now)!;
  const byMonth = hoursByMonth(input.segments, now.getTime());
  const counter = byMonth.get(openKey) ?? 0;

  const groups = new Map<string, MonterRow[]>();
  const orphans: MonterRow[] = [];
  for (const row of input.rows) {
    const key = monthKeyOf(row.monthStart);
    if (!key) {
      orphans.push(row); // unreadable monthStart — never silently discarded
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const keys = new Set<string>([...groups.keys(), ...byMonth.keys()]);
  const changes: MonterChange[] = [];
  const out: MonterRow[] = [];

  for (const key of [...keys].sort()) {
    const group = groups.get(key) ?? [];
    // The open month and anything after it are not history yet.
    if (key >= openKey) {
      if (group.length) out.push(...group);
      continue;
    }

    const approved = group.find((r) => r.isDone);
    if (approved) {
      out.push(approved);
      if (group.length > 1) changes.push({ month: key, kind: 'collapsed' });
      continue;
    }

    const computed = byMonth.get(key) ?? 0;
    const previous = group[0];

    if (computed > 0) {
      // A row that already agrees to the precision it is stored and shown at is
      // left exactly as it is. Strapi rounds `hoursDone` to two decimals, so a
      // full-precision rewrite differs from the stored value on every single
      // run — which made this "repair" rewrite the whole ledger every time it
      // was called, replacing every component row for no visible change.
      const agrees = previous && Math.abs(previous.hoursDone - computed) <= DISPLAY_EPSILON;
      out.push({
        monthStart: previous?.monthStart || monthStartString(key),
        hours: previous?.hours ?? (Number(input.hoursassinged ?? 0) || 0),
        isDone: false,
        hoursDone: agrees ? previous.hoursDone : computed
      });
      if (!previous) {
        changes.push({ month: key, kind: 'added', to: computed });
      } else if (!agrees) {
        changes.push({ month: key, kind: 'corrected', from: previous.hoursDone, to: computed });
      }
      if (group.length > 1) changes.push({ month: key, kind: 'collapsed' });
      continue;
    }

    if (!group.length) continue; // nothing worked, nothing filed
    if (input.dropEmpty) {
      changes.push({ month: key, kind: 'dropped', from: previous.hoursDone });
    } else {
      out.push(previous);
      if (previous.hoursDone > 0) {
        changes.push({ month: key, kind: 'unverified', from: previous.hoursDone });
      }
      if (group.length > 1) changes.push({ month: key, kind: 'collapsed' });
    }
  }

  return { rows: [...out, ...orphans], counter, changes };
}
