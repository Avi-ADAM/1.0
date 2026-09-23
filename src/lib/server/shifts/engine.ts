/**
 * The roster engine (docs/PLAN_SHIFTS.md §7): what moves a cycle from
 * "members are declaring" to "the roster is final".
 *
 *   tickPlan      — the cron, hourly: materialize the pattern over the horizon,
 *                   open the cycles members may now declare for, publish the
 *                   draft when a cycle reaches draftAt, close it at closesAt.
 *   runDraft      — compute the roster (src/lib/shifts/draft.ts) and write it.
 *   closePeriod   — the draft becomes the roster; the fairness balance moves on.
 *
 * Every step is idempotent, because the cron and the timegrama may both reach
 * the same period, and a crash may cut any step in half: a draft that already
 * wrote its rows does not write them again, a closed period does not close
 * twice, and a shift that was rostered is never cancelled by a sync.
 *
 * `SHIFTS=shadow` runs everything but writes no assignment and moves no
 * balance: the computed roster is kept on the period (`quotaSnapshot.shadow`)
 * so a pilot rikma's first cycles can be checked by eye first (§11).
 */

import { draftRoster } from '$lib/shifts/draft.js';
import { carryOver, placesTaken, type ClosedCycle } from '$lib/shifts/balance.js';
import { holesIn } from '$lib/shifts/coverage.js';
import { materialize } from '$lib/shifts/pattern.js';
import { cycleContaining, cyclesBetween, resolveSettings, type CycleWindow, type ShiftSettings } from '$lib/shifts/settings.js';
import type { ShiftsMode } from './mode.js';
import type { AssignmentLike } from '$lib/shifts/types.js';
import { run, type ShiftExec } from './exec.js';
import { planIsActive, type PeriodView, type ShiftPlanView } from './read.js';
import {
  attachShifts,
  createAssignment,
  ensurePeriod,
  loadCommitments,
  loadPeriod,
  loadPeriods,
  loadPlan,
  loadProjectTiming,
  loadWindow,
  markPeriodReopened,
  recruitOneMore,
  setShift,
  syncShifts,
  updateAssignment,
  updatePeriod,
  updatePlan
} from './store.js';

const DAY = 86_400_000;

export interface EngineContext {
  exec: ShiftExec;
  mode: ShiftsMode;
  now?: Date;
}

export interface PlanContextResolved {
  plan: ShiftPlanView;
  settings: ShiftSettings;
}

export interface TickReport {
  planId: string;
  skipped?: string;
  shifts?: { created: number; reopened: number; cancelled: number };
  opened: string[];
  drafted: Array<{ periodId: string; holes: number; assignments: number }>;
  closed: Array<{ periodId: string; holes: number }>;
  errors: string[];
}

/** What the draft stores on the period — the quotas it used, so the roster can be explained later. */
export interface QuotaSnapshot {
  quotas: Record<string, number>;
  bounds: Record<string, { lo: number; hi: number; carry: number }>;
  level: number | null;
  shortage: number;
  belowMin: string[];
  assigned: Record<string, number>;
  underMin: string[];
  commitments: Array<{ userId: string; min: number | null; max: number | null }>;
  /** SHIFTS=shadow only: the roster that would have been written. */
  shadow?: Array<{ shiftId: string; userId: string; rank: number; reason: string }>;
}

async function resolve(exec: ShiftExec, plan: ShiftPlanView): Promise<PlanContextResolved> {
  const project = plan.projectId ? await loadProjectTiming(exec, plan.projectId) : {};
  return { plan, settings: resolveSettings(plan, project) };
}

/** One plan, one hourly pass. Never throws: failures are reported per step. */
export async function tickPlan(ctx: EngineContext, plan: ShiftPlanView): Promise<TickReport> {
  const now = ctx.now ?? new Date();
  const report: TickReport = { planId: plan.id, opened: [], drafted: [], closed: [], errors: [] };
  if (!planIsActive(plan)) return { ...report, skipped: 'inactive' };
  if (!plan.openMissionId) return { ...report, skipped: 'no mission' };
  if (!plan.pattern) return { ...report, skipped: 'no pattern' };

  const resolved = await resolve(ctx.exec, plan);
  const { settings } = resolved;
  const current = cycleContaining(plan.id, now, settings);
  const horizonEnd = new Date(new Date(current.start).getTime() + settings.horizonDays * DAY);

  // 1. Future shifts only: a plan created mid-week does not grow shifts in the past.
  try {
    const instances = materialize(plan.pattern, {
      planId: plan.id,
      timeZone: settings.timeZone,
      from: now,
      to: horizonEnd
    });
    report.shifts = await syncShifts(ctx.exec, plan, instances, now.toISOString(), horizonEnd.toISOString());
  } catch (e) {
    report.errors.push(`materialize: ${(e as Error).message}`);
  }

  // 2. Every cycle in the horizon that members may already declare for.
  for (const cycle of cyclesBetween(plan.id, current.start, horizonEnd, settings)) {
    if (now < new Date(cycle.declareFrom)) continue;
    try {
      const { period, created } = await ensurePeriod(ctx.exec, plan, cycle);
      if (created) report.opened.push(period.id);
      await advance(ctx, resolved, period, cycle, now, report);
    } catch (e) {
      report.errors.push(`cycle ${cycle.periodKey}: ${(e as Error).message}`);
    }
  }
  return report;
}

