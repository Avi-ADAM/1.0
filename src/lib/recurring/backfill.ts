/**
 * Past cycles of a recurring resource — pure, no I/O.
 *
 * A recurring expense (server rent, an apartment) is often already running when
 * the rikma first records it: the member who pays has paid for a year and a half
 * before anyone opened the resource. The engine only ever opens the cycle that
 * contains *now* (`cycleWindow`, /api/monthi), so those months would never be
 * counted.
 *
 * Backfill closes that gap, and only at creation: the creator lists what each
 * past cycle actually cost, the rikma signs the whole table together with the
 * resource itself (one vote, not one per month), and on activation every past
 * cycle is opened and settled through the same `settleCycleMaap` a normal month
 * goes through. The table is stored on the request (Pmash / OpenMashaabim) as
 * `backfill: { cycles: [{ key, amount }] }`, where `key` is the cycle's start as
 * `YYYY-MM`.
 *
 * Only the creator's own payments can be backfilled — the past months are a
 * claim about what *they* paid, so the request must be self-assigned.
 */

import { cycleWindow, normalizeCycleSize } from './recurringPlan.js';

/** At most five years of monthly cycles in one table. */
export const MAX_BACKFILL_CYCLES = 60;

export type BackfillUnit = 'month' | 'year';

export type BackfillEntry = { key: string; amount: number };

export type BackfillCycle = {
  key: string;
  cycleStart: Date;
  cycleEnd: Date;
  amount: number;
};

/** `YYYY-MM` of a cycle start (local calendar, like `cycleWindow`). */
export function cycleKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function validDate(value: unknown): Date | null {
  const d = value instanceof Date ? value : value == null || value === '' ? null : new Date(String(value));
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/**
 * Every cycle window that starts at `anchor` and ends before the window that
 * contains `now` — the cycles the engine will never open by itself. Empty when
 * the anchor is in the current window or later, or unparseable.
 *
 * Returns at most `limit + 1` windows, so a caller can tell "too many" apart
 * from "exactly the limit" without walking decades of months.
 */
export function pastCycleWindows(
  unit: BackfillUnit,
  anchor: unknown,
  size: unknown = 1,
  now: Date = new Date(),
  limit: number = MAX_BACKFILL_CYCLES
): Array<{ key: string; cycleStart: Date; cycleEnd: Date }> {
  const from = validDate(anchor);
  if (!from) return [];
  const step = normalizeCycleSize(size);
  const current = cycleWindow(unit, from, step, now).cycleStart.getTime();

  const out: Array<{ key: string; cycleStart: Date; cycleEnd: Date }> = [];
  for (let i = 0; i <= limit; i++) {
    // Step by whole cycles from the anchor's own window.
    const ref =
      unit === 'year'
        ? new Date(from.getFullYear() + i * step, 0, 1)
        : new Date(from.getFullYear(), from.getMonth() + i * step, 1);
    const w = cycleWindow(unit, from, step, ref);
    if (w.cycleStart.getTime() >= current) break;
    out.push({ key: cycleKey(w.cycleStart), ...w });
  }
  return out;
}

/** Read whatever was stored or sent — `{ cycles: [...] }` or a bare array. */
export function readBackfillEntries(raw: unknown): BackfillEntry[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as any).cycles)
      ? (raw as any).cycles
      : [];
  const out: BackfillEntry[] = [];
  for (const e of list) {
    if (!e || typeof e !== 'object') continue;
    const key = String((e as any).key ?? '');
    const amount = Number((e as any).amount);
    if (!/^\d{4}-\d{2}$/.test(key) || !Number.isFinite(amount)) continue;
    out.push({ key, amount });
  }
  return out;
}

/**
 * The past cycles to settle: every entry whose key names a past window of this
 * resource, with a positive amount. Entries outside the windows (a start date a
 * counter-proposal moved later, a month that is now current) are dropped, a
 * duplicated key keeps its last amount, and the result is in calendar order —
 * the order the deliveries are written.
 */
export function normalizeBackfill(
  raw: unknown,
  terms: { unit: BackfillUnit; anchor: unknown; size?: unknown; now?: Date }
): BackfillCycle[] {
  const byKey = new Map<string, number>();
  for (const e of readBackfillEntries(raw)) byKey.set(e.key, e.amount);
  if (byKey.size === 0) return [];

  const windows = pastCycleWindows(terms.unit, terms.anchor, terms.size ?? 1, terms.now ?? new Date());
  const out: BackfillCycle[] = [];
  for (const w of windows.slice(0, MAX_BACKFILL_CYCLES)) {
    const amount = byKey.get(w.key);
    if (amount == null || !(amount > 0)) continue;
    out.push({ ...w, amount });
  }
  return out;
}

/** Sum of the backfilled amounts. */
export function backfillTotal(cycles: Array<{ amount: number }>): number {
  return +cycles.reduce((s, c) => s + (Number(c.amount) || 0), 0).toFixed(2);
}

/** What is stored on the request. */
export function backfillPayload(cycles: Array<{ key: string; amount: number }>): { cycles: BackfillEntry[] } {
  return { cycles: cycles.map((c) => ({ key: c.key, amount: c.amount })) };
}
