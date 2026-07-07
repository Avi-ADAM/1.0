import type { ConsentEvent } from '../event';
import type { ProjectState, SaleClaimView, SaleView } from '../projection';
import { recordStageVote } from './stageVote';

/**
 * decision.vote — agreement on the standing round of a Decision.
 *
 * This event name is shared by every Decision kind (pic, pubdes, ... and
 * saleClaim). Since S2b (T4):
 *   - a TRACKED saleClaim (entry in `state.saleClaims`, planted by the
 *     sale.record reducer) keeps the bilateral maturation logic below;
 *   - every OTHER kind is tallied generically into `stageVotes` — rikma-wide
 *     unanimity, same rule as tosplit.vote.
 *
 * A saleClaim's consensus rule is bilateral (reporter + holder), unlike the
 * rikma-wide quorum other kinds use: the round matures the instant BOTH
 * parties have signed it, not when "everyone" has.
 *
 * predicate shape: { what: true, order }
 */
export function decisionVote(state: ProjectState, ev: ConsentEvent): ProjectState {
  const decisionId = ev.subject.id;
  const claim = state.saleClaims.get(decisionId);
  if (!claim) return recordStageVote(state, ev); // generic kind — tally only
  if (claim.closed) return state; // already resolved

  const p = ev.predicate as { what?: unknown; order?: unknown } | undefined;
  if (p?.what !== true) return state; // only YES signs a round
  const order = typeof p?.order === 'number' ? p.order : claim.standingOrder;
  if (order !== claim.standingOrder) return state; // stale vote on a superseded round

  const signers = new Set(claim.signers);
  signers.add(ev.actor);

  const bothSigned = signers.has(claim.holderId) && signers.has(claim.reporterId);

  const nextClaim: SaleClaimView = bothSigned
    ? { ...claim, signers, closed: { decidedAt: ev.ts, by: 'vote' } }
    : { ...claim, signers };

  const saleClaims = new Map(state.saleClaims);
  saleClaims.set(decisionId, nextClaim);

  let sales = state.sales;
  if (bothSigned) {
    const sale = state.sales.get(claim.saleId);
    if (sale) {
      const confirmed: SaleView = { ...sale, status: 'confirmed', confirmedBy: 'vote' };
      sales = new Map(sales);
      sales.set(claim.saleId, confirmed);
    }
  }

  return { ...state, saleClaims, sales };
}
