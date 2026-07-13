// T10 — compaction: quorum-signed snapshots as pruning points
// (PLAN_T10_COMPACTION). Pure layer: everything here is a function of the
// event set alone (handoff invariant 7 — determinism above all); the IDB /
// replica glue lives in spaceStore.
//
// Lifecycle:
//   1. any member calls buildSnapshotPredicate(events, projectId) and
//      publishes a `snapshot.commit` with parents = the covered heads;
//   2. members verify locally (recompute the root from their own replay)
//      and publish `snapshot.vote` — or stay silent and the restime
//      machinery closes the round (consensus.timeout);
//   3. once isSnapshotMatured(...) AND the safety window passed, a replica
//      may prune computePrunableIds(...) from local storage, keeping the
//      snapshot's inline state as its new base.

import type { ConsentEvent } from '$lib/consent/event';
import { project, subjectKey, type ProjectState } from '$lib/consent/projection';
import { normalizeState, canonicalBytesOfState, STATE_ROOT_VERSION } from '$lib/consent/stateRoot';
import { restoreState } from '$lib/consent/stateRestore';
import { b64urlEncode } from '$lib/crypto/b64';
import { computeHeads, ancestryClosure } from './protocol';

/**
 * Extra dwell time after maturity before a replica actually prunes —
 * a late counter / slow device still finds the full history somewhere.
 */
export const PRUNE_SAFETY_MS = 48 * 60 * 60 * 1000;

export type SnapshotPredicate = {
  upTo: string;
  heads: string[];
  stateRoot: string;
  stateV: number;
  state: unknown; // normalizeState output (JSON-safe)
};

/**
 * Compute the snapshot predicate for the CURRENT frontier of `events`.
 * Deterministic: two members with the same event set produce byte-identical
 * predicates (up to the signing envelope).
 */
export async function buildSnapshotPredicate(
  events: Iterable<ConsentEvent>,
  projectId: string | null
): Promise<SnapshotPredicate> {
  const all = [...events];
  const heads = computeHeads(all); // already sorted deterministically
  if (heads.length === 0) throw new Error('buildSnapshotPredicate: empty space');
  const state = project(all, projectId);
  const stateRoot = await computeRoot(state);
  return {
    upTo: heads[0],
    heads,
    stateRoot,
    stateV: STATE_ROOT_VERSION,
    state: JSON.parse(JSON.stringify(normalizeState(state))) as unknown
  };
}

async function computeRoot(state: ProjectState): Promise<string> {
  const bytes = canonicalBytesOfState(state);
  const buf = await crypto.subtle.digest(
    'SHA-256',
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  );
  return b64urlEncode(buf);
}

export type SnapshotVerifyResult =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: string };

/**
 * A member's local check before voting: does the snapshot's claimed root
 * match what I compute from MY OWN replay of the covered history? And does
 * the inline state actually hash to that root? Both must hold — the first
 * catches a lying snapshot, the second a corrupted payload.
 */
export async function verifySnapshotAgainstLocal(
  predicate: SnapshotPredicate,
  localEvents: Iterable<ConsentEvent>,
  projectId: string | null
): Promise<SnapshotVerifyResult> {
  if (predicate.stateV !== STATE_ROOT_VERSION) {
    return { ok: false, reason: `state_version_mismatch:${predicate.stateV}` };
  }
  const byId = new Map<string, ConsentEvent>();
  for (const e of localEvents) byId.set(e.id, e);
  for (const h of predicate.heads) {
    if (!byId.has(h)) return { ok: false, reason: `missing_head:${h}` };
  }
  // Replay exactly the covered history (closure of the declared heads).
  const covered = ancestryClosure(byId, predicate.heads);
  const coveredEvents = [...byId.values()].filter((e) => covered.has(e.id));
  const myRoot = await computeRoot(project(coveredEvents, projectId));
  if (myRoot !== predicate.stateRoot) {
    return { ok: false, reason: 'root_mismatch_with_local_replay' };
  }
  // The inline state must be the state the root commits to.
  const restored = restoreState(predicate.state);
  if (!restored.ok) return { ok: false, reason: `restore_failed:${restored.reason}` };
  const inlineRoot = await computeRoot(restored.state);
  if (inlineRoot !== predicate.stateRoot) {
    return { ok: false, reason: 'inline_state_does_not_match_root' };
  }
  return { ok: true };
}

/**
 * Has the snapshot matured into a pruning point? Read entirely off the
 * projection, deterministic for any arrival order:
 *   - unanimity: the generic stage tally for subject snapshot:<id> approved;
 *   - or silence: the rounds machinery closed that subject with 'approve'
 *     (a consensus.timeout landed and no counter reopened it).
 */
export function isSnapshotMatured(state: ProjectState, snapshotEventId: string): boolean {
  const key = subjectKey('snapshot', snapshotEventId);
  if (state.stageVotes.get(key)?.approved) return true;
  const round = state.rounds.get(key);
  return round?.closed?.decision === 'approve';
}

/**
 * Which local events may be deleted once the snapshot matured: the ancestry
 * closure of the snapshot's PARENTS (= the covered heads), computed over the
 * local set. The snapshot event itself is kept — it is the new local root
 * and its ancestry is what peers' computeDiff uses to avoid re-sending
 * pruned history.
 */
export function computePrunableIds(
  events: Iterable<ConsentEvent>,
  snapshotEvent: ConsentEvent
): Set<string> {
  const byId = new Map<string, ConsentEvent>();
  for (const e of events) byId.set(e.id, e);
  const covered = ancestryClosure(byId, snapshotEvent.parents);
  covered.delete(snapshotEvent.id); // defensive — a snapshot never covers itself
  // Only ids we actually hold (closure marks unknown parents as seen too).
  const prunable = new Set<string>();
  for (const id of covered) if (byId.has(id)) prunable.add(id);
  return prunable;
}