async function advance(
  ctx: EngineContext,
  resolved: PlanContextResolved,
  period: PeriodView,
  cycle: CycleWindow,
  now: Date,
  report: TickReport
) {
  if (period.state === 'open') {
    if (now < new Date(cycle.draftAt)) return;
    // A cycle already under way when it was first seen (a plan created
    // mid-week) is not rostered after the fact.
    if (now >= new Date(cycle.start)) {
      await updatePeriod(ctx.exec, period.id, { state: 'cancelled' });
      return;
    }
    const drafted = await runDraft(ctx, resolved, period);
    report.drafted.push({ periodId: period.id, ...drafted });
    period = { ...period, state: 'draft' };
  }
  if (period.state === 'draft' && now >= new Date(cycle.closesAt)) {
    const closed = await closePeriod(ctx, resolved, period);
    if (closed) report.closed.push({ periodId: period.id, holes: closed.holes });
  }
}

/**
 * Compute and write the draft for one period (§6.3, §7 step 2).
 *
 * The seed is the period key — stored, so the same draft can be recomputed
 * and checked later (§1.6). If rows from an earlier, interrupted run exist,
 * they are kept and not written again.
 */
export async function runDraft(
  ctx: EngineContext,
  { plan, settings }: PlanContextResolved,
  period: PeriodView
): Promise<{ holes: number; assignments: number }> {
  const now = ctx.now ?? new Date();
  const win = await loadWindow(ctx.exec, [plan.id], period.start, period.end);
  const shifts = win.shifts.filter((s) => s.state !== 'cancelled');
  await attachShifts(
    ctx.exec,
    period.id,
    shifts.filter((s) => s.periodId !== period.id).map((s) => s.id)
  );

  const commitments = plan.openMissionId ? await loadCommitments(ctx.exec, plan.openMissionId) : [];
  const seed = period.seed ?? period.periodKey ?? `period-${period.id}`;
  const result = draftRoster({
    shifts,
    declarations: win.declarations,
    commitments,
    carryOver: plan.balanceCache ?? {},
    seed,
    maxBackups: settings.maxBackups,
    minRestHours: settings.minRestHours
  });

  const snapshot: QuotaSnapshot = {
    quotas: result.quota.quotas,
    bounds: result.quota.bounds,
    // JSON has no Infinity: a shortage cycle's level is "unbounded".
    level: Number.isFinite(result.quota.level) ? result.quota.level : null,
    shortage: result.quota.shortage,
    belowMin: result.quota.belowMin,
    assigned: result.assigned,
    underMin: result.underMin,
    commitments: commitments.map((c) => ({ userId: c.userId, min: c.min ?? null, max: c.max ?? null }))
  };

  let written = 0;
  if (ctx.mode === 'on') {
    const already = win.assignments.some((a) => a.periodId === period.id && a.source === 'auto');
    if (!already) {
      const mbOf = new Map(commitments.map((c) => [c.userId, c.mesimabetahalichId]));
      for (const a of result.assignments) {
        await createAssignment(ctx.exec, {
          shiftId: a.shiftId,
          userId: a.userId,
          rank: a.rank,
          state: 'draft',
          source: 'auto',
          reason: a.reason,
          periodId: period.id,
          planId: plan.id,
          projectId: plan.projectId,
          mesimabetahalichId: mbOf.get(a.userId) ?? null
        });
        written++;
      }
    }
  } else {
    snapshot.shadow = result.assignments.map((a) => ({ ...a }));
  }

  const holes = result.holes.reduce((n, h) => n + h.missing, 0);
  await updatePeriod(ctx.exec, period.id, {
    state: 'draft',
    draftedAt: now.toISOString(),
    seed,
    holes,
    quotaSnapshot: snapshot
  });

  // The close is a consent clock like any other (PLAN_TIMEGRAMA §6). Shadow
  // mode leaves the production clock table alone; the cron closes it instead.
  if (ctx.mode === 'on' && !period.timegramaId) {
    await run(
      ctx.exec,
      `mutation ($data: TimegramaInput!) { createTimegrama(data: $data) { data { id } } }`,
      'createTimegrama',
      { data: { date: period.closesAt, whatami: 'roster_period', roster_period: period.id } }
    );
  }
  return { holes, assignments: written };
}

/**
 * The draft becomes the roster (§7 step 4). Returns null when the period was
 * already closed — the cron and the timegrama both get here.
 */
