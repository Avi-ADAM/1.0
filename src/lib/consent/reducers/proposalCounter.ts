import type { ConsentEvent } from '../event';
import type { ProjectState, SubjectRound, SaleClaimView } from '../projection';
import { subjectKey } from '../projection';

/**
 * proposal.counter — chain-native counter-proposal (PLAN_restime §3.1).
 *
 * Effect on the projection:
 *   1. Bumps the subject's round to current+1.
 *   2. Resets the round-start ts to ev.ts.
 *   3. Clears any `closed` state — a counter reopens the conversation,
 *      even if a prior consensus.timeout had landed first by ts.
 *
 * This is the deterministic projection rule. Cross-event validation (was
 * this counter signed by someone eligible? did it have the original
 * proposal as a DAG ancestor?) lives in ingest, not here.
 *
 * Race: when a consensus.timeout and a proposal.counter are parallel
 * branches (neither has the other as a DAG ancestor), they're ordered by
 * ts then id in topoSort. Whichever applies LAST wins — and the rule
 * (counter clears closed; timeout only closes if open) implements the
 * "contested = no decision" semantics from PLAN_restime §5.
 */
export function proposalCounter(state: ProjectState, ev: ConsentEvent): ProjectState {
  const key = subjectKey(ev.subject.type, ev.subject.id);
  const prev = state.rounds.get(key);
  const next: SubjectRound = {
    current: (prev?.current ?? 0) + 1,
    start: ev.ts
    // `closed` deliberately omitted — counter reopens the conversation
  };
  const rounds = new Map(state.rounds);
  rounds.set(key, next);

  // PLAN_sale_holder_consent — if this counter targets a tracked bilateral
  // saleClaim, bump its standing round too and reset signers: proposing a
  // precision round IS the proposer's own agreement to it. No-op for every
  // other subject kind (they don't have a saleClaims entry).
  let saleClaims = state.saleClaims;
  const claim = saleClaims.get(ev.subject.id);
  if (claim && !claim.closed) {
    const bumped: SaleClaimView = {
      ...claim,
      standingOrder: claim.standingOrder + 1,
      signers: new Set([ev.actor])
    };
    saleClaims = new Map(saleClaims);
    saleClaims.set(ev.subject.id, bumped);
  }

  return { ...state, rounds, saleClaims };
}
