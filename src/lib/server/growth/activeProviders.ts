/**
 * The active-provider signal (docs/inprogress/PLAN_GROWTH_AGENT.md §10.4).
 *
 * A business that created its rikma (the claim callback set `onboarding.rikmaId`)
 * is an active provider when that rikma has at least one live product and at
 * least one effective sale or wish proposal in the last ACTIVE_DAYS. This reads
 * three totals per rikma under the server token and records them with
 * `applyActivityCheck` — which moves `joined` → `activeProvider`, and only
 * flags the reverse.
 *
 * Run by /api/cron/growth-active (daily), and on demand by the operator
 * (`growthCheckActive`). A rikma checked in the last MIN_GAP is skipped unless
 * forced, so a re-run costs nothing.
 */

import { ACTIVE_DAYS, applyActivityCheck, type RikmaActivity } from '$lib/growth/prospect';
import { isClosed } from '$lib/growth/stages';
import type { Prospect } from '$lib/growth/types';
import type { ProspectRepository } from './repo';

type Execute = (qid: string, vars: Record<string, unknown>, jwt?: string, fetchFn?: typeof fetch) => Promise<any>;

const MIN_GAP_MS = 20 * 60 * 60 * 1000;
const MAX_PER_RUN = 200;

export interface ActiveReport {
  checked: number;
  skipped: number;
  becameActive: string[];
  flaggedInactive: string[];
  failed: { id: string; error: string }[];
}

const total = (r: any) => Number(r?.meta?.pagination?.total ?? 0) || 0;

export async function readRikmaActivity(
  strapi: { execute: Execute },
  rikmaId: string,
  now: number,
  fetchFn?: typeof fetch,
  days = ACTIVE_DAYS
): Promise<RikmaActivity> {
  const since = new Date(now - days * 86_400_000).toISOString();
  const res = await strapi.execute('growthRikmaActivity', { pid: String(rikmaId), since }, undefined, fetchFn);
  if (res?.errors?.length) throw new Error(res.errors.map((e: any) => e?.message).join('; '));
  if (!res?.data) throw new Error('unexpected answer');
  return { products: total(res.data.matanots), sales: total(res.data.sales), proposals: total(res.data.ratsonProposals) };
}

/** The businesses whose rikma is worth checking now. */
export function dueForCheck(rows: Prospect[], now: number, force = false): Prospect[] {
  return rows.filter((p) => {
    const o = p.onboarding;
    if (!o?.rikmaId || isClosed(p.stage)) return false;
    if (force || !o.activityCheck) return true;
    return now - Date.parse(o.activityCheck.checkedAt) >= MIN_GAP_MS;
  });
}

export async function checkActiveProviders(
  repo: ProspectRepository,
  strapi: { execute: Execute },
  opts: { fetch?: typeof fetch; now?: number; id?: string; force?: boolean } = {}
): Promise<ActiveReport> {
  const now = opts.now ?? Date.now();
  const all = await repo.list();
  const pool = opts.id ? all.filter((p) => p.id === opts.id) : all;
  const due = dueForCheck(pool, now, opts.force).slice(0, MAX_PER_RUN);
  const report: ActiveReport = { checked: 0, skipped: pool.length - due.length, becameActive: [], flaggedInactive: [], failed: [] };
  for (const p of due) {
    try {
      const activity = await readRikmaActivity(strapi, p.onboarding!.rikmaId!, now, opts.fetch);
      const at = new Date(now).toISOString();
      const next = await repo.update(p.id, (cur) => applyActivityCheck(cur, activity, at));
      report.checked++;
      if (next && p.stage !== 'activeProvider' && next.stage === 'activeProvider') report.becameActive.push(p.id);
      if (next?.activity[0]?.kind === 'inactiveDetected' && next.activity[0].at === at) report.flaggedInactive.push(p.id);
    } catch (e) {
      report.failed.push({ id: p.id, error: e instanceof Error ? e.message.slice(0, 200) : String(e) });
    }
  }
  return report;
}
