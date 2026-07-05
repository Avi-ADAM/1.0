// Space sync protocol — the pure core of the distributed data layer (S2a of
// PLAN_serverless_p2p_data §3). A Space is the replication unit: the set of
// signed ConsentEvents belonging to one project (or one pair, for nego).
//
// The protocol is git-fetch-shaped and transport-agnostic:
//
//   A→B: SYNC_HEADS { spaceId, heads }   heads = events with no children here
//   B→A: SYNC_DIFF  { spaceId, events }  everything B has outside the
//                                        past-closure of A's heads
//
// Exchanging heads is O(1) when nothing changed, which is what makes
// continuous background sync cheap. The same messages run over the HTTP
// relay today and over WebRTC / local network later — that separation is the
// whole point.
//
// Everything in this file is pure and runs identically in browser, SW, and
// Node (server relay + vitest).

import type { ConsentEvent } from '$lib/consent/event';
import { topoSort } from '$lib/consent/projection';

export type SyncHeadsMsg = { t: 'heads'; spaceId: string; heads: string[] };
export type SyncDiffMsg = { t: 'diff'; spaceId: string; events: ConsentEvent[] };

/** Canonical space id for a project's shared log (taxonomy category א). */
export function spaceIdForProject(projectId: string): string {
  return `project:${projectId}`;
}

/** Space ids travel in URLs and IDB keys — keep them boring. */
export const SPACE_ID_RE = /^[A-Za-z0-9:_-]{1,80}$/;

export function isValidSpaceId(id: unknown): id is string {
  return typeof id === 'string' && SPACE_ID_RE.test(id);
}

/**
 * Heads = events that no other event in the set references as a parent.
 * Sorted so two replicas with identical logs produce byte-identical head
 * lists (the O(1) "are we in sync" comparison relies on that).
 */
export function computeHeads(events: Iterable<ConsentEvent>): string[] {
  const ids = new Set<string>();
  const referenced = new Set<string>();
  for (const e of events) {
    ids.add(e.id);
    for (const p of e.parents) referenced.add(p);
  }
  const heads: string[] = [];
  for (const id of ids) if (!referenced.has(id)) heads.push(id);
  return heads.sort();
}

/** O(n) comparison of two sorted head lists (as produced by computeHeads). */
export function sameHeads(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * All event ids reachable from `heads` by following parent edges, restricted
 * to events we actually hold. Unknown ids (the peer is ahead of us there)
 * are counted as "theirs" but not walked.
 */
export function ancestryClosure(
  byId: Map<string, ConsentEvent>,
  heads: string[]
): Set<string> {
  const seen = new Set<string>();
  const stack = [...heads];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const ev = byId.get(id);
    if (!ev) continue; // peer knows an event we don't — nothing to walk
    for (const p of ev.parents) if (!seen.has(p)) stack.push(p);
  }
  return seen;
}

/**
 * SYNC_DIFF responder: everything I hold that is NOT in the past-closure of
 * the peer's heads. Returned parents-first (topoSort) so the receiver can
 * ingest in a single pass without dangling-parent retries.
 */
export function computeDiff(
  localEvents: Iterable<ConsentEvent>,
  remoteHeads: string[]
): ConsentEvent[] {
  const byId = new Map<string, ConsentEvent>();
  for (const e of localEvents) byId.set(e.id, e);
  const known = ancestryClosure(byId, remoteHeads);
  const missing: ConsentEvent[] = [];
  for (const e of byId.values()) if (!known.has(e.id)) missing.push(e);
  return topoSort(missing);
}

/** True when the peer may hold events we lack (or vice versa). */
export function needsSync(localHeads: string[], remoteHeads: string[]): boolean {
  return !sameHeads(localHeads, remoteHeads);
}
