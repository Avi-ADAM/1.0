import type { PageServerLoad } from './$types';
import { asUser } from '$lib/server/shifts/exec.js';
import { shiftsMode } from '$lib/server/shifts/mode.js';
import {
  loadCommitments,
  loadOpenSwapsFor,
  loadPeriods,
  loadProjectPlans,
  loadProjectTiming,
  loadWindow,
  type SwapView,
  type WindowData
} from '$lib/server/shifts/store.js';
import { planIsActive, type CommitmentView, type PeriodView, type ShiftPlanView } from '$lib/server/shifts/read.js';
import { cycleContaining, cyclesBetween, resolveSettings, type CycleWindow, type ShiftSettings } from '$lib/shifts/settings.js';

/**
 * The rikma's shifts tab (docs/PLAN_SHIFTS.md §9.3).
 *
 * Membership is enforced by the `[projectId]` layout. Everything is read with
 * the member's own JWT, so the Authenticated role — not a service token —
 * decides what this page can see.
 *
 * A failure to read (collections not deployed yet, a missing role permission)
 * renders as a message on the page, never as a 500: the rest of the rikma
 * must keep working while the shift system is being rolled out.
 */

export interface PlanBlock {
  plan: ShiftPlanView;
  settings: ShiftSettings;
  cycles: CycleWindow[];
  commitments: CommitmentView[];
  periods: PeriodView[];
  onMission: boolean;
}

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const mode = shiftsMode();
  const now = new Date();
  const empty = { mode, now: now.toISOString(), plans: [] as PlanBlock[], window: { shifts: [], declarations: [], assignments: [] } as WindowData, swaps: [] as SwapView[], loadError: null as string | null };
  if (mode === 'off') return empty;

  const exec = asUser({ jwt: locals.tok || undefined, fetch });
  const uid = locals.uid ? String(locals.uid) : '';
  try {
    const [allPlans, project] = await Promise.all([
      loadProjectPlans(exec, params.projectId),
      loadProjectTiming(exec, params.projectId)
    ]);
    const plans = allPlans.filter(planIsActive);
    const blocks: PlanBlock[] = [];
    let horizonEnd = now.getTime();
    for (const plan of plans) {
      const settings = resolveSettings(plan, project);
      const current = cycleContaining(plan.id, now, settings);
      const until = new Date(new Date(current.start).getTime() + settings.horizonDays * 86_400_000);
      horizonEnd = Math.max(horizonEnd, until.getTime());
      const [commitments, periods] = await Promise.all([
        plan.openMissionId ? loadCommitments(exec, plan.openMissionId) : Promise.resolve([]),
        loadPeriods(exec, plan.id, { limit: 12 })
      ]);
      blocks.push({
        plan,
        settings,
        cycles: cyclesBetween(plan.id, current.start, until, settings),
        commitments,
        periods,
        onMission: commitments.some((c) => c.userId === uid)
      });
    }
    const from = blocks.length ? blocks.map((b) => b.cycles[0]?.start).filter(Boolean).sort()[0] : now.toISOString();
    const window = await loadWindow(exec, blocks.map((b) => b.plan.id), from, new Date(horizonEnd).toISOString());
    // Swaps bind a roster, so they exist only when SHIFTS=on (never in shadow).
    const swaps = mode === 'on' && uid ? await loadOpenSwapsFor(exec, uid).catch(() => [] as SwapView[]) : [];
    return { ...empty, plans: blocks, window, swaps };
  } catch (e) {
    console.error('[moach/shifts] load failed:', e);
    return { ...empty, loadError: e instanceof Error ? e.message.slice(0, 300) : 'load failed' };
  }
};
