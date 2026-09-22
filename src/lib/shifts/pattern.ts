/**
 * pattern — from "the rikma needs someone here on these hours" to concrete
 * shifts (docs/PLAN_SHIFTS.md §3.6, §6.1).
 *
 * Wall-clock times are converted with @internationalized/date in the plan's
 * own time zone, never with `new Date(x + n * 60_000)`: on a daylight-saving
 * change a 01:00–05:00 window is three or five real hours long, and hours are
 * what equity and the stipend are computed from. A shift whose length is off
 * by an hour is a pay error, not a display bug.
 *
 * Materializing is idempotent by construction — every instance carries the
 * `slotKey` it will be stored under (`shift.slotKey` is unique in Strapi), so
 * running the materializer twice produces the same keys, never a second shift.
 */

import { CalendarDate, CalendarDateTime, toZoned, toCalendarDate, fromAbsolute } from '@internationalized/date';
import type { PatternDay, ShiftInstance, ShiftPattern, ShiftWindow } from './types.js';

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Week 0 of a multi-week cycle when the plan names no anchor: a Sunday. */
const DEFAULT_ANCHOR = '1970-01-04';
const MS_PER_HOUR = 60 * 60 * 1000;

export interface PatternIssue {
  path: string;
  code: 'badTime' | 'zeroLength' | 'badNeed' | 'badDow' | 'badWeek' | 'duplicate' | 'badDate' | 'badAnchor';
}

function minutes(hhmm: string): number {
  const m = TIME.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}

function parseLocalDate(s: string): CalendarDate | null {
  const m = DATE.exec(s ?? '');
  if (!m) return null;
  try {
    const d = new CalendarDate(Number(m[1]), Number(m[2]), Number(m[3]));
    // CalendarDate silently balances 2026-02-31 into March; reject that.
    return d.toString() === s ? d : null;
  } catch {
    return null;
  }
}

/** 0 = Sunday, independent of any locale's first day of the week. */
function dayOfWeek(d: CalendarDate): number {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / (24 * MS_PER_HOUR)
  );
}

/**
 * Everything wrong with a pattern, as codes the form can put next to the field.
 * An empty array means the pattern can be saved.
 */
export function validatePattern(pattern: ShiftPattern): PatternIssue[] {
  const issues: PatternIssue[] = [];
  const weeks = pattern?.weeks ?? 1;
  if (!Number.isInteger(weeks) || weeks < 1) issues.push({ path: 'weeks', code: 'badWeek' });
  if (pattern?.anchor != null) {
    const a = parseLocalDate(pattern.anchor);
    if (!a || dayOfWeek(a) !== 0) issues.push({ path: 'anchor', code: 'badAnchor' });
  }

  const checkWindows = (windows: ShiftWindow[], base: string) => {
    const seen = new Set<string>();
    (windows ?? []).forEach((w, i) => {
      const p = `${base}.windows[${i}]`;
      const s = minutes(w?.start);
      const e = minutes(w?.end);
      if (Number.isNaN(s)) issues.push({ path: `${p}.start`, code: 'badTime' });
      if (Number.isNaN(e)) issues.push({ path: `${p}.end`, code: 'badTime' });
      if (!Number.isNaN(s) && s === e) issues.push({ path: p, code: 'zeroLength' });
      if (!Number.isInteger(w?.need) || w.need < 1) issues.push({ path: `${p}.need`, code: 'badNeed' });
      // Two windows that start together for the same role would share a slotKey.
      const key = `${w?.start}|${w?.tafkidimId ?? ''}`;
      if (seen.has(key)) issues.push({ path: p, code: 'duplicate' });
      seen.add(key);
    });
  };

  const seenDays = new Set<string>();
  (pattern?.days ?? []).forEach((d, i) => {
    const base = `days[${i}]`;
    if (!Number.isInteger(d?.dow) || d.dow < 0 || d.dow > 6) issues.push({ path: `${base}.dow`, code: 'badDow' });
    if (d?.week != null && (!Number.isInteger(d.week) || d.week < 0 || d.week >= weeks)) {
      issues.push({ path: `${base}.week`, code: 'badWeek' });
    }
    const dayKey = `${d?.dow}|${d?.week ?? '*'}`;
    if (seenDays.has(dayKey)) issues.push({ path: base, code: 'duplicate' });
    seenDays.add(dayKey);
    checkWindows(d?.windows, base);
  });
  (pattern?.exceptions ?? []).forEach((x, i) => {
    if (!parseLocalDate(x?.date)) issues.push({ path: `exceptions[${i}].date`, code: 'badDate' });
    checkWindows(x?.windows, `exceptions[${i}]`);
  });
  return issues;
}

