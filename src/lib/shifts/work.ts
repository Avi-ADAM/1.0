/**
 * What the shift system asks of one member right now — the heart's shift
 * cards (docs/PLAN_SHIFTS.md §7, §7.1, §9.4). Pure: the server hands in what it
 * read, this decides which cards exist.
 *
 *   declare — a cycle is open for declarations and I have shifts I have not
 *             answered yet. Answering is the consent (§1.1), so the card is
 *             the invitation, not a reminder to comply.
 *   draft   — a published draft I have places in, with the reason for each,
 *             while the objection window is open.
 *   hole    — a coming shift nobody is covering. Two ways out, and both close
 *             the card (§7.1): "I'll take it" or "open the mission to one
 *             more candidate". Whoever is next in the backup chain, and whoever
 *             agreed to more shifts than they got, sees it first.
 *
 * Nothing here is stored. A card disappears because the world changed — the
 * member declared, the window closed, someone took the hole.
 */

import { coverageOf, nextInLine } from './coverage.js';
import { phaseAt, type CycleWindow } from './settings.js';
import type { AssignmentLike, Declaration, ReasonCode, ShiftLike } from './types.js';

export interface WorkPlanInput {
  plan: { id: string; name: string; projectId: string | null; openMissionId: string | null; timeZone: string };
  cycles: CycleWindow[];
  shifts: ShiftLike[];
  declarations: Declaration[];
  assignments: AssignmentLike[];
  /** Stored periods by `periodKey`. */
  periods: Record<string, { id: string; state: 'open' | 'draft' | 'closed' | 'cancelled'; closesAt: string; reopened?: boolean }>;
  /** The mission's agreed commitments, for "you have room for more". */
  commitments: Array<{ userId: string; max?: number | null }>;
}

export interface DeclareItem {
  planId: string;
  timeZone: string;
  planName: string;
  projectId: string | null;
  periodKey: string;
  cycleStart: string;
  cycleEnd: string;
  /** Declarations are still open until the draft is published. */
  draftAt: string;
  undeclared: number;
  total: number;
}

export interface DraftItem {
  planId: string;
  timeZone: string;
  planName: string;
  projectId: string | null;
  periodId: string;
  cycleStart: string;
  cycleEnd: string;
  closesAt: string;
  mine: Array<{ assignmentId: string | null; shiftId: string; start: string; end: string; rank: number; reason: ReasonCode | string | null }>;
  holes: number;
}

export interface HoleItem {
  planId: string;
  timeZone: string;
  planName: string;
  projectId: string | null;
  openMissionId: string | null;
  periodId: string | null;
  shiftId: string;
  start: string;
  end: string;
  missing: number;
  /** I am the next backup in line for this shift. */
  nextInLine: boolean;
  /** Shifts I agreed to beyond what I got this cycle (Infinity = no cap). */
  spare: number;
  /** I already hold a rank-1 place that overlaps it — I cannot take it. */
  clashes: boolean;
  /** Someone already asked to open the mission to another candidate this cycle. */
  reopened: boolean;
}

export interface ShiftWork {
  declare: DeclareItem[];
  drafts: DraftItem[];
  holes: HoleItem[];
}

const COMING = new Set(['draft', 'confirmed', 'done']);

