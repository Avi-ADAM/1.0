/**
 * balance — fairness across cycles (docs/PLAN_SHIFTS.md §6.5).
 *
 * One cycle's quotas are fair to that cycle only. What stops the same person
 * from being "number one" every week is the carry-over: in each closed cycle,
 * how many places a member actually took minus their quota, weighted down the
 * further back it is (`decay^age`), so old history fades instead of ruling.
 *
 * Derived, never stored: `shift-plan.balanceCache` is only a cache of this
 * function's output, like `Sp.panui` is for resources (§1.4).
 */

import type { AssignmentLike } from './types.js';

/** A place counts once it stands: drafted, confirmed, or worked. A released one does not. */
const COUNTING = new Set(['draft', 'confirmed', 'done']);

/** Rank-1 places per member — the ones who come, including whoever covered a released shift. */
export function placesTaken(assignments: AssignmentLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of assignments) {
    if (a.rank !== 1 || !COUNTING.has(a.state)) continue;
    const u = String(a.userId);
    out[u] = (out[u] ?? 0) + 1;
  }
  return out;
}

export interface ClosedCycle {
  closedAt: string;
  /** The quotas the cycle was drafted with (`roster-period.quotaSnapshot`). */
  quotas: Record<string, number>;
  assignments: AssignmentLike[];
}

/**
 * Carry-over per member: sum of (taken − quota) × decay^age, age 0 = the most
 * recent closed cycle. Positive = took more than their share (next quota
 * shrinks); negative = is owed.
 */
export function carryOver(cycles: ClosedCycle[], decay = 0.5): Record<string, number> {
  const d = Number.isFinite(decay) ? Math.min(1, Math.max(0, decay)) : 0.5;
  const ordered = [...cycles].sort((a, b) => b.closedAt.localeCompare(a.closedAt));
  const out: Record<string, number> = {};
  ordered.forEach((cycle, age) => {
    const weight = d ** age;
    if (weight === 0) return;
    const taken = placesTaken(cycle.assignments);
    const users = new Set([...Object.keys(cycle.quotas ?? {}), ...Object.keys(taken)]);
    for (const u of users) {
      const delta = (taken[u] ?? 0) - (Number(cycle.quotas?.[u]) || 0);
      out[u] = (out[u] ?? 0) + delta * weight;
    }
  });
  // Round away float dust so an exactly even history reads as 0.
  for (const u of Object.keys(out)) out[u] = Math.round(out[u] * 1e6) / 1e6;
  return out;
}
