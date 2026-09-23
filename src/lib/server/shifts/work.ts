/**
 * Gather what `buildShiftWork` (src/lib/shifts/work.ts) needs for one member:
 * the shift missions they are on, each plan's cycles, shifts, declarations,
 * assignments, periods and commitments. Read with the member's own JWT.
 */

import { buildShiftWork, type ShiftWork, type WorkPlanInput } from '$lib/shifts/work.js';
import { cycleContaining, cyclesBetween, resolveSettings } from '$lib/shifts/settings.js';
import type { ShiftExec } from './exec.js';
import type { ShiftsMode } from './mode.js';
import { planIsActive } from './read.js';
import {
  loadCommitments,
  loadMyShiftMissions,
  loadOpenSwapsFor,
  loadUserNames,
  loadPeriods,
  loadPlansForOpenMissions,
  loadProjectTiming,
  loadWindow
} from './store.js';

const DAY = 86_400_000;
export const EMPTY_WORK: ShiftWork = { declare: [], drafts: [], holes: [], swaps: [], starting: [], toLog: [] };

export async function loadShiftWork(exec: ShiftExec, uid: string, mode: ShiftsMode, now = new Date()): Promise<ShiftWork> {
  if (mode === 'off' || !uid) return EMPTY_WORK;
  const omIds = await loadMyShiftMissions(exec, uid);
  const plans = (await loadPlansForOpenMissions(exec, omIds)).filter(planIsActive);
  // Swaps exist only once a roster binds anyone — never in shadow.
  const swaps = mode === 'on' ? await loadOpenSwapsFor(exec, uid).catch(() => []) : [];
  const names = await loadUserNames(exec, swaps.flatMap((s) => [s.fromUserId, s.toUserId]).filter((id) => id !== uid)).catch(
    () => ({}) as Record<string, string>
  );
  const timing = new Map<string, Awaited<ReturnType<typeof loadProjectTiming>>>();

  const inputs: WorkPlanInput[] = [];
  for (const plan of plans) {
    if (plan.projectId && !timing.has(plan.projectId)) timing.set(plan.projectId, await loadProjectTiming(exec, plan.projectId));
    const settings = resolveSettings(plan, plan.projectId ? timing.get(plan.projectId) : {});
    const current = cycleContaining(plan.id, now, settings);
    const until = new Date(new Date(current.start).getTime() + settings.horizonDays * DAY);
    const [win, periods, commitments] = await Promise.all([
      // One cycle back as well: a shift that ended yesterday may still wait for its hours.
      loadWindow(exec, [plan.id], new Date(new Date(current.start).getTime() - settings.cycleDays * DAY).toISOString(), until.toISOString()),
      loadPeriods(exec, plan.id, { limit: 8 }),
      plan.openMissionId ? loadCommitments(exec, plan.openMissionId) : Promise.resolve([])
    ]);
    inputs.push({
      plan: { id: plan.id, name: plan.name, projectId: plan.projectId, openMissionId: plan.openMissionId, timeZone: settings.timeZone },
      cycles: cyclesBetween(plan.id, current.start, until, settings),
      shifts: win.shifts,
      declarations: win.declarations,
      assignments: win.assignments,
      periods: Object.fromEntries(
        periods
          .filter((p) => p.periodKey)
          .map((p) => [
            p.periodKey as string,
            { id: p.id, state: p.state, closesAt: p.closesAt, reopened: !!(p.quotaSnapshot as any)?.reopenedAt }
          ])
      ),
      commitments: commitments.map((c) => ({ userId: c.userId, max: c.max ?? null })),
      swaps: swaps.filter((s) => s.planId === plan.id),
      names
    });
  }
  return buildShiftWork(uid, inputs, now, { shadow: mode === 'shadow' });
}
