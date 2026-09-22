/**
 * settings — the timing of a shift plan and its roster cycles
 * (docs/PLAN_SHIFTS.md §3.7, §7).
 *
 * Every timing field on `shift-plan` is nullable on purpose: NULL inherits the
 * rikma's default on `Project`, and a NULL there falls back to the constants
 * below — the same "NULL = legacy = default" rule as `dormancyDays`.
 *
 * A cycle [start, end) runs on its own clock, not on `restime` (§1.3):
 *
 *   declareFrom ─── members declare ─── draftAt ── objections ── closesAt ── start
 *                                     (start − closeOffset)  (draftAt + window)
 */

import { CalendarDate, fromAbsolute, toCalendarDate, toZoned, CalendarDateTime } from '@internationalized/date';

export const SHIFT_DEFAULTS = Object.freeze({
  cycleDays: 7,
  horizonDays: 28,
  closeOffsetHours: 48,
  draftWindowHours: 24,
  declareOpenDays: 21,
  carryDecay: 0.5,
  timeZone: 'Asia/Jerusalem',
  /** Cycles start on this weekday of the anchor: a Sunday. */
  anchor: '1970-01-04'
});

export interface PlanTiming {
  cycleDays?: number | null;
  horizonDays?: number | null;
  closeOffsetHours?: number | null;
  draftWindowHours?: number | null;
  declareOpenDays?: number | null;
  carryDecay?: number | null;
  timezone?: string | null;
  maxBackups?: number | null;
  minRestHours?: number | null;
}

export interface ProjectTiming {
  shiftCycleDays?: number | null;
  shiftCloseOffsetHours?: number | null;
  shiftDraftWindowHours?: number | null;
}

export interface ShiftSettings {
  cycleDays: number;
  horizonDays: number;
  closeOffsetHours: number;
  draftWindowHours: number;
  declareOpenDays: number;
  carryDecay: number;
  timeZone: string;
  maxBackups: number | null;
  minRestHours: number;
}

const pick = (...values: Array<number | null | undefined>): number | undefined =>
  values.find((v) => v != null && Number.isFinite(Number(v))) as number | undefined;

export function resolveSettings(plan: PlanTiming = {}, project: ProjectTiming = {}): ShiftSettings {
  const cycleDays = Math.max(1, Math.floor(pick(plan.cycleDays, project.shiftCycleDays) ?? SHIFT_DEFAULTS.cycleDays));
  const closeOffsetHours = Math.max(
    0,
    pick(plan.closeOffsetHours, project.shiftCloseOffsetHours) ?? SHIFT_DEFAULTS.closeOffsetHours
  );
  // The objection window may not run past the start of the cycle it rosters.
  const draftWindowHours = Math.min(
    closeOffsetHours,
    Math.max(0, pick(plan.draftWindowHours, project.shiftDraftWindowHours) ?? SHIFT_DEFAULTS.draftWindowHours)
  );
  return {
    cycleDays,
    horizonDays: Math.max(cycleDays, Math.floor(pick(plan.horizonDays) ?? SHIFT_DEFAULTS.horizonDays)),
    closeOffsetHours,
    draftWindowHours,
    declareOpenDays: Math.max(1, Math.floor(pick(plan.declareOpenDays) ?? SHIFT_DEFAULTS.declareOpenDays)),
    carryDecay: Math.min(1, Math.max(0, pick(plan.carryDecay) ?? SHIFT_DEFAULTS.carryDecay)),
    timeZone: plan.timezone || SHIFT_DEFAULTS.timeZone,
    maxBackups: plan.maxBackups == null ? null : Math.max(0, Math.floor(plan.maxBackups)),
    minRestHours: Math.max(0, Number(plan.minRestHours) || 0)
  };
}

export interface CycleWindow {
  /** `<planId>|<startISO>` — stored as `roster-period.periodKey`, unique. */
  periodKey: string;
  start: string;
  end: string;
  declareFrom: string;
  draftAt: string;
  closesAt: string;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function localMidnight(date: CalendarDate, timeZone: string): Date {
  return toZoned(new CalendarDateTime(date.year, date.month, date.day), timeZone, 'compatible').toDate();
}

function anchorDate(): CalendarDate {
  const [y, m, d] = SHIFT_DEFAULTS.anchor.split('-').map(Number);
  return new CalendarDate(y, m, d);
}

function dayIndex(date: CalendarDate): number {
  const a = anchorDate();
  return Math.round((Date.UTC(date.year, date.month - 1, date.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY);
}

/** The cycle that contains `at`: local midnight to local midnight, cycleDays long, starting on Sundays. */
export function cycleContaining(planId: string, at: Date | string, s: ShiftSettings): CycleWindow {
  const today = toCalendarDate(fromAbsolute(new Date(at).getTime(), s.timeZone));
  const offset = ((dayIndex(today) % s.cycleDays) + s.cycleDays) % s.cycleDays;
  const startDate = today.subtract({ days: offset });
  return windowFrom(planId, startDate, s);
}

function windowFrom(planId: string, startDate: CalendarDate, s: ShiftSettings): CycleWindow {
  const start = localMidnight(startDate, s.timeZone);
  const end = localMidnight(startDate.add({ days: s.cycleDays }), s.timeZone);
  const draftAt = new Date(start.getTime() - s.closeOffsetHours * HOUR);
  const closesAt = new Date(draftAt.getTime() + s.draftWindowHours * HOUR);
  const declareFrom = new Date(start.getTime() - s.declareOpenDays * DAY);
  return {
    periodKey: `${planId}|${start.toISOString()}`,
    start: start.toISOString(),
    end: end.toISOString(),
    declareFrom: declareFrom.toISOString(),
    draftAt: draftAt.toISOString(),
    closesAt: closesAt.toISOString()
  };
}

/** Every cycle that overlaps [from, to), in order. */
export function cyclesBetween(planId: string, from: Date | string, to: Date | string, s: ShiftSettings): CycleWindow[] {
  const out: CycleWindow[] = [];
  const toMs = new Date(to).getTime();
  let cur = cycleContaining(planId, from, s);
  while (new Date(cur.start).getTime() < toMs) {
    out.push(cur);
    // Advance by the local date of the next start, not by milliseconds (DST).
    const nextLocal = toCalendarDate(fromAbsolute(new Date(cur.end).getTime(), s.timeZone));
    cur = windowFrom(planId, nextLocal, s);
  }
  return out;
}

export type CyclePhase = 'upcoming' | 'declaring' | 'draft' | 'closed' | 'running' | 'past';

/** Where a cycle stands at `now` (§7). `closed` = roster final, cycle not yet started. */
export function phaseAt(c: CycleWindow, now: Date | string = new Date()): CyclePhase {
  const t = new Date(now).getTime();
  if (t < new Date(c.declareFrom).getTime()) return 'upcoming';
  if (t < new Date(c.draftAt).getTime()) return 'declaring';
  if (t < new Date(c.closesAt).getTime()) return 'draft';
  if (t < new Date(c.start).getTime()) return 'closed';
  if (t < new Date(c.end).getTime()) return 'running';
  return 'past';
}
