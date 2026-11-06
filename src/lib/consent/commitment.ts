// State-commitment verification (PLAN_rikma_as_state_machine §7).
//
// The verifier's contract, quoting the plan: after signature verification,
// check the event's declared commitments against a local replay —
//   parentStateRoots  — replaying each parent's ancestor closure yields it
//   stateRoot         — replaying closure + this event yields it
//   delta             — deltaCheck against the recomputed transition
//   quorum            — verifyQuorum over the referenced evidence
// "אירוע ש-state-root שלו לא תואם → דחייה, בדיוק כמו חתימה שגויה."
//
// Two modes:
//   'available' — verify everything that CAN be verified locally. Provably
//                 false commitments (root/delta/quorum mismatch) reject; things
//                 we lack data for (missing ancestors, weighted rules without
//                 weights, policy-required-but-absent quorum) become warnings.
//                 This is the migration posture: Phase-0 events and partial
//                 local DAGs keep flowing.
//   'strict'    — everything unverifiable is a rejection. Phase 3 enforcement.

import { dedupeKey, type ConsentEvent } from './event';
import { project, applyEvent, emptyState, type ProjectState } from './projection';
import { compareIds } from './ids';
import { computeStateRoot } from './stateRoot';
import { checkDeltas } from './deltaCheck';
import { verifyQuorum, type QuorumContext } from './quorum';
import { quorumRequirement } from './policy';
import { restoreState } from './stateRestore';
import { GENESIS_UP_TO } from './genesis';

export type EventLookup = (
  id: string
) => ConsentEvent | undefined | Promise<ConsentEvent | undefined>;

export type CommitmentOptions = {
  /** Resolves an event by id — IDB on the client, the mirror store on the server. */
  getEvent: EventLookup;
  mode?: 'available' | 'strict';
  projectId?: string | null;
  /** Per-member weights in agorot for weighted-* quorum rules (D-13). */
  memberWeights?: Map<string, bigint>;
  /**
   * B6 — replayed states, reused across calls. Default: a cache for this call
   * only. Pass `defaultCommitmentCache` to share across calls — ONLY after the
   * event's signature and id were verified: the cache is keyed by ids and is
   * exact because an id is the hash of its content. `null` replays everything
   * from scratch (the reference the cache is tested against).
   */
  cache?: CommitmentCache | null;
};

// ── B6: incremental replay ──────────────────────────────────────────────────
//
// Verifying a commitment replays the event's ancestor closure. Done from
// scratch for every event of a sync, that is O(n²) reducer calls. But the
// state of a closure is a pure function of (projectId, its heads): ids are
// content hashes, so the closure behind a set of heads can never change, and
// a cached state can never go stale.
//
// An event's state is its parents' state plus one applyEvent — the event
// descends from every other event in its closure, so topoSort places it last
// without reordering the rest — EXCEPT when an ancestor shares its dedupe key:
// then dedupe may drop one of the two, and only a full replay is exact. That
// case (and a parent state not in the cache) falls back to `project`.
// Same semantics, same roots; vectors and the property test hold it to that.

export type CommitmentCache = {
  get(key: string): ProjectState | undefined;
  set(key: string, state: ProjectState): void;
  /** Reducer calls spent on incremental steps / full replays (telemetry, tests). */
  stats: { hits: number; incremental: number; full: number };
};

export function createCommitmentCache(limit = 256): CommitmentCache {
  const states = new Map<string, ProjectState>();
  return {
    stats: { hits: 0, incremental: 0, full: 0 },
    get(key) {
      const s = states.get(key);
      if (s !== undefined) {
        // refresh LRU position
        states.delete(key);
        states.set(key, s);
      }
      return s;
    },
    set(key, state) {
      states.delete(key);
      states.set(key, state);
      while (states.size > limit) states.delete(states.keys().next().value as string);
    }
  };
}

export const defaultCommitmentCache: CommitmentCache = createCommitmentCache();

function headsKey(projectId: string | null, heads: string[]): string {
  return `${projectId ?? ''}|${[...new Set(heads)].sort(compareIds).join(',')}`;
}

// Ancestor closure of `heads` inside an already-resolved pool (no lookups).
function closureIn(heads: string[], pool: Map<string, ConsentEvent>): ConsentEvent[] {
  const out: ConsentEvent[] = [];
  const seen = new Set<string>();
  const stack = [...heads];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const ev = pool.get(id);
    if (!ev) continue;
    out.push(ev);
    for (const p of ev.parents) if (!seen.has(p)) stack.push(p);
  }
  return out;
}

/**
 * project(closure(heads)) — through the cache. `pool` must hold the whole
 * closure of `heads` (verifyCommitments resolves it before calling).
 */
