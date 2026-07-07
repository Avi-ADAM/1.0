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
import type {
  ProjectState,
  SubjectRound,
  TosplitView,
  SaleView,
  SaleClaimView,
  MissionView,
  HalukaView,
  DecisionView,
  StageVotesView,
  TimerView,
  ForumView,
  MeetingView,
  AwayMark
} from './projection';

// v2 — S2b (HANDOFF T4): the one centralized bump for the category-A
// expansion. Adds sales/saleClaims (present in ProjectState since
// PLAN_sale_holder_consent, deliberately left out of v1 pending this bump)
// and the new entity maps (missions, halukas, decisions, stageVotes, timers,
// forums, meetings, away, settings).
export const STATE_ROOT_VERSION = 2;

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
      .map(([k, v]) => [k, normalizeRound(v)] as JsonValue),
    sales: sortedEntries(state.sales, normalizeSale),
    saleClaims: sortedEntries(state.saleClaims, normalizeSaleClaim),
    missions: sortedEntries(state.missions, normalizeMission),
    halukas: sortedEntries(state.halukas, normalizeHaluka),
    decisions: sortedEntries(state.decisions, normalizeDecision),
    stageVotes: sortedEntries(state.stageVotes, normalizeStageVotes),
    timers: sortedEntries(state.timers, normalizeTimer),
    forums: sortedEntries(state.forums, normalizeForum),
    meetings: sortedEntries(state.meetings, normalizeMeeting),
    away: sortedEntries(state.away, normalizeAway),
    settings: sortedEntries(state.settings, (v) => (v ?? null) as JsonValue)
  } as unknown as JsonValue;
}

function sortedEntries<V>(map: Map<string, V>, norm: (v: V) => JsonValue): JsonValue {
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => [k, norm(v)] as JsonValue) as unknown as JsonValue;
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

// ---- S2b (v2) normalizers. undefined fields are dropped by canonicalize's
// drop rule (same convention as the v1 normalizers above). ----

function normalizeSale(s: SaleView): JsonValue {
  return {
    id: s.id,
    reporterId: s.reporterId,
    holderId: s.holderId,
    status: s.status,
    decisionId: s.decisionId,
    confirmedBy: s.confirmedBy,
    version: s.version
  } as unknown as JsonValue;
}

function normalizeSaleClaim(c: SaleClaimView): JsonValue {
  return {
    decisionId: c.decisionId,
    saleId: c.saleId,
    holderId: c.holderId,
    reporterId: c.reporterId,
    standingOrder: c.standingOrder,
    signers: [...c.signers].sort(),
    closed: c.closed
  } as unknown as JsonValue;
}

function normalizeMission(m: MissionView): JsonValue {
  return {
    id: m.id,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
    name: m.name,
    assignee: m.assignee,
    hours: m.hours,
    perhour: m.perhour,
    stageIds: [...m.stageIds].sort(),
    state: m.state,
    completion: m.completion,
    approval: m.approval
  } as unknown as JsonValue;
}

function normalizeHaluka(h: HalukaView): JsonValue {
  return {
    id: h.id,
    from: h.from,
    to: h.to,
    tosplitId: h.tosplitId,
    amount: h.amount,
    code: h.code,
    status: h.status
  } as unknown as JsonValue;
}

function normalizeDecision(d: DecisionView): JsonValue {
  return {
    id: d.id,
    createdBy: d.createdBy,
    createdAt: d.createdAt,
    kind: d.kind,
    ref: d.ref
  } as unknown as JsonValue;
}

function normalizeStageVotes(s: StageVotesView): JsonValue {
  return {
    subjectType: s.subjectType,
    subjectId: s.subjectId,
    approved: s.approved,
    votes: [...s.votes.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, { what: v.what, ts: v.ts, eventId: v.eventId, order: v.order }])
  } as unknown as JsonValue;
}

function normalizeTimer(t: TimerView): JsonValue {
  return {
    id: t.id,
    totalMs: t.totalMs,
    runningSince: t.runningSince,
    runningBy: t.runningBy
  } as unknown as JsonValue;
}

function normalizeForum(f: ForumView): JsonValue {
  return {
    id: f.id,
    createdBy: f.createdBy,
    createdAt: f.createdAt,
    kind: f.kind,
    // Already kept sorted by (ts, id) by the messagePost reducer.
    messages: f.messages.map((m) => ({
      id: m.id,
      by: m.by,
      ts: m.ts,
      body: m.body,
      bodyRef: m.bodyRef,
      redacted: m.redacted
    }))
  } as unknown as JsonValue;
}

function normalizeMeeting(m: MeetingView): JsonValue {
  return {
    id: m.id,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
    date: m.date,
    name: m.name,
    approvals: [...m.approvals].sort()
  } as unknown as JsonValue;
}

function normalizeAway(a: AwayMark): JsonValue {
  return { since: a.since, until: a.until } as unknown as JsonValue;
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