export async function closePeriod(
  ctx: EngineContext,
  { plan, settings }: PlanContextResolved,
  period: PeriodView
): Promise<{ holes: number } | null> {
  if (period.state !== 'draft') return null;
  const now = ctx.now ?? new Date();
  const win = await loadWindow(ctx.exec, [plan.id], period.start, period.end);
  const shifts = win.shifts.filter((s) => s.state !== 'cancelled');
  const snapshot = (period.quotaSnapshot ?? {}) as Partial<QuotaSnapshot>;

  const stored = win.assignments.filter(
    (a) => a.periodId === period.id || shifts.some((s) => s.id === a.shiftId)
  );
  let assignments: AssignmentLike[] = stored;
  if (ctx.mode === 'on') {
    for (const a of stored) {
      if (a.state === 'draft') await updateAssignment(ctx.exec, a.id, { state: 'confirmed' });
    }
    for (const s of shifts) if (s.state === 'open') await setShift(ctx.exec, s.id, { state: 'rostered' });
    assignments = assignments.map((a) => (a.state === 'draft' ? { ...a, state: 'confirmed' as const } : a));

    // The fairness balance moves on: C_n = (taken − quota) + decay · C_{n−1}.
    // The same recursion carryOver() computes from the whole history, cached.
    const taken = placesTaken(assignments);
    const quotas = snapshot.quotas ?? {};
    const prev = plan.balanceCache ?? {};
    const next: Record<string, number> = {};
    for (const u of new Set([...Object.keys(prev), ...Object.keys(quotas), ...Object.keys(taken)])) {
      const v = (taken[u] ?? 0) - (quotas[u] ?? 0) + settings.carryDecay * (prev[u] ?? 0);
      next[u] = Math.round(v * 1e6) / 1e6;
    }
    await updatePlan(ctx.exec, plan.id, { balanceCache: next });
  } else {
    assignments = (snapshot.shadow ?? []).map((a) => ({ ...a, state: 'confirmed' as const }));
  }

  const holes = holesIn(shifts, assignments).reduce((n, c) => n + c.missing, 0);
  await updatePeriod(ctx.exec, period.id, { state: 'closed', closedAt: now.toISOString(), holes });

  // Silence is consent (§1.7, §7.1): the hole card offered "open the mission
  // to one more candidate", nobody took the hole, so recruitment starts now.
  // One more person per short cycle — a hole is a missing shift, not a missing
  // person; the next cycle measures again.
  if (ctx.mode === 'on' && holes > 0 && plan.openMissionId && !(snapshot as any).reopenedAt) {
    try {
      await recruitOneMore(ctx.exec, plan.openMissionId);
      await markPeriodReopened(ctx.exec, { ...period, quotaSnapshot: snapshot as any }, now.toISOString());
      await rematch(plan.openMissionId);
    } catch (e) {
      console.error(`[shifts] recruitment after holes failed for plan ${plan.id}:`, e);
    }
  }
  return { holes };
}

/** Tell matching members about the reopened mission. Best-effort. */
async function rematch(openMissionId: string): Promise<void> {
  try {
    const [{ matchOpenMissionToUsers }, { strapiClient }] = await Promise.all([
      import('$lib/server/matching/engine'),
      import('$lib/server/actions/index.js')
    ]);
    await matchOpenMissionToUsers(openMissionId, 'missionCreated', { strapi: strapiClient, fetch });
  } catch (e) {
    console.warn('[shifts] rematch failed:', e);
  }
}

/**
 * Rebuild the balance cache from history — the proof that it is only a cache
 * (§1.4, §6.5). Run it after any manual correction to past assignments.
 */
export async function rebuildBalance(ctx: EngineContext, resolved: PlanContextResolved, depth = 26): Promise<Record<string, number>> {
  const periods = await loadPeriods(ctx.exec, resolved.plan.id, { states: ['closed'], limit: depth });
  const cycles: ClosedCycle[] = [];
  for (const p of periods) {
    const win = await loadWindow(ctx.exec, [resolved.plan.id], p.start, p.end);
    cycles.push({
      closedAt: p.closedAt ?? p.end,
      quotas: ((p.quotaSnapshot ?? {}) as Partial<QuotaSnapshot>).quotas ?? {},
      assignments: win.assignments.filter((a) => a.periodId === p.id)
    });
  }
  const balance = carryOver(cycles, resolved.settings.carryDecay);
  if (ctx.mode === 'on') await updatePlan(ctx.exec, resolved.plan.id, { balanceCache: balance });
  return balance;
}

export { resolve as resolvePlan };

/**
 * The timegrama's way in (whatami `roster_period`): close one period when its
 * clock matures. Returns what happened, for the dispatcher's log.
 */
export async function matureRosterPeriod(
  periodId: string,
  deps: { exec: ShiftExec; mode: ShiftsMode; now?: Date }
): Promise<'off' | 'gone' | 'already' | 'closed'> {
  if (deps.mode === 'off') return 'off';
  const period = await loadPeriod(deps.exec, periodId);
  if (!period || !period.planId) return 'gone';
  if (period.state !== 'draft') return 'already';
  const ctx = await loadPlan(deps.exec, period.planId);
  if (!ctx) return 'gone';
  await closePeriod(deps, { plan: ctx.plan, settings: resolveSettings(ctx.plan, ctx.project) }, period);
  return 'closed';
}
