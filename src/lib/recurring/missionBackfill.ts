/**
 * Past months of a recurring mission — pure, no I/O.
 *
 * The mission twin of `./backfill`: a monthly mission is often already running
 * when the rikma first records it, and nothing opens the months that went by.
 * The creator lists the hours of each past month, the rikma signs the table
 * together with the mission (one vote, not one per month), and on activation the
 * hours are banked and every month is written to the mission's ledger.
 *
 * It uses the resource's stored shape, `{ cycles: [{ key, amount }] }`, where
 * `amount` here is **hours**. The table is a claim about what one named member
 * did, so the mission must be assigned: to the creator, or to another member of
 * the rikma, whose explicit yes the assigned-offer gate requires before anything
 * is written in their name (silence is never their consent there).
 *
 * Each month is written as an approved `monter` row (`isDone`), which is the one
 * state /api/monthi and /api/fixer promise never to touch. There are no Timers
 * behind these months, and an unapproved row with no timers reads as unverified.
 */

import { roundHours, workValue } from '$lib/timers/precision.js';
import {
  MAX_BACKFILL_CYCLES,
  normalizeBackfill,
  pastCycleWindows,
  readBackfillEntries,
  type BackfillCycle
} from './backfill';
import { monthStartString, type MonterRow } from './missionMonths.js';

/** 31 days. Anything above it is a typo, and it would buy equity. */
export const MAX_HOURS_IN_MONTH = 744;

/** The months that started at `anchor` and ended before the current month. */
export function missionPastMonths(anchor: unknown, now: Date = new Date()) {
  return pastCycleWindows('month', anchor, 1, now);
}

export type MissionBackfillTerms = {
  iskvua: boolean;
  /** The mission is assigned to the sender or to another member of the rikma. */
  isAssigned: boolean;
  anchor: unknown;
  now?: Date;
};

/** Why this table cannot be accepted, or null when it can. */
export function missionBackfillProblem(raw: unknown, terms: MissionBackfillTerms): string | null {
  const entries = readBackfillEntries(raw);
  if (entries.length === 0) return null;
  if (!terms.iskvua) return 'Past months can only be entered for a recurring mission';
  if (!terms.isAssigned) return 'Past months can only be entered for a mission assigned to a member of this rikma';
  if (entries.some((e) => e.amount < 0 || e.amount > MAX_HOURS_IN_MONTH)) {
    return `A past month must be between 0 and ${MAX_HOURS_IN_MONTH} hours`;
  }
  const windows = missionPastMonths(terms.anchor, terms.now ?? new Date());
  if (windows.length === 0) return 'Past months need a start date before the current month';
  if (windows.length > MAX_BACKFILL_CYCLES) {
    return `At most ${MAX_BACKFILL_CYCLES} past months can be entered - choose a later start date`;
  }
  return null;
}

/** The months to settle: a real past month of this mission, with hours in it. */
export function missionBackfillCycles(
  raw: unknown,
  terms: { anchor: unknown; now?: Date }
): BackfillCycle[] {
  return normalizeBackfill(raw, { unit: 'month', anchor: terms.anchor, size: 1, now: terms.now });
}

/** The hours and what they are worth at `rate`. */
export function missionBackfillBook(cycles: Array<{ amount: number }>, rate: unknown) {
  const hours = roundHours(cycles.reduce((sum, c) => sum + roundHours(c.amount), 0));
  return { hours, value: workValue(hours, rate) };
}

/** One approved ledger row per month, in calendar order. */
export function missionBackfillRows(cycles: BackfillCycle[], plannedHours: unknown): MonterRow[] {
  return cycles.map((c) => ({
    monthStart: monthStartString(c.key),
    hours: Number(plannedHours) || 0,
    isDone: true,
    hoursDone: roundHours(c.amount)
  }));
}
