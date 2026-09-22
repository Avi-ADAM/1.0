/**
 * draftRoster — who comes to which shift, and who is next in line
 * (docs/PLAN_SHIFTS.md §6.3). The heart of the shift system.
 *
 * Rules this function never breaks, whatever the input:
 *
 *  1. **Nobody is placed in a shift they did not declare want / can / ifNeeded
 *     for** (§1.1). The declaration is the consent. A seat nobody declared for
 *     is a hole — recruitment fills it, never this function.
 *  2. **Nobody gets more "number one" places than their agreed shiftsMax** —
 *     a term of their assignment (§3.8). Going beyond it is something a person
 *     chooses for themselves on the hole card, not something done to them.
 *  3. **Deterministic.** The same input and seed give the same roster, so a
 *     stored draft can be replayed and checked (§1.6).
 *  4. **Explained.** Every placement carries the reason that decided it (§1.5).
 *
 * Rank-1 pass: repeatedly take the *scarcest* open seat (fewest people who can
 * still take it within their quota), and give it to the best candidate by, in
 * order: stance (want > can > ifNeeded) → the member's own preference rank →
 * distance below their quota → what they are owed from earlier cycles → who
 * declared first → a stable seeded hash. Filling the scarcest seat first is
 * what stops the only person who can do Friday being spent on a Tuesday.
 * When no one with quota left can take a seat, a second pass allows going over
 * quota — but never over shiftsMax — and marks it `overQuota` for the carry.
 *
 * Backup passes: everyone else who declared for the shift is ranked 2, 3, …
 * in the same order (minus quota, which a backup does not consume; a soft
 * `backupLoad` spreads the backup duty). The depth is derived — as long as
 * the list of people who said they can come (§14 #8) — and only an explicit
 * `maxBackups` shortens it.
 */

import { computeQuotas, type QuotaResult } from './quota.js';
import type { Commitment, Declaration, DraftAssignment, Hole, ReasonCode, ShiftLike, Stance } from './types.js';

export interface DraftInput {
  shifts: ShiftLike[];
  declarations: Declaration[];
  /** The mission's current assignees and their agreed commitment (§3.8). Only they are drafted (§14 #5). */
  commitments: Commitment[];
  /** Carry-over from earlier cycles (balance.ts): positive = took more than their share. */
  carryOver?: Record<string, number>;
  /** Stored on the roster-period so the draft can be replayed. */
  seed: string;
  /** Optional cap on backups per shift. Null/undefined = everyone available. */
  maxBackups?: number | null;
  /** Minimum rest between two shifts of the same person. */
  minRestHours?: number | null;
}

export interface DraftResult {
  assignments: DraftAssignment[];
  holes: Hole[];
  quota: QuotaResult;
  /** Rank-1 places each member ended up with. */
  assigned: Record<string, number>;
  /** Members who ended below their agreed minimum — reported, not forced. */
  underMin: string[];
}

const STANCE_WEIGHT: Record<Stance, number> = { want: 3, can: 2, ifNeeded: 1, cannot: 0 };
const MS_PER_HOUR = 3_600_000;

