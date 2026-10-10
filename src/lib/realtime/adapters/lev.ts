/**
 * Heart page adapter: a change re-reads the lev slices it touches, scoped to
 * its rikma (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.4). Rides the
 * slice loader that `refetchScope` already uses, so the cards update in
 * place. A slice with no qid yet — or a resync after the socket was down —
 * falls back to one full load.
 */

import { LEV_SLICES } from '$lib/utils/levSliceRegistry';
import { loadLevSlice } from '$lib/utils/levSliceLoader';
import { initializeLevData } from '$lib/utils/levDataLoader';
import { projectIdsOf } from '../scopes';
import { LEV_PATTERNS, levSlicesForScopes } from '../routing';
import type { RealtimeBatch, RealtimeBus } from '../bus';

export interface LevRealtimeDeps {
  loadSlice: (key: string, userId: string, pids: string[] | null, lang: string) => Promise<void>;
  fullLoad: (userId: string, lang: string) => Promise<void>;
  slices: Record<string, { qid: string | null; source: 'project' | 'user' }>;
}

const defaultDeps: LevRealtimeDeps = {
  loadSlice: loadLevSlice,
  fullLoad: (userId, lang) => initializeLevData(userId, '', lang),
  slices: LEV_SLICES
};

/** What one batch costs on the heart page: slices to re-read, or one full load. */
export async function applyLevBatch(
  batch: RealtimeBatch,
  userId: string,
  lang: string,
  deps: LevRealtimeDeps = defaultDeps
): Promise<void> {
  if (batch.resync) return deps.fullLoad(userId, lang);

  // Slice → the rikmas it was touched in (null = not tied to one).
  const wanted = new Map<string, Set<string> | null>();
  for (const change of batch.changes) {
    const pids = projectIdsOf(change.scopes);
    for (const key of levSlicesForScopes(change.scopes)) {
      if (!wanted.has(key)) wanted.set(key, new Set());
      const set = wanted.get(key);
      if (set === null || pids.length === 0) wanted.set(key, null);
      else for (const p of pids) set!.add(p);
    }
  }
  if (wanted.size === 0) return;

  let full = false;
  const jobs: Promise<void>[] = [];
  for (const [key, pids] of wanted) {
    const def = deps.slices[key];
    if (!def?.qid) {
      full = true;
      continue;
    }
    const scoped = def.source === 'project' && pids ? [...pids] : null;
    jobs.push(
      deps.loadSlice(key, userId, scoped, lang).catch((err) => {
        console.warn(`[realtime:lev] slice ${key} failed — full load`, err);
        full = true;
      })
    );
  }
  await Promise.all(jobs);
  if (full) await deps.fullLoad(userId, lang);
}

/** Subscribe the heart page; returns `off`. */
export function connectLevRealtime(bus: RealtimeBus, userId: string, lang: string): () => void {
  return bus.subscribe(LEV_PATTERNS, (batch) => applyLevBatch(batch, userId, lang));
}
