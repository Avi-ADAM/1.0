/**
 * Rikma tabs adapter: a change about rikma `pid` re-reads the cached sections
 * it touches (docs/inprogress/PLAN_REALTIME_MIGRATION.md §3.4). `missions` /
 * `financials` through `moachStore.refresh` (debounced, and only when the tab
 * holds them), `base` through the layout load's dependency key. A resync
 * re-reads all three.
 */

import { rtKey } from '../scopes';
import { moachSectionsForChange, touchesVotes, type MoachSection } from '../routing';
import type { RealtimeBatch, RealtimeBus } from '../bus';

export interface MoachRealtimeDeps {
  refresh: (pid: string, section: Exclude<MoachSection, 'base'>) => void;
  /** Re-run the layout load (`invalidate(moachBaseKey(pid))`). */
  refreshBase: (pid: string) => void | Promise<void>;
  /** The votes badge. */
  onVotes?: () => void;
}

export function applyMoachBatch(batch: RealtimeBatch, pid: string, deps: MoachRealtimeDeps): void {
  const sections = new Set<MoachSection>();
  let votes = false;
  if (batch.resync) {
    sections.add('base').add('missions').add('financials');
    votes = true;
  }
  for (const change of batch.changes) {
    for (const s of moachSectionsForChange(change, pid)) sections.add(s);
    if (touchesVotes(change, pid)) votes = true;
  }
  for (const s of sections) {
    if (s === 'base') void deps.refreshBase(pid);
    else deps.refresh(pid, s);
  }
  if (votes) deps.onVotes?.();
}

/** Subscribe one rikma's tabs; returns `off`. */
export function connectMoachRealtime(bus: RealtimeBus, pid: string | number, deps: MoachRealtimeDeps): () => void {
  const id = String(pid);
  return bus.subscribe([`project:${id}`], (batch) => applyMoachBatch(batch, id, deps));
}

/** A rikma's own key, for a load that should follow every change in it. */
export const projectRtKey = (pid: string | number): string => rtKey(`project:${pid}`);