function stateAt(
  heads: string[],
  pool: Map<string, ConsentEvent>,
  projectId: string | null,
  cache: CommitmentCache | null
): ProjectState {
  if (!cache) return project(closureIn(heads, pool), projectId);
  const key = headsKey(projectId, heads);
  const hit = cache.get(key);
  if (hit) {
    cache.stats.hits++;
    return hit;
  }

  let state: ProjectState | undefined;
  if (heads.length === 1) {
    const h = pool.get(heads[0]);
    if (h) {
      const base =
        h.parents.length === 0 ? emptyState(projectId) : cache.get(headsKey(projectId, h.parents));
      if (base) {
        const k = dedupeKey(h);
        // Conservative: the pool may hold more than h's ancestors — a key
        // shared with any of them only costs a full replay, never a wrong root.
        let collides = false;
        for (const e of pool.values()) {
          if (e.id !== h.id && dedupeKey(e) === k) {
            collides = true;
            break;
          }
        }
        if (!collides) {
          state = applyEvent(base, h);
          cache.stats.incremental++;
        }
      }
    }
  }
  if (!state) {
    state = project(closureIn(heads, pool), projectId);
    cache.stats.full++;
  }
  cache.set(key, state);
  return state;
}

export type CommitmentResult =
  | { ok: true; checked: string[]; warnings: string[]; reason?: undefined }
  | { ok: false; reason: string };

/** True when the event carries any Phase 1.5 commitment field. */
export function hasCommitments(ev: ConsentEvent): boolean {
  return (
    ev.stateRoot !== undefined ||
    ev.parentStateRoots !== undefined ||
    ev.delta !== undefined ||
    ev.quorum !== undefined ||
    // A snapshot's predicate IS a commitment (the attested root) — it must
    // never slip past verification just because the optional fields are bare.
    ev.action === 'snapshot.commit'
  );
}

// BFS over `parents` links. Returns every reachable ancestor; ids that can't
// be resolved are collected into `missing` instead of throwing.
async function ancestorClosure(
  roots: string[],
  getEvent: EventLookup,
  missing: string[]
): Promise<Map<string, ConsentEvent>> {
  const out = new Map<string, ConsentEvent>();
  const queue = [...roots];
  const seen = new Set<string>(roots);
  while (queue.length) {
    const id = queue.shift()!;
    if (out.has(id)) continue;
    const ev = await getEvent(id);
    if (!ev) {
      missing.push(id);
      continue;
    }
    out.set(id, ev);
    for (const p of ev.parents) {
      if (!seen.has(p)) {
        seen.add(p);
        queue.push(p);
      }
    }
  }
  return out;
}

// A member leaving on their own accord is sovereign — no quorum needed to
// exit a cooperative (policy.ts note on project.leave).
function isSovereignSelfAction(ev: ConsentEvent): boolean {
  if (ev.action !== 'project.leave') return false;
  const target = (ev.predicate as { member?: unknown } | undefined)?.member;
  return target === undefined || target === ev.actor;
}

