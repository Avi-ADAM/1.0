import type { ConsentEvent } from '../event';
import type { ProjectState, SnapshotMark } from '../projection';

/**
 * snapshot.commit — quorum-attested checkpoint (PLAN_rikma_as_state_machine §5.1).
 *
 * predicate shape:
 *   {
 *     upTo: string,       // id of the last event the attested root covers
 *     stateRoot: string   // computeStateRoot of the state after `upTo`
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
  const p = ev.predicate as { upTo?: unknown; stateRoot?: unknown } | undefined;
  if (typeof p?.upTo !== 'string' || typeof p?.stateRoot !== 'string') return state;

  // Idempotency: the same attestation (same coverage, same root) lands once.
  if (state.snapshots.some((s) => s.upTo === p.upTo && s.stateRoot === p.stateRoot)) {
    return state;
  }

  const mark: SnapshotMark = {
    eventId: ev.id,
    upTo: p.upTo,
    stateRoot: p.stateRoot,
    ts: ev.ts,
    by: ev.actor
  };
  return { ...state, snapshots: [...state.snapshots, mark] };
}
