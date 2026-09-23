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
 *   swap    — a swap another member offered me, or answered, and now waits
 *             on me (§1.2). Approve, counter with a different place, or — if
 *             it is my own offer — withdraw it.
 *   starting — my shift starts soon (or has started) and no timer runs for it:
 *             one tap starts the mission's ordinary timer (§10).
 *   toLog   — my shift ended and no timer ever ran for it: "log N hours?" in
 *             one tap — an ordinary record the rikma approves like any other
 *             hours. A shift is never hours by itself (§10).
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
import { swapTurn } from './swap.js';
import type { AssignmentLike, Declaration, ReasonCode, ShiftLike } from './types.js';

export interface WorkPlanInput {
  plan: { id: string; name: string; projectId: string | null; openMissionId: string | null; timeZone: string };
  cycles: CycleWindow[];
  shifts: ShiftLike[];
  declarations: Declaration[];
  assignments: Array<AssignmentLike & { timerId?: string | null; mesimabetahalichId?: string | null }>;
  /** Stored periods by `periodKey`. */
  periods: Record<string, { id: string; state: 'open' | 'draft' | 'closed' | 'cancelled'; closesAt: string; reopened?: boolean }>;
  /** The mission's agreed commitments, for "you have room for more". */
  commitments: Array<{ userId: string; max?: number | null }>;
  /** Open swaps in this plan that I am a party to. */
  swaps?: SwapRow[];
  /** userId → display name, for the other side of a swap. */
  names?: Record<string, string>;
}

export interface SwapRow {
  id: string;
  giveId: string | null;
  takeId: string | null;
  fromUserId: string;
  toUserId: string;
  deadline: string | null;
  silence: boolean;
  signatures: Array<{ userId: string; order: number }>;
}

export interface SwapPlace {
  assignmentId: string;
  start: string;
  end: string;
}

export interface SwapItem {
  decisionId: string;
  planId: string;
  timeZone: string;
  planName: string;
  projectId: string | null;
  /** The swap waits on my answer. */
  myTurn: boolean;
  /** I opened it. */
  mine: boolean;
  otherUserId: string;
  otherName: string;
  /** The proposer's place, going to the other member. */
  give: SwapPlace;
  /** The place coming back to the proposer, if any. */
  take: SwapPlace | null;
  deadline: string | null;
  /** Silence at the deadline completes it (the one waiting declared they can). */
  silence: boolean;
  round: number;
  /** What a counter may ask for instead: the asked member's other coming places. */
  options: SwapPlace[];
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

/** How early before a shift the "starting" card appears. */
export const START_LEAD_MINUTES = 30;
/** How long after a shift the "log the hours?" card keeps asking. */
export const LOG_LOOKBACK_DAYS = 7;

export interface HoursItem {
  planId: string;
  timeZone: string;
  planName: string;
  projectId: string | null;
  assignmentId: string;
  /** The mission-in-progress the hours belong to (the timer's mission). */
  missionId: string | null;
  shiftId: string;
  start: string;
  end: string;
  /** The shift's length in hours — what "log the hours" proposes. */
  hours: number;
}

export interface ShiftWork {
  declare: DeclareItem[];
  drafts: DraftItem[];
  holes: HoleItem[];
  swaps: SwapItem[];
  starting: HoursItem[];
  toLog: HoursItem[];
}

const COMING = new Set(['draft', 'confirmed', 'done']);

export function buildShiftWork(
  uid: string,
  plans: WorkPlanInput[],
  now: Date | string,
  opts: { shadow?: boolean } = {}
): ShiftWork {
  const t = new Date(now).getTime();
  const work: ShiftWork = { declare: [], drafts: [], holes: [], swaps: [], starting: [], toLog: [] };

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

  if (!opts.shadow) {
    for (const p of plans) {
      work.swaps.push(...swapItems(uid, p, t));
      const h = hoursItems(uid, p, t);
      work.starting.push(...h.starting);
      work.toLog.push(...h.toLog);
    }
  }
  work.starting.sort((a, b) => a.start.localeCompare(b.start));
  work.toLog.sort((a, b) => a.start.localeCompare(b.start));
  work.swaps.sort((a, b) => Number(b.myTurn) - Number(a.myTurn) || (a.deadline ?? '').localeCompare(b.deadline ?? ''));

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

function swapItems(uid: string, p: WorkPlanInput, t: number): SwapItem[] {
  const out: SwapItem[] = [];
  const placeOf = (id: string | null): SwapPlace | null => {
    if (!id) return null;
    const a = p.assignments.find((x) => String(x.id) === String(id));
    const s = a && p.shifts.find((x) => String(x.id) === String(a.shiftId));
    return s ? { assignmentId: String(id), start: s.start, end: s.end } : null;
  };
  for (const sw of p.swaps ?? []) {
    const from = String(sw.fromUserId);
    const to = String(sw.toUserId);
    if (uid !== from && uid !== to) continue;
    const give = placeOf(sw.giveId);
    if (!give) continue;
    const turn = swapTurn({ fromUserId: from, toUserId: to }, sw.signatures);
    if (turn.agreed) continue;
    const other = uid === from ? to : from;
    const giveShift = p.assignments.find((x) => String(x.id) === String(sw.giveId))?.shiftId;
    const options = p.assignments
      .filter((a) => String(a.userId) === to && a.rank === 1 && (a.state === 'draft' || a.state === 'confirmed'))
      .filter((a) => String(a.shiftId) !== String(giveShift))
      .map((a) => placeOf(a.id ?? null))
      .filter((x): x is SwapPlace => !!x && new Date(x.start).getTime() > t)
      .sort((a, b) => a.start.localeCompare(b.start));
    out.push({
      decisionId: sw.id,
      planId: p.plan.id,
      timeZone: p.plan.timeZone,
      planName: p.plan.name,
      projectId: p.plan.projectId,
      myTurn: turn.waitingOn === uid,
      mine: uid === from,
      otherUserId: other,
      otherName: p.names?.[other] ?? '',
      give,
      take: placeOf(sw.takeId),
      deadline: sw.deadline,
      silence: sw.silence,
      round: turn.round,
      options
    });
  }
  return out;
}

function hoursItems(uid: string, p: WorkPlanInput, t: number): { starting: HoursItem[]; toLog: HoursItem[] } {
  const out = { starting: [] as HoursItem[], toLog: [] as HoursItem[] };
  for (const a of p.assignments) {
    if (String(a.userId) !== uid || a.rank !== 1 || a.timerId) continue;
    if (a.state !== 'confirmed' && a.state !== 'draft') continue;
    const s = p.shifts.find((x) => String(x.id) === String(a.shiftId));
    if (!s || s.state === 'cancelled' || !a.id) continue;
    const s0 = new Date(s.start).getTime();
    const s1 = new Date(s.end).getTime();
    const item: HoursItem = {
      planId: p.plan.id,
      timeZone: p.plan.timeZone,
      planName: p.plan.name,
      projectId: p.plan.projectId,
      assignmentId: String(a.id),
      missionId: a.mesimabetahalichId ?? null,
      shiftId: String(s.id),
      start: s.start,
      end: s.end,
      hours: Math.round(((s1 - s0) / 3_600_000) * 100) / 100
    };
    if (t >= s0 - START_LEAD_MINUTES * 60_000 && t < s1) out.starting.push(item);
    // Only a confirmed place was worked: a draft that never closed is not a shift anyone agreed on.
    else if (a.state === 'confirmed' && t >= s1 && t - s1 <= LOG_LOOKBACK_DAYS * 86_400_000) out.toLog.push(item);
  }
  return out;
}
