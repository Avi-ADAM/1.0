/**
 * Shift swaps on the server (docs/PLAN_SHIFTS.md §1.2, §7 step 3): read what a
 * swap is about, and carry it out. The rules are in `$lib/shifts/swap.ts`;
 * the authorization in the actions; this file joins the two to the store.
 *
 * Used by the actions (propose / answer) and by the cron, which completes a
 * swap whose deadline passed in silence — only where silence may complete it.
 */

import { calcDeadlineMs } from '$lib/server/actions/configs/actionUtils.js';
import { checkSwap, silenceMayComplete, swapDeadline, swapOps, swapTurn, type SwapProblem, type SwapTerms, type SwapWorld } from '$lib/shifts/swap.js';
import { cycleContaining, resolveSettings, type ShiftSettings } from '$lib/shifts/settings.js';
import { withStandingRules } from '$lib/shifts/rules.js';
import type { ShiftExec } from './exec.js';
import type { AssignmentView, CommitmentView, PeriodView, ShiftView } from './read.js';
import {
  createAssignment,
  loadAssignmentsByIds,
  loadCommitments,
  loadDueSwaps,
  loadPeriod,
  loadPlan,
  loadWindow,
  updateAssignment,
  updateSwap,
  type PlanContext,
  type SwapView
} from './store.js';

type Place = AssignmentView & { shift: ShiftView | null; planId: string | null; projectId: string | null };

export interface SwapScene {
  plan: PlanContext;
  settings: ShiftSettings;
  give: Place;
  take: Place | null;
  world: SwapWorld;
  commitments: CommitmentView[];
  /** The draft's close, while the give place's cycle is still in its objection window. */
  draftClosesAt: string | null;
}

export class SwapError extends Error {
  constructor(public problem: SwapProblem | 'notFound' | 'noPlan') {
    super(problem);
  }
}

/** Everything needed to judge `terms`: both places, the plan, and the cycles they sit in. */
export async function loadSwapScene(exec: ShiftExec, terms: SwapTerms): Promise<SwapScene> {
  const places = await loadAssignmentsByIds(exec, [terms.giveId, terms.takeId ?? ''].filter(Boolean));
  const give = places.find((p) => p.id === String(terms.giveId));
  if (!give?.shift || !give.planId) throw new SwapError('giveMissing');
  const take = terms.takeId ? (places.find((p) => p.id === String(terms.takeId)) ?? null) : null;
  if (terms.takeId && !take?.shift) throw new SwapError('takeMissing');
  if (take && take.planId !== give.planId) throw new SwapError('takeMissing');

  const plan = await loadPlan(exec, give.planId);
  if (!plan) throw new SwapError('noPlan');
  const settings = resolveSettings(plan.plan, plan.project);
  const cycles = [give, take].filter((p): p is Place => !!p?.shift).map((p) => cycleContaining(plan.plan.id, p.shift!.start, settings));
  const from = cycles.map((c) => c.start).sort()[0];
  const to = cycles.map((c) => c.end).sort().at(-1)!;

  const [win, commitments, period] = await Promise.all([
    loadWindow(exec, [plan.plan.id], from, to),
    plan.plan.openMissionId ? loadCommitments(exec, plan.plan.openMissionId) : Promise.resolve([] as CommitmentView[]),
    give.periodId ? loadPeriod(exec, give.periodId) : Promise.resolve(null as PeriodView | null)
  ]);

  return {
    plan,
    settings,
    give,
    take,
    commitments,
    draftClosesAt: period?.state === 'draft' ? period.closesAt : null,
    world: {
      shifts: win.shifts,
      assignments: win.assignments,
      declarations: withStandingRules(win.declarations, win.shifts, commitments, settings.timeZone),
      commitments: commitments.map((c) => ({ userId: c.userId, max: c.max ?? null })),
      cycle: null
    }
  };
}

/** The world as seen by `answerer`: their maximum is counted in the cycle of what they would receive. */
export function worldFor(scene: SwapScene, terms: SwapTerms, toUserId: string, answerer: string): SwapWorld {
  const incoming = String(answerer) === String(toUserId) ? scene.give : scene.take;
  const cycle = incoming?.shift ? cycleContaining(scene.plan.plan.id, incoming.shift.start, scene.settings) : null;
  return { ...scene.world, cycle: cycle ? { start: cycle.start, end: cycle.end } : null };
}

