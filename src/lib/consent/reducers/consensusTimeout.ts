import type { ConsentEvent } from '../event';
import type { ProjectState, SubjectRound } from '../projection';
import { subjectKey } from '../projection';

/**
 * consensus.timeout — closes a round on silence (PLAN_restime §3.2).
 *
 * Effect on the projection:
 *   - If the subject's current round matches the closing round AND no prior
 *     `closed` is set, mark the subject as closed with the recorded decision.
 *   - Otherwise no-op (stale timeout; a subsequent counter already opened a
 *     new round; PLAN_restime §5 contested-decision semantics).
 *
 * The timeout's deadline / clock-tolerance / absence-of-counter checks are
 * the verifier's responsibility (src/lib/consent/quorum.ts kind='timeout' +
 * future absence-proof in ingest). This reducer only applies the state
 * transition for an already-verified timeout event.
 *
 * predicate shape (per PLAN_restime §3.2):
 *   {
 *     closingRound: number,
 *     roundStart: number,
 *     roundDuration: number,
 *     expectedEnd: number,
 *     counted: string[],
 *     attestedNow: number,
 *     decision?: 'approve' | 'reject'   // default 'approve' (silence = consent)
 *   }
 */
export function consensusTimeout(state: ProjectState, ev: ConsentEvent): ProjectState {
  const key = subjectKey(ev.subject.type, ev.subject.id);
  const prev = state.rounds.get(key);
  if (!prev) return state;

  const predicate = ev.predicate as { closingRound?: number; decision?: 'approve' | 'reject' } | undefined;
  const closingRound = typeof predicate?.closingRound === 'number' ? predicate.closingRound : prev.current;

  // Stale: a counter has since opened a later round → no-op.
  if (prev.current !== closingRound) return state;

  // Already closed (idempotency / duplicate timeout) → no-op.
  if (prev.closed) return state;

  const next: SubjectRound = {
    current: prev.current,
    start: prev.start,
    closed: {
      round: closingRound,
      reachedAt: ev.ts,
      decision: predicate?.decision ?? 'approve'
    }
  };
  const rounds = new Map(state.rounds);
  rounds.set(key, next);
  return { ...state, rounds };
}
