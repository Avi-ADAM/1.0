/**
 * coverage — the live picture every shift screen reads (docs/PLAN_SHIFTS.md §6.7):
 * who comes, who is next in line, where the holes are.
 *
 * Derived from the stored assignments on every read; nothing here is saved.
 */

import type { AssignmentLike, ShiftLike } from './types.js';

/** States in which a rank-1 row means "this person is coming". */
const COMING = new Set(['draft', 'confirmed', 'done']);

export type CoverageStatus = 'covered' | 'short' | 'empty' | 'overfilled';

export interface ShiftCoverage {
  shiftId: string;
  need: number;
  /** Rank-1 rows still standing, oldest rank first. */
  coming: AssignmentLike[];
  /** The backup chain still standing, in order. */
  backups: AssignmentLike[];
  missing: number;
  status: CoverageStatus;
}

export function coverageOf(shift: ShiftLike, assignments: AssignmentLike[]): ShiftCoverage {
  const mine = assignments.filter((a) => String(a.shiftId) === String(shift.id) && a.state !== 'released');
  const coming = mine.filter((a) => a.rank === 1 && COMING.has(a.state));
  const backups = mine.filter((a) => a.rank > 1).sort((a, b) => a.rank - b.rank);
  const need = Math.max(0, Math.floor(Number(shift.need) || 0));
  const missing = Math.max(0, need - coming.length);
  const status: CoverageStatus =
    coming.length > need ? 'overfilled' : missing === 0 ? 'covered' : coming.length === 0 ? 'empty' : 'short';
  return { shiftId: String(shift.id), need, coming, backups, missing, status };
}

export function coverageMap(shifts: ShiftLike[], assignments: AssignmentLike[]): Map<string, ShiftCoverage> {
  return new Map(
    shifts.filter((s) => s.state !== 'cancelled').map((s) => [String(s.id), coverageOf(s, assignments)])
  );
}

/**
 * The next backup to ask when someone releases a shift (§7.2): the lowest
 * rank still standing that is not already coming and not in `skip` (people
 * already asked who did not answer in time).
 */
export function nextInLine(cov: ShiftCoverage, skip: Iterable<string> = []): AssignmentLike | null {
  const skipped = new Set([...skip].map(String));
  const comingIds = new Set(cov.coming.map((a) => String(a.userId)));
  return cov.backups.find((b) => !skipped.has(String(b.userId)) && !comingIds.has(String(b.userId))) ?? null;
}

/** Holes: every shift still missing people, earliest first. */
export function holesIn(shifts: ShiftLike[], assignments: AssignmentLike[]): ShiftCoverage[] {
  const bySpan = new Map(shifts.map((s) => [String(s.id), s.start]));
  return [...coverageMap(shifts, assignments).values()]
    .filter((c) => c.missing > 0)
    .sort((a, b) => String(bySpan.get(a.shiftId)).localeCompare(String(bySpan.get(b.shiftId))));
}

export interface UpcomingShift {
  shift: ShiftLike;
  rank: number;
}

/** A member's own coming shifts from `now` on — rank 1 first, backups flagged by rank. */
export function upcomingFor(
  userId: string,
  shifts: ShiftLike[],
  assignments: AssignmentLike[],
  now: Date | string = new Date(),
  limit = 20
): UpcomingShift[] {
  const t = new Date(now).getTime();
  const byId = new Map(shifts.map((s) => [String(s.id), s]));
  return assignments
    .filter((a) => String(a.userId) === String(userId) && a.state !== 'released')
    .map((a) => ({ shift: byId.get(String(a.shiftId)), rank: a.rank }))
    .filter((x): x is UpcomingShift => !!x.shift && x.shift.state !== 'cancelled' && new Date(x.shift.end).getTime() > t)
    .sort((a, b) => a.shift.start.localeCompare(b.shift.start) || a.rank - b.rank)
    .slice(0, limit);
}

/**
 * Headroom for the hole card (§7.1): members who agreed to more shifts than
 * they got this cycle, most headroom first. They see the hole first.
 */
export function headroom(
  commitments: Array<{ userId: string; max?: number | null }>,
  taken: Record<string, number>
): Array<{ userId: string; spare: number }> {
  return commitments
    .map((c) => ({
      userId: String(c.userId),
      spare: c.max == null ? Infinity : Math.max(0, Math.floor(c.max) - (taken[String(c.userId)] ?? 0))
    }))
    .filter((x) => x.spare > 0)
    .sort((a, b) => b.spare - a.spare || a.userId.localeCompare(b.userId));
}
