import type { ConsentEvent } from './event';
import { dedupeKey } from './event';
import { reducers } from './reducers';

export type TosplitView = {
  id: string;
  createdBy: string;
  createdAt: number;
  predicate: Record<string, unknown> | undefined;
  votes: Map<string, { what: boolean; ts: number; eventId: string }>;
  approved: boolean;
};

/**
 * Per-subject round tracking (PLAN_restime_in_signed_chain §3).
 *   - `current`  = the active round (0 for initial proposal)
 *   - `start`    = ts of the event that opened this round (proposal.create or
 *                  the most recent proposal.counter)
 *   - `closed`   = populated when a consensus.timeout for THIS round was
 *                  successfully ingested. Cleared by a subsequent counter
 *                  (counter reopens the conversation).
 */
export type SubjectRound = {
  current: number;
  start: number;
  closed?: {
    round: number;
    reachedAt: number;
    decision: 'approve' | 'reject';
  };
};

export type ProjectState = {
  projectId: string | null;
  members: Set<string>;
  balances: Map<string, number>;
  tosplits: Map<string, TosplitView>;
  /** Keyed by `${subject.type}:${subject.id}` */
  rounds: Map<string, SubjectRound>;
  asOf: number;
};

export function emptyState(projectId: string | null = null): ProjectState {
  return {
    projectId,
    members: new Set(),
    balances: new Map(),
    tosplits: new Map(),
    rounds: new Map(),
    asOf: 0
  };
}

export function subjectKey(type: string, id: string): string {
  return `${type}:${id}`;
}

// Topological sort: parents before children. Ties broken by ts then id.
export function topoSort(events: ConsentEvent[]): ConsentEvent[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const indeg = new Map<string, number>();
  for (const e of events) indeg.set(e.id, 0);
  for (const e of events) {
    for (const p of e.parents) {
      if (byId.has(p)) indeg.set(e.id, (indeg.get(e.id) ?? 0) + 1);
    }
  }
  const ready: ConsentEvent[] = events.filter((e) => (indeg.get(e.id) ?? 0) === 0);
  const sortReady = (arr: ConsentEvent[]) =>
    arr.sort((a, b) => (a.ts - b.ts) || a.id.localeCompare(b.id));
  sortReady(ready);

  const result: ConsentEvent[] = [];
  const childrenOf = new Map<string, string[]>();
  for (const e of events) {
    for (const p of e.parents) {
      if (!byId.has(p)) continue;
      const arr = childrenOf.get(p) ?? [];
      arr.push(e.id);
      childrenOf.set(p, arr);
    }
  }

  while (ready.length) {
    const next = ready.shift()!;
    result.push(next);
    for (const childId of childrenOf.get(next.id) ?? []) {
      const d = (indeg.get(childId) ?? 1) - 1;
      indeg.set(childId, d);
      if (d === 0) {
        ready.push(byId.get(childId)!);
        sortReady(ready);
      }
    }
  }
  // Cycle or dangling parents: append remaining by ts/id for resilience.
  if (result.length !== events.length) {
    const placed = new Set(result.map((e) => e.id));
    const rest = events.filter((e) => !placed.has(e.id));
    sortReady(rest);
    result.push(...rest);
  }
  return result;
}

export function applyEvent(prev: ProjectState, ev: ConsentEvent): ProjectState {
  const reducer = reducers[ev.action];
  const next = reducer ? reducer(prev, ev) : prev;
  next.asOf = Math.max(prev.asOf, ev.ts);
  return next;
}

export function project(events: ConsentEvent[], projectId: string | null = null): ProjectState {
  const ordered = topoSort(events);
  // dedupe: keep the latest-ts entry per (actor, subject, action, order)
  const byKey = new Map<string, ConsentEvent>();
  for (const e of ordered) {
    const k = dedupeKey(e);
    const cur = byKey.get(k);
    if (!cur || e.ts > cur.ts) byKey.set(k, e);
  }
  const finalEvents = ordered.filter((e) => byKey.get(dedupeKey(e)) === e);

  let state = emptyState(projectId);
  for (const e of finalEvents) state = applyEvent(state, e);
  return state;
}