/** cyrb53 — a small, well-spread, dependency-free string hash. Deterministic across runtimes. */
export function stableHash(input: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

interface Span {
  start: number;
  end: number;
}

interface Candidate {
  userId: string;
  stance: Stance;
  prefRank: number;
  declaredAt: number;
}

export function draftRoster(input: DraftInput): DraftResult {
  const carry = input.carryOver ?? {};
  const restMs = Math.max(0, Number(input.minRestHours) || 0) * MS_PER_HOUR;
  const maxBackups = input.maxBackups == null ? Infinity : Math.max(0, Math.floor(input.maxBackups));

  const shifts = input.shifts
    .filter((s) => s.state !== 'cancelled' && Number(s.need) >= 1)
    .map((s) => ({ ...s, id: String(s.id), need: Math.floor(Number(s.need)) }))
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const spanOf = new Map<string, Span>(
    shifts.map((s) => [s.id, { start: new Date(s.start).getTime(), end: new Date(s.end).getTime() }])
  );

  const members = new Map(input.commitments.map((c) => [String(c.userId), c]));
  const roleOk = (userId: string, shift: ShiftLike) =>
    !shift.tafkidimId || (members.get(userId)?.tafkidimIds ?? []).map(String).includes(String(shift.tafkidimId));

  // Who declared for what — members only, `cannot` dropped, the latest statement wins.
  const byShift = new Map<string, Map<string, Candidate>>();
  for (const d of input.declarations) {
    const userId = String(d.userId);
    const shiftId = String(d.shiftId);
    if (!members.has(userId) || !spanOf.has(shiftId)) continue;
    const row = byShift.get(shiftId) ?? new Map<string, Candidate>();
    const declaredAt = new Date(d.declaredAt).getTime();
    const prev = row.get(userId);
    if (prev && prev.declaredAt > declaredAt) continue;
    if (d.stance === 'cannot') {
      row.delete(userId);
    } else {
      row.set(userId, {
        userId,
        stance: d.stance,
        prefRank: d.prefRank == null ? Infinity : Number(d.prefRank),
        declaredAt: Number.isNaN(declaredAt) ? Infinity : declaredAt
      });
    }
    byShift.set(shiftId, row);
  }
  for (const s of shifts) {
    const row = byShift.get(s.id);
    if (row) for (const u of [...row.keys()]) if (!roleOk(u, s)) row.delete(u);
  }
  const candidatesFor = (shiftId: string) => [...(byShift.get(shiftId)?.values() ?? [])];

  const availableCount = new Map<string, number>();
  for (const s of shifts) for (const c of candidatesFor(s.id)) availableCount.set(c.userId, (availableCount.get(c.userId) ?? 0) + 1);

  const slots = shifts.reduce((a, s) => a + s.need, 0);
  const quota = computeQuotas(
    slots,
    input.commitments.map((c) => ({
      userId: String(c.userId),
      min: c.min,
      max: c.max,
      available: availableCount.get(String(c.userId)) ?? 0,
      carry: carry[String(c.userId)] ?? 0
    }))
  );
  const hiOf = (u: string) => quota.bounds[u]?.hi ?? 0;
  const quotaOf = (u: string) => quota.quotas[u] ?? 0;

  const assigned = new Map<string, number>();
  const held = new Map<string, Span[]>(); // rank-1 spans per member
  const onShift = new Map<string, Set<string>>(); // shiftId → rank-1 members
  const assignments: DraftAssignment[] = [];

  const clashes = (userId: string, shiftId: string) => {
    const span = spanOf.get(shiftId)!;
    return (held.get(userId) ?? []).some(
      (h) => span.start < h.end + restMs && h.start < span.end + restMs
    );
  };
  const eligible = (shiftId: string, withinQuota: boolean) =>
    candidatesFor(shiftId).filter((c) => {
      const n = assigned.get(c.userId) ?? 0;
      if (onShift.get(shiftId)?.has(c.userId)) return false;
      if (n >= hiOf(c.userId)) return false; // shiftsMax / availability — never crossed
      if (withinQuota && n >= quotaOf(c.userId)) return false;
      return !clashes(c.userId, shiftId);
    });

  const hash = (userId: string, shiftId: string) => stableHash(`${input.seed}|${userId}|${shiftId}`);
  /** Lexicographic keys, best first. Index = which criterion decides (see REASONS). */
  const keys = (c: Candidate, shiftId: string, withQuota: boolean): number[] => [
    -STANCE_WEIGHT[c.stance],
    c.prefRank,
    withQuota ? -(quotaOf(c.userId) - (assigned.get(c.userId) ?? 0)) : 0,
    carry[c.userId] ?? 0,
    c.declaredAt,
    hash(c.userId, shiftId)
  ];
  const REASONS: ReasonCode[] = ['wanted', 'ownPreference', 'belowQuota', 'owed', 'declaredFirst', 'tieBreak'];
  const compare = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    return 0;
  };
  const pick = (shiftId: string, pool: Candidate[], withQuota: boolean) => {
    const ranked = pool
      .map((c) => ({ c, k: keys(c, shiftId, withQuota) }))
      .sort((a, b) => compare(a.k, b.k));
    const [best, second] = ranked;
    let reason: ReasonCode = 'onlyCandidate';
    if (second) {
      const i = best.k.findIndex((v, j) => v !== second.k[j]);
      reason = REASONS[i] ?? 'tieBreak';
    }
    return { userId: best.c.userId, reason };
  };

  const openSeats = new Map(shifts.map((s) => [s.id, s.need]));
  const place = (shiftId: string, userId: string, reason: ReasonCode) => {
    assignments.push({ shiftId, userId, rank: 1, reason });
    assigned.set(userId, (assigned.get(userId) ?? 0) + 1);
    held.set(userId, [...(held.get(userId) ?? []), spanOf.get(shiftId)!]);
    onShift.set(shiftId, new Set([...(onShift.get(shiftId) ?? []), userId]));
    openSeats.set(shiftId, openSeats.get(shiftId)! - 1);
  };

  for (const withinQuota of [true, false]) {
    for (;;) {
      let best: { shiftId: string; pool: Candidate[] } | null = null;
      for (const s of shifts) {
        if (openSeats.get(s.id)! <= 0) continue;
        const pool = eligible(s.id, withinQuota);
        if (pool.length === 0) continue;
        // Scarcest first; shifts are pre-sorted by start, so ties go to the earlier one.
        if (!best || pool.length < best.pool.length) best = { shiftId: s.id, pool };
      }
      if (!best) break;
      const chosen = pick(best.shiftId, best.pool, withinQuota);
      place(best.shiftId, chosen.userId, withinQuota ? chosen.reason : 'overQuota');
    }
  }

  // Backup chain per shift.
  const backupLoad = new Map<string, number>();
  for (const s of shifts) {
    const pool = candidatesFor(s.id).filter((c) => !onShift.get(s.id)?.has(c.userId) && !clashes(c.userId, s.id));
    const ordered = pool
      .map((c) => ({
        c,
        k: [
          -STANCE_WEIGHT[c.stance],
          c.prefRank,
          backupLoad.get(c.userId) ?? 0,
          carry[c.userId] ?? 0,
          c.declaredAt,
          hash(c.userId, s.id)
        ]
      }))
      .sort((a, b) => compare(a.k, b.k))
      .slice(0, maxBackups);
    ordered.forEach(({ c }, i) => {
      assignments.push({ shiftId: s.id, userId: c.userId, rank: 2 + i, reason: 'backup' });
      backupLoad.set(c.userId, (backupLoad.get(c.userId) ?? 0) + 1);
    });
  }

  const holes: Hole[] = shifts
    .filter((s) => openSeats.get(s.id)! > 0)
    .map((s) => ({ shiftId: s.id, missing: openSeats.get(s.id)! }));

  const assignedOut = Object.fromEntries(input.commitments.map((c) => [String(c.userId), assigned.get(String(c.userId)) ?? 0]));
  const underMin = input.commitments
    .map((c) => String(c.userId))
    .filter((u) => (assigned.get(u) ?? 0) < (quota.bounds[u]?.lo ?? 0))
    .sort();

  return { assignments, holes, quota, assigned: assignedOut, underMin };
}