export async function verifyCommitments(
  ev: ConsentEvent,
  opts: CommitmentOptions
): Promise<CommitmentResult> {
  const mode = opts.mode ?? 'available';
  const checked: string[] = [];
  const warnings: string[] = [];

  const requirement = quorumRequirement(ev.action);
  const quorumRequired = requirement.required && !isSovereignSelfAction(ev);

  if (!hasCommitments(ev)) {
    // Phase-0 event. The only thing to say about it is whether policy WANTED
    // a quorum here.
    if (quorumRequired) {
      if (mode === 'strict') return { ok: false, reason: `quorum_required:${ev.action}` };
      warnings.push(`quorum_required_but_absent:${ev.action}`);
    }
    return { ok: true, checked, warnings };
  }

  // ── replay foundation ────────────────────────────────────────────────────
  const missing: string[] = [];
  const closure = await ancestorClosure(ev.parents, opts.getEvent, missing);

  if (missing.length > 0) {
    if (mode === 'strict') return { ok: false, reason: `missing_ancestor:${missing[0]}` };
    // Can't replay → none of the replay-based checks can run.
    warnings.push(...missing.map((m) => `missing_ancestor:${m}`));
    return { ok: true, checked, warnings };
  }

  const projectId = opts.projectId ?? null;
  const cache = opts.cache === undefined ? createCommitmentCache(16) : opts.cache;
  // closure + the event itself: everything any replay below needs.
  const pool = new Map(closure);
  pool.set(ev.id, ev);

  // ── parentStateRoots: one root per parent, each over that parent's own
  //    ancestor closure (plan §2 — "אם 1 הורה — אחד; אם merge — N") ─────────
  if (ev.parentStateRoots !== undefined) {
    if (ev.parentStateRoots.length !== ev.parents.length) {
      return { ok: false, reason: 'parent_roots_arity' };
    }
    for (let i = 0; i < ev.parents.length; i++) {
      // closure already resolved every ancestor; a parent's sub-closure is in the pool.
      const root = await computeStateRoot(stateAt([ev.parents[i]], pool, projectId, cache));
      if (root !== ev.parentStateRoots[i]) {
        return { ok: false, reason: `parent_root_mismatch:${ev.parents[i]}` };
      }
    }
    checked.push('parentStateRoots');
  }

  const before = stateAt(ev.parents, pool, projectId, cache);
  const after = stateAt([ev.id], pool, projectId, cache);

  // ── stateRoot: the state after applying this event ───────────────────────
  if (ev.stateRoot !== undefined) {
    const root = await computeStateRoot(after);
    if (root !== ev.stateRoot) return { ok: false, reason: 'state_root_mismatch' };
    checked.push('stateRoot');
  }

  // ── delta: declared changes match the recomputed transition ──────────────
  if (ev.delta !== undefined) {
    const d = checkDeltas(before, after, ev.delta);
    if (!d.ok) return { ok: false, reason: `delta:${d.reason}` };
    warnings.push(...d.unchecked.map((u) => `delta_unchecked:${u}`));
    checked.push('delta');
  }

  // ── snapshot.commit: the ATTESTED root must also be true (§5.1) — clients
  //    will trust it as a sync starting point, so recompute it now ──────────
  if (ev.action === 'snapshot.commit') {
    const p = ev.predicate as { upTo?: unknown; stateRoot?: unknown } | undefined;
    if (typeof p?.upTo !== 'string' || typeof p?.stateRoot !== 'string') {
      return { ok: false, reason: 'snapshot_bad_predicate' };
    }
    if (p.upTo === GENESIS_UP_TO) {
      // T6 — a genesis covers no history: it is a DAG root carrying the state
      // imported from Strapi inline. There is nothing to replay, so the root
      // it attests must be the hash of that inline state.
      if (ev.parents.length > 0) return { ok: false, reason: 'genesis_has_parents' };
      const restored = restoreState((ev.predicate as { state?: unknown }).state);
      if (!restored.ok) return { ok: false, reason: `genesis_restore_failed:${restored.reason}` };
      if ((await computeStateRoot(restored.state)) !== p.stateRoot) {
        return { ok: false, reason: 'snapshot_root_mismatch' };
      }
      checked.push('genesisRoot');
    } else {
      if (!closure.has(p.upTo)) {
        // The attested coverage point must be an ancestor of the snapshot event.
        return { ok: false, reason: `snapshot_upTo_not_ancestor:${p.upTo}` };
      }
      const attestedRoot = await computeStateRoot(stateAt([p.upTo], pool, projectId, cache));
      if (attestedRoot !== p.stateRoot) {
        return { ok: false, reason: 'snapshot_root_mismatch' };
      }
      checked.push('snapshotRoot');
    }
  }

  // ── quorum: the witness that the decision passed ─────────────────────────
  if (quorumRequired && ev.quorum === undefined) {
    if (mode === 'strict') return { ok: false, reason: `quorum_required:${ev.action}` };
    warnings.push(`quorum_required_but_absent:${ev.action}`);
  }

  if (ev.quorum !== undefined) {
    const evidence = new Map<string, ConsentEvent>();
    let unresolved: string | null = null;
    for (const id of ev.quorum.evidence) {
      const e = closure.get(id) ?? (await opts.getEvent(id));
      if (!e) {
        unresolved = id;
        break;
      }
      evidence.set(id, e);
    }

    if (unresolved !== null) {
      if (mode === 'strict') return { ok: false, reason: `missing_evidence:${unresolved}` };
      warnings.push(`missing_evidence:${unresolved}`);
    } else {
      const rule = ev.quorum.rule;
      const needsWeights =
        rule.kind === 'weighted-unanimous-positive' || rule.kind === 'weighted-threshold';
      if (needsWeights && !opts.memberWeights) {
        // Weights live outside the chain (D-13: Strapi FinnishedMission +
        // Rikmash totals) — a verifier without them can't judge the rule.
        if (mode === 'strict') return { ok: false, reason: 'missing_weights' };
        warnings.push('quorum_unverified:missing_weights');
      } else {
        const ctx: QuorumContext = {
          eligibleMembers: before.members,
          events: evidence,
          voteAction: requirement.voteAction ?? `${ev.action}.vote`,
          memberWeights: opts.memberWeights
        };
        const q = verifyQuorum(ev.quorum, ctx);
        if (!q.ok) return { ok: false, reason: `quorum:${q.reason}` };
        checked.push('quorum');
      }
    }
  }

  return { ok: true, checked, warnings };
}