export function silenceFor(scene: SwapScene, terms: SwapTerms, parties: { fromUserId: string; toUserId: string }, answerer: string): boolean {
  return silenceMayComplete(terms, parties, answerer, worldFor(scene, terms, parties.toUserId, answerer));
}

/** A counter resets the clock (CLAUDE.md, "silence is consent, at the rikma's pace"). */
export function deadlineFor(scene: SwapScene, now: Date): string {
  const restimeHours = calcDeadlineMs(scene.plan.project.restime ?? 'feh') / 3_600_000;
  return swapDeadline(now, restimeHours, [scene.draftClosesAt, scene.give.shift?.start, scene.take?.shift?.start]);
}

export function assertSwap(scene: SwapScene, terms: SwapTerms, parties: { fromUserId: string; toUserId: string }, now: Date): void {
  const check = checkSwap(terms, parties, scene.world, now);
  if (check.ok === false) throw new SwapError(check.problem);
}

/**
 * Carry out agreed terms. Checked once more first — the roster may have moved
 * since the last signature — and if they no longer stand, the swap lapses and
 * nothing is written to the roster.
 */
export async function applySwap(
  exec: ShiftExec,
  swap: SwapView,
  now: Date
): Promise<{ applied: true } | { applied: false; problem: string }> {
  const terms = { giveId: swap.giveId ?? '', takeId: swap.takeId };
  const parties = { fromUserId: swap.fromUserId, toUserId: swap.toUserId };
  let scene: SwapScene;
  try {
    scene = await loadSwapScene(exec, terms);
    assertSwap(scene, terms, parties, now);
  } catch (e) {
    await updateSwap(exec, swap, { status: 'lapsed' });
    return { applied: false, problem: e instanceof SwapError ? e.problem : (e as Error).message };
  }

  const ops = swapOps(terms, parties, scene.world);
  const at = now.toISOString();
  for (const id of ops.release) {
    await updateAssignment(exec, id, { state: 'released', releasedAt: at, releaseReason: 'swap' });
  }
  const byId = new Map([scene.give, scene.take].filter((p): p is Place => !!p).map((p) => [p.id, p]));
  for (const c of ops.create) {
    const replaced = byId.get(c.coveredForId);
    await createAssignment(exec, {
      shiftId: c.shiftId,
      userId: c.userId,
      rank: 1,
      state: c.state,
      source: 'swap',
      reason: 'swapped',
      periodId: replaced?.periodId ?? null,
      planId: scene.plan.plan.id,
      projectId: scene.plan.project.id,
      mesimabetahalichId: scene.commitments.find((m) => m.userId === c.userId)?.mesimabetahalichId ?? null,
      coveredForId: c.coveredForId
    });
  }
  await updateSwap(exec, swap, { status: 'done' });
  return { applied: true };
}

/**
 * The cron's part (§1.3): a swap whose deadline passed completes by silence
 * only where silence may complete it — checked again against today's roster,
 * since a declaration or a maximum may have changed since the offer. Every
 * other open swap at its deadline lapses, and the roster stays as it was.
 */
export async function matureDueSwaps(exec: ShiftExec, planId: string, now: Date): Promise<{ done: string[]; lapsed: string[] }> {
  const out = { done: [] as string[], lapsed: [] as string[] };
  for (const swap of await loadDueSwaps(exec, planId, now.toISOString())) {
    const parties = { fromUserId: swap.fromUserId, toUserId: swap.toUserId };
    const terms = { giveId: swap.giveId ?? '', takeId: swap.takeId };
    const turn = swapTurn(parties, swap.signatures);
    let signatures = swap.signatures;
    if (!turn.agreed) {
      let silent = false;
      if (swap.silence && turn.waitingOn) {
        try {
          silent = silenceFor(await loadSwapScene(exec, terms), terms, parties, turn.waitingOn);
        } catch {
          silent = false;
        }
      }
      if (!silent) {
        await updateSwap(exec, swap, { status: 'lapsed' });
        out.lapsed.push(swap.id);
        continue;
      }
      signatures = [...swap.signatures, { userId: turn.waitingOn!, order: turn.round, at: now.toISOString() }];
      await updateSwap(exec, swap, { signatures });
    }
    const r = await applySwap(exec, { ...swap, signatures }, now);
    (r.applied ? out.done : out.lapsed).push(swap.id);
  }
  return out;
}