/** The windows that apply on one local date, exceptions first. */
function windowsFor(pattern: ShiftPattern, date: CalendarDate, anchor: CalendarDate): ShiftWindow[] {
  const iso = date.toString();
  const exception = (pattern.exceptions ?? []).find((x) => x.date === iso);
  if (exception) return exception.windows ?? [];

  const weeks = pattern.weeks ?? 1;
  const dow = dayOfWeek(date);
  const weekIndex = (((Math.floor(daysBetween(anchor, date) / 7)) % weeks) + weeks) % weeks;
  const matching = (pattern.days ?? []).filter(
    (d: PatternDay) => d.dow === dow && (d.week == null || d.week === weekIndex)
  );
  return matching.flatMap((d) => d.windows ?? []);
}

function atLocal(date: CalendarDate, hhmm: string, timeZone: string): Date {
  const m = minutes(hhmm);
  const dt = new CalendarDateTime(date.year, date.month, date.day, Math.floor(m / 60), m % 60);
  // 'compatible': a time inside the spring-forward gap moves forward, an
  // ambiguous one in the fall-back hour takes the earlier instant — the same
  // rule a wall clock follows.
  return toZoned(dt, timeZone, 'compatible').toDate();
}

export interface MaterializeOptions {
  planId: string;
  timeZone: string;
  /** Inclusive start of the window to materialize (instant). */
  from: Date | string;
  /** Exclusive end. */
  to: Date | string;
}

/**
 * Every shift the pattern defines whose start falls in [from, to), in start
 * order. Invalid windows are skipped rather than thrown on — validate before
 * saving; by the time the cron runs, a bad row must not stop the good ones.
 */
export function materialize(pattern: ShiftPattern, opts: MaterializeOptions): ShiftInstance[] {
  const from = new Date(opts.from).getTime();
  const to = new Date(opts.to).getTime();
  if (!(to > from)) return [];

  const anchor = parseLocalDate(pattern.anchor ?? DEFAULT_ANCHOR) ?? parseLocalDate(DEFAULT_ANCHOR)!;
  // Start a day early: a window that begins before `from` in local time can
  // still be the one whose instant lands inside the range after a zone shift.
  let day = toCalendarDate(fromAbsolute(from, opts.timeZone)).subtract({ days: 1 });
  const last = toCalendarDate(fromAbsolute(to, opts.timeZone));

  const out: ShiftInstance[] = [];
  while (day.compare(last) <= 0) {
    for (const w of windowsFor(pattern, day, anchor)) {
      const s = minutes(w.start);
      const e = minutes(w.end);
      if (Number.isNaN(s) || Number.isNaN(e) || s === e || !(w.need >= 1)) continue;
      const start = atLocal(day, w.start, opts.timeZone);
      const end = atLocal(e < s ? day.add({ days: 1 }) : day, w.end, opts.timeZone);
      const t = start.getTime();
      if (t < from || t >= to || !(end.getTime() > t)) continue;
      const startISO = start.toISOString();
      const tafkidimId = w.tafkidimId ?? null;
      out.push({
        slotKey: `${opts.planId}|${startISO}|${tafkidimId ?? ''}`,
        start: startISO,
        end: end.toISOString(),
        need: Math.floor(w.need),
        tafkidimId,
        localDate: day.toString()
      });
    }
    day = day.add({ days: 1 });
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.slotKey.localeCompare(b.slotKey));
}

/** Real hours of a materialized shift — DST-correct because start/end are instants. */
export function shiftHours(shift: { start: string; end: string }): number {
  return (new Date(shift.end).getTime() - new Date(shift.start).getTime()) / MS_PER_HOUR;
}

/**
 * Nominal staffed person-hours per week: sum of window length × need, averaged over
 * a multi-week cycle. Wall-clock arithmetic on purpose — this is the number
 * the form shows while someone is still drawing the pattern, not a pay figure.
 */
export function weeklyStaffedHours(pattern: ShiftPattern): number {
  const weeks = Math.max(1, pattern?.weeks ?? 1);
  let total = 0;
  for (const d of pattern?.days ?? []) {
    const perDay = (d.windows ?? []).reduce((sum, w) => {
      const s = minutes(w.start);
      const e = minutes(w.end);
      if (Number.isNaN(s) || Number.isNaN(e) || s === e || !(w.need >= 1)) return sum;
      const len = (e > s ? e - s : e + 24 * 60 - s) / 60;
      return sum + len * Math.floor(w.need);
    }, 0);
    // A day pinned to one week of the cycle happens once per cycle; an
    // unpinned day happens every week.
    total += d.week == null ? perDay * weeks : perDay;
  }
  return total / weeks;
}

/**
 * "How many people does it take to actually staff this?" (§9.5 step 3):
 * weekly person-hours over the hours one person gives a week, rounded up.
 * At least 1; 0 hours per person gives 1 rather than infinity.
 */
export function suggestHeadcount(pattern: ShiftPattern, hoursPerPerson: number): number {
  const hours = weeklyStaffedHours(pattern);
  if (!(hoursPerPerson > 0) || hours <= 0) return 1;
  return Math.max(1, Math.ceil(hours / hoursPerPerson - 1e-9));
}
