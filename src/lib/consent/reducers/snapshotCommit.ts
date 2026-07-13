import type { ConsentEvent } from '../event';
import type { ProjectState, SnapshotMark } from '../projection';
import { restoreState } from '../stateRestore';

/**
 * snapshot.commit — quorum-attested checkpoint (PLAN_rikma_as_state_machine §5.1).
 *
 * predicate shape:
 *   {
 *     upTo: string,       // id of the last event the attested root covers
 *     stateRoot: string,  // computeStateRoot of the state after `upTo`
 *     // T10 (PLAN_T10_COMPACTION) — compaction snapshots also carry:
 *     heads?: string[],   // the full covered DAG frontier (upTo = heads[0])
 *     state?: <normalizeState output>,  // inline normalized state
 *     stateV?: number     // STATE_ROOT_VERSION the state was normalized under
 *   }
 *
 * Effect on the projection: appends a SnapshotMark. A new client starts from
 * the latest trusted mark and syncs only events after `upTo` instead of
 * replaying the full history.
 *
 * The mark is recorded even before verification — like every reducer, this
 * only applies the transition. Whether the attested root is CORRECT (recompute
 * and compare) and whether the quorum backing it holds is commitment.ts's job
 * at ingest. Snapshots never enter the committed state root (see stateRoot.ts).
 */
export function snapshotCommit(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as
    | { upTo?: unknown; stateRoot?: unknown; heads?: unknown; state?: unknown }
    | undefined;
  if (typeof p?.upTo !== 'string' || typeof p?.stateRoot !== 'string') return state;

  // Idempotency: the same attestation (same coverage, same root) lands once.
  if (state.snapshots.some((s) => s.upTo === p.upTo && s.stateRoot === p.stateRoot)) {
    return state;
  }

  const heads = Array.isArray(p.heads)
    ? (p.heads as unknown[]).filter((x): x is string => typeof x === 'string')
    : undefined;

  const mark: SnapshotMark = {
    eventId: ev.id,
    upTo: p.upTo,
    stateRoot: p.stateRoot,
    ts: ev.ts,
    by: ev.actor,
    ...(heads && heads.length > 0 ? { heads } : {})
  };

  // T6 — genesis (PLAN_serverless_p2p_data §11): a PARENTLESS snapshot whose
  // upTo is the 'genesis' sentinel carries state exported from Strapi. The
  // first such event in topo order (ts, then id — deterministic for every
  // arrival order) merges the imported state into the projection; any later
  // genesis only records its attestation mark, never re-applies.
  let next = state;
  if (
    p.upTo === 'genesis' &&
    ev.parents.length === 0 &&
    p.state !== undefined &&
    !state.snapshots.some((s) => s.upTo === 'genesis')
  ) {
    const restored = restoreState(p.state);
    if (restored.ok) next = mergeGenesis(state, restored.state);
    // restore failure (version skew / garbage) degrades to mark-only —
    // the voters' verifyGenesisPredicate rejects such a snapshot anyway.
  }

  return { ...next, snapshots: [...next.snapshots, mark] };
}

/**
 * Merge the imported genesis state under whatever the chain already built:
 *
 *   - members: union (signed joins and imported members are both real);
 *   - balances: genesis REPLACES the balance of every member it carries —
 *     Strapi's hervachti already includes the effect of any action that was
 *     also signed pre-genesis, so summing would double-count. Chain-only
 *     members (no genesis row) keep their replayed balance;
 *   - entity maps: fill only keys the chain doesn't have — a signed event
 *     about an entity is newer truth than the imported row.
 *
 * Pure function of (state, genesis) — invariant 7 (determinism) holds
 * because the topo position of the genesis event is itself deterministic.
 */
function mergeGenesis(state: ProjectState, genesis: ProjectState): ProjectState {
  const members = new Set(state.members);
  for (const m of genesis.members) members.add(m);

  const balances = new Map(state.balances);
  for (const [k, v] of genesis.balances) balances.set(k, v);

  return {
    ...state,
    projectId: state.projectId ?? genesis.projectId,
    members,
    balances,
    tosplits: fillMissing(genesis.tosplits, state.tosplits),
    rounds: fillMissing(genesis.rounds, state.rounds),
    sales: fillMissing(genesis.sales, state.sales),
    saleClaims: fillMissing(genesis.saleClaims, state.saleClaims),
    missions: fillMissing(genesis.missions, state.missions),
    halukas: fillMissing(genesis.halukas, state.halukas),
    decisions: fillMissing(genesis.decisions, state.decisions),
    stageVotes: fillMissing(genesis.stageVotes, state.stageVotes),
    timers: fillMissing(genesis.timers, state.timers),
    forums: fillMissing(genesis.forums, state.forums),
    meetings: fillMissing(genesis.meetings, state.meetings),
    away: fillMissing(genesis.away, state.away),
    settings: fillMissing(genesis.settings, state.settings)
  };
}

function fillMissing<V>(from: Map<string, V>, into: Map<string, V>): Map<string, V> {
  if (from.size === 0) return into;
  const out = new Map(into);
  for (const [k, v] of from) {
    if (!out.has(k)) out.set(k, v);
  }
  return out;
}
