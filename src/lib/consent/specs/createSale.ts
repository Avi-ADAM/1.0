// Shared consent-event mapping for the createSale action
// (PLAN_sale_holder_consent — "מודל האירועים החתומים").
//
// Both the server-side ActionConfig (src/lib/server/actions/configs/createSale.ts)
// and the client-side shadow-sign caller (SaleComponent.svelte) import this spec,
// so the predicate shape stays exactly identical in both worlds.
//
// A sale report is the reporter's signed attestation of the full claim:
//   "I sold <quantity>×<unit-price> of <product>; the money is held by <holder>."
// When holder === reporter it is a sovereign self-report (final immediately).
// When holder ≠ reporter it opens a bilateral saleClaim Decision (round 1) that
// matures by agreement, counter-precision, or restime silence.
//
// The subject is the created Sale, so the event is signed AFTER the server
// returns the sale id (same pattern as votes) — the caller must inject `saleId`
// into the params before signing.

import type { ConsentSpec } from '$lib/server/actions/types';

export const createSaleConsentSpec: ConsentSpec = {
  action: 'sale.record',
  subjectType: 'sale',
  subjectIdParam: 'saleId',
  // Bilateral consent between reporter and holder, not a rikma-wide vote.
  requireConsensus: false,
  restimeFrom: 'project',
  predicateFromParams: (params) => ({
    productId: params.productId != null ? String(params.productId) : undefined,
    projectId: params.projectId != null ? String(params.projectId) : undefined,
    // The claimed holder of the money (the crux of what needs consent).
    holder: params.userId != null ? String(params.userId) : undefined,
    total: params.total,
    quantity: params.quantity,
    saleDate: params.saleDate,
    kindOf: params.kindOf ?? 'total',
    startDate: params.startDate ?? undefined,
    finishDate: params.finishDate ?? undefined,
    note: params.note ?? undefined,
    // Present only for the holder-is-someone-else path.
    decisionId: params.decisionId != null ? String(params.decisionId) : undefined,
    holderStatus: params.holderStatus,
    // Round 1 — the original claim is the reporter's agreement to round 1.
    order: 1
  })
};
