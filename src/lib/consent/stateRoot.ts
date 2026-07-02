// State commitments (PLAN_rikma_as_state_machine §3).
//
// Computes a deterministic hash of the ProjectState — the hash that an event
// carries in `stateRoot` to commit "the state that results from applying me".
//
// Phase 1.5 implementation: a single SHA-256 over the canonical serialization
// of the entire state. O(n) to compute, O(n) to verify against any specific
// path. Good enough until rikmas grow past ~10k events; at that point we'll
// switch to a Sparse Merkle Tree over the same canonical layout so individual
// proofs become O(log n).
//
// The serialization rule MUST be locked once and never changed silently —
// any change breaks every previously committed stateRoot. Versioned via the
// STATE_ROOT_VERSION constant; a future major shift bumps the version and
// state-machine §8.1 explains how to migrate.

import { canonicalize, type JsonValue } from '$lib/crypto/canonical';
import { b64urlEncode } from '$lib/crypto/b64';
import type { ProjectState, SubjectRound, TosplitView } from './projection';

export const STATE_ROOT_VERSION = 1;

/**
 * Pure: ProjectState → deterministic JSON value (sorted, no Sets/Maps/bigint).
 *
 * Stable rules:
 *   - Set<string>  → sorted string array
 *   - Map<K, V>    → array of [K, normalize(V)] sorted by K
 *   - bigint       → base-10 string (matches Money.serialize)
 *   - undefined    → omitted (matches canonicalize's drop rule)
 *
 * `state.snapshots` is deliberately NOT part of the root: a snapshot is an
 * attestation ABOUT a state root; folding it into the root would make every
 * attestation change the thing it attests (self-reference). Verifiers compare
 * snapshot marks against independently recomputed roots instead.
 *
 * Any structural change to ProjectState requires updating this function AND
 * bumping STATE_ROOT_VERSION.
 */
export function normalizeState(state: ProjectState): JsonValue {
  return {
    v: STATE_ROOT_VERSION,
    projectId: state.projectId,
    asOf: state.asOf,
    members: [...state.members].sort(),
    balances: [...state.balances.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, v.toString()] as JsonValue),
    tosplits: [...state.tosplits.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, normalizeTosplit(v)] as JsonValue),
    rounds: [...state.rounds.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, normalizeRound(v)] as JsonValue)
  } as unknown as JsonValue;
}

function normalizeTosplit(t: TosplitView): JsonValue {
  return {
    id: t.id,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    predicate: (t.predicate ?? null) as JsonValue,
    approved: t.approved,
    votes: [...t.votes.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, { what: v.what, ts: v.ts, eventId: v.eventId }] as JsonValue)
  } as unknown as JsonValue;
}

function normalizeRound(r: SubjectRound): JsonValue {
  const out: Record<string, JsonValue> = {
    current: r.current,
    start: r.start
  };
  if (r.closed) {
    out.closed = {
      round: r.closed.round,
      reachedAt: r.closed.reachedAt,
      decision: r.closed.decision
    } as JsonValue;
  }
  return out as JsonValue;
}

/**
 * Computes the state root: b64url(sha256(canonicalize(normalize(state)))).
 *
 * The root is what an event commits to in `stateRoot`. A verifier replays
 * parents → computes root → checks event.parentStateRoots; applies event →
 * recomputes root → checks event.stateRoot.
 */
export async function computeStateRoot(state: ProjectState): Promise<string> {
  const normalized = normalizeState(state);
  const bytes = new TextEncoder().encode(canonicalize(normalized));
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return b64urlEncode(buf);
}

/**
 * Sync helper for tests / verifier paths that have a pre-computed digest.
 * Returns the canonical bytes that would be hashed — useful for property tests
 * that compare two distinct paths to the same root without re-doing crypto.
 */
export function canonicalBytesOfState(state: ProjectState): Uint8Array {
  return new TextEncoder().encode(canonicalize(normalizeState(state)));
}