export function buildShiftWork(
  uid: string,
  plans: WorkPlanInput[],
  now: Date | string,
  opts: { shadow?: boolean } = {}
): ShiftWork {
  const t = new Date(now).getTime();
  const work: ShiftWork = { declare: [], drafts: [], holes: [] };

  for (const p of plans) {
    const myDecl = new Set(p.declarations.filter((d) => String(d.userId) === uid).map((d) => String(d.shiftId)));
    const myMax = p.commitments.find((c) => String(c.userId) === uid)?.max;

    for (const cycle of p.cycles) {
      const inCycle = p.shifts.filter(
        (s) => s.state !== 'cancelled' && s.start >= cycle.start && s.start < cycle.end
      );
      if (inCycle.length === 0) continue;
      const phase = phaseAt(cycle, now);
      const period = p.periods[cycle.periodKey];

      if (phase === 'declaring') {
        const future = inCycle.filter((s) => new Date(s.end).getTime() > t);
        const undeclared = future.filter((s) => !myDecl.has(String(s.id))).length;
        if (undeclared > 0) {
          work.declare.push({
            planId: p.plan.id,
            timeZone: p.plan.timeZone,
            planName: p.plan.name,
            projectId: p.plan.projectId,
            periodKey: cycle.periodKey,
            cycleStart: cycle.start,
            cycleEnd: cycle.end,
            draftAt: cycle.draftAt,
            undeclared,
            total: future.length
          });
        }
      }

      // Shadow mode writes no assignments: a "your draft" or "hole" card would
      // speak about a roster that binds nobody.
      if (opts.shadow || !period) continue;
      const ids = new Set(inCycle.map((s) => String(s.id)));
      const rows = p.assignments.filter((a) => ids.has(String(a.shiftId)));

      if (period.state === 'draft') {
        const mine = rows
          .filter((a) => String(a.userId) === uid && a.state !== 'released')
          .map((a) => {
            const s = inCycle.find((x) => String(x.id) === String(a.shiftId))!;
            return { assignmentId: a.id ?? null, shiftId: String(a.shiftId), start: s.start, end: s.end, rank: a.rank, reason: a.reason ?? null };
          })
          .sort((a, b) => a.start.localeCompare(b.start) || a.rank - b.rank);
        if (mine.length) {
          const holes = inCycle.reduce((n, s) => n + coverageOf(s, rows).missing, 0);
          work.drafts.push({
            planId: p.plan.id,
            timeZone: p.plan.timeZone,
            planName: p.plan.name,
            projectId: p.plan.projectId,
            periodId: period.id,
            cycleStart: cycle.start,
            cycleEnd: cycle.end,
            closesAt: period.closesAt,
            mine,
            holes
          });
        }
      }

      if (period.state === 'draft' || period.state === 'closed') {
        const taken = rows.filter((a) => String(a.userId) === uid && a.rank === 1 && COMING.has(a.state));
        const spare = myMax == null ? Infinity : Math.max(0, myMax - taken.length);
        const heldSpans = taken
          .map((a) => inCycle.find((s) => String(s.id) === String(a.shiftId)))
          .filter((s): s is ShiftLike => !!s)
          .map((s) => [new Date(s.start).getTime(), new Date(s.end).getTime()] as const);
        for (const s of inCycle) {
          if (new Date(s.start).getTime() <= t) continue;
          const cov = coverageOf(s, rows);
          if (cov.missing <= 0) continue;
          const [a0, a1] = [new Date(s.start).getTime(), new Date(s.end).getTime()];
          const clashes = heldSpans.some(([b0, b1]) => a0 < b1 && b0 < a1);
          work.holes.push({
            planId: p.plan.id,
            timeZone: p.plan.timeZone,
            planName: p.plan.name,
            projectId: p.plan.projectId,
            openMissionId: p.plan.openMissionId,
            periodId: period.id,
            shiftId: String(s.id),
            start: s.start,
            end: s.end,
            missing: cov.missing,
            nextInLine: String(nextInLine(cov)?.userId ?? '') === uid,
            spare,
            clashes,
            reopened: period.reopened === true
          });
        }
      }
    }
  }

  // The members who can most easily fill a hole see it first (§7.1).
  work.holes.sort(
    (a, b) =>
      Number(b.nextInLine) - Number(a.nextInLine) ||
      Number(a.clashes) - Number(b.clashes) ||
      (b.spare === a.spare ? 0 : b.spare > a.spare ? 1 : -1) ||
      a.start.localeCompare(b.start)
  );
  return work;
}
