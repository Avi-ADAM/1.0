/**
 * The shift engine's hourly clock (docs/PLAN_SHIFTS.md §7, §8).
 *
 *   GET /api/cron/shifts?key=<CRON_SECRET>            — tick every active plan
 *   GET /api/cron/shifts?key=…&plan=<id>              — tick one plan
 *   GET /api/cron/shifts?key=…&plan=<id>&rebuild=1    — rebuild that plan's
 *                                                       fairness balance from history
 *
 * Schedule it hourly, next to /api/timegrama. It materializes shifts over each
 * plan's horizon, opens the cycles members may declare for, publishes drafts
 * and closes rosters whose objection window has run out. The timegrama closes
 * rosters too; both paths are idempotent.
 *
 * Runs as the service account — there is no user in a cron request. With
 * SHIFTS=off it does nothing at all.
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { asService } from '$lib/server/shifts/exec.js';
import { shiftsMode } from '$lib/server/shifts/mode.js';
import { loadActivePlans, loadPlan } from '$lib/server/shifts/store.js';
import { rebuildBalance, tickPlan, type TickReport } from '$lib/server/shifts/engine.js';
import { resolveSettings } from '$lib/shifts/settings.js';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const secret = env.CRON_SECRET || '';
  // Same guard as the other cron endpoints: enforced whenever a secret is configured.
  if (secret && url.searchParams.get('key') !== secret) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const mode = shiftsMode();
  if (mode === 'off') return json({ mode, skipped: true });

  const exec = asService(fetch);
  const ctx = { exec, mode };
  const only = url.searchParams.get('plan');

  try {
    if (only && url.searchParams.get('rebuild') === '1') {
      const pc = await loadPlan(exec, only);
      if (!pc) return json({ error: 'plan not found' }, { status: 404 });
      const balance = await rebuildBalance(ctx, { plan: pc.plan, settings: resolveSettings(pc.plan, pc.project) });
      return json({ mode, plan: only, balance });
    }

    const plans = only
      ? [await loadPlan(exec, only)].filter(Boolean).map((p) => p!.plan)
      : await loadActivePlans(exec);
    const reports: TickReport[] = [];
    for (const plan of plans) {
      try {
        reports.push(await tickPlan(ctx, plan));
      } catch (e) {
        reports.push({ planId: plan.id, opened: [], drafted: [], closed: [], errors: [(e as Error).message] });
      }
    }
    const errors = reports.reduce((n, r) => n + r.errors.length, 0);
    console.log(`[cron/shifts] ${mode}: ${plans.length} plans, ${errors} errors`);
    return json({ mode, plans: plans.length, errors, reports });
  } catch (e) {
    console.error('[cron/shifts] run failed:', e);
    return json({ mode, error: (e as Error).message }, { status: 500 });
  }
};
