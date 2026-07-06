import type { ConsentEvent } from '../event';
import type { ProjectState, SubjectRound, SaleClaimView, SaleView } from '../projection';
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

  const predicate = ev.predicate as { closingRound?: number; decision?: 'approve' | 'reject' } | undefined;

  let rounds = state.rounds;
  if (prev) {
    const closingRound = typeof predicate?.closingRound === 'number' ? predicate.closingRound : prev.current;

    // Stale: a counter has since opened a later round → no-op for `rounds`.
    if (prev.current === closingRound && !prev.closed) {
      const next: SubjectRound = {
        current: prev.current,
        start: prev.start,
        closed: {
          round: closingRound,
          reachedAt: ev.ts,
          decision: predicate?.decision ?? 'approve'
        }
      };
      rounds = new Map(rounds);
      rounds.set(key, next);
    }
  }

  // PLAN_sale_holder_consent — if this timeout matures a tracked bilateral
  // saleClaim, close it by silence and confirm the standing version onto the
  // Sale. No-op for every other subject kind (no saleClaims entry).
  let saleClaims = state.saleClaims;
  let sales = state.sales;
  const claim = saleClaims.get(ev.subject.id);
  if (claim && !claim.closed) {
    const closingRound =
      typeof predicate?.closingRound === 'number' ? predicate.closingRound : claim.standingOrder;
    if (closingRound === claim.standingOrder) {
      const closedClaim: SaleClaimView = {
        ...claim,
        closed: { decidedAt: ev.ts, by: 'timeout' }
      };
      saleClaims = new Map(saleClaims);
      saleClaims.set(ev.subject.id, closedClaim);

      const sale = sales.get(claim.saleId);
      if (sale) {
        const confirmed: SaleView = { ...sale, status: 'confirmed', confirmedBy: 'timeout' };
        sales = new Map(sales);
        sales.set(claim.saleId, confirmed);
      }
    }
  }

  return { ...state, rounds, saleClaims, sales };
}
