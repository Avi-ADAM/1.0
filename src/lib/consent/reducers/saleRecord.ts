import type { ConsentEvent } from '../event';
import type { ProjectState, SaleView, SaleClaimView } from '../projection';

/**
 * sale.record — the reporter's signed attestation of a sale claim
 * (PLAN_sale_holder_consent).
 *
 * predicate shape:
 *   { productId, projectId, holder, total, quantity, saleDate, kindOf,
 *     startDate?, finishDate?, note?, decisionId?, holderStatus, order: 1 }
 *
 * Effect on the projection:
 *   - holderStatus 'self'  → SaleView is immediately 'self' (final; no round).
 *   - holderStatus 'open'  → SaleView is 'open', linked to `decisionId`; a
 *     SaleClaimView is opened at round 1 with the reporter's own signature
 *     (the report itself IS the reporter's agreement to round 1, per the
 *     project's silence-is-consent / no-absolute-veto super-principle).
 */
export function saleRecord(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as
    | {
        holder?: unknown;
        total?: unknown;
        quantity?: unknown;
        kindOf?: unknown;
        saleDate?: unknown;
        startDate?: unknown;
        finishDate?: unknown;
        decisionId?: unknown;
        holderStatus?: unknown;
      }
    | undefined;

  const saleId = ev.subject.id;
  const reporterId = ev.actor;
  const holderId = typeof p?.holder === 'string' ? p.holder : reporterId;
  const status = p?.holderStatus === 'open' ? 'open' : 'self';
  const decisionId = typeof p?.decisionId === 'string' ? p.decisionId : undefined;

  const view: SaleView = {
    id: saleId,
    reporterId,
    holderId,
    status,
    decisionId,
    version: {
      total: typeof p?.total === 'number' ? p.total : undefined,
      quantity: typeof p?.quantity === 'number' ? p.quantity : undefined,
      kindOf: typeof p?.kindOf === 'string' ? p.kindOf : undefined,
      saleDate: typeof p?.saleDate === 'string' ? p.saleDate : undefined,
      startDate: typeof p?.startDate === 'string' ? p.startDate : undefined,
      finishDate: typeof p?.finishDate === 'string' ? p.finishDate : undefined
    }
  };

  const sales = new Map(state.sales);
  sales.set(saleId, view);

  let saleClaims = state.saleClaims;
  if (status === 'open' && decisionId) {
    const claim: SaleClaimView = {
      decisionId,
      saleId,
      holderId,
      reporterId,
      standingOrder: 1,
      signers: new Set([reporterId])
    };
    saleClaims = new Map(saleClaims);
    saleClaims.set(decisionId, claim);
  }

  return { ...state, sales, saleClaims };
}
