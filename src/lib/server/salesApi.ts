// src/lib/server/salesApi.ts
//
// Pure, side-effect-free helpers for the External Sales Reporting API
// (PLAN_EXTERNAL_SALES_API). Kept separate from the SvelteKit endpoint so the
// validation + field-mapping logic can be unit-tested without the request
// machinery (mirrors the split used by saleClaimShared).

import { normalizeCode } from '$lib/money/currencies.js';

export const SALES_SCOPE = 'sales:report';
export const SALE_SOURCE = 'api';

export interface SalesPayload {
  productId: string;
  holderUserId: string;
  amount: number;
  quantity: number;
  saleDate: string;
  startDate: string | null;
  finishDate: string | null;
  externalId: string;
  note: string;
  /**
   * ISO-4217 code `amount` is in (PLAN_MULTI_CURRENCY). Optional: absent means
   * the rikma's own currency, which is what every caller sent before it existed.
   */
  currency?: string | null;
}

export type ValidationResult =
  | { ok: true; value: SalesPayload }
  | { ok: false; status: number; message: string };

function isIsoDate(v: unknown): boolean {
  if (typeof v !== 'string' || !v.trim()) return false;
  return !Number.isNaN(Date.parse(v));
}

/**
 * Validate the raw request body and normalise it into a SalesPayload.
 * Never throws — a bad body returns `{ ok: false, status: 400, message }`.
 * `saleDate` defaults to now; `quantity` defaults to 1.
 */
export function validateSalesPayload(body: any): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, message: 'Invalid JSON body' };
  }

  const productId = body.productId != null ? String(body.productId) : '';
  const holderUserId = body.holderUserId != null ? String(body.holderUserId) : '';
  const amount = Number(body.amount);
  const quantity = body.quantity == null ? 1 : Number(body.quantity);
  const externalId = body.externalId != null ? String(body.externalId).trim() : '';
  const note = body.note != null ? String(body.note) : '';
  const currency = body.currency == null || body.currency === '' ? null : normalizeCode(body.currency);
  if (body.currency != null && body.currency !== '' && !currency) {
    return { ok: false, status: 400, message: 'currency must be an ISO-4217 code, e.g. "USD"' };
  }

  if (!productId) return { ok: false, status: 400, message: 'productId is required' };
  if (!holderUserId) return { ok: false, status: 400, message: 'holderUserId is required' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, status: 400, message: 'amount must be a positive number' };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, status: 400, message: 'quantity must be a positive number' };
  }

  const saleDate = body.saleDate != null ? String(body.saleDate) : new Date().toISOString();
  if (body.saleDate != null && !isIsoDate(body.saleDate)) {
    return { ok: false, status: 400, message: 'saleDate must be an ISO date' };
  }

  let startDate: string | null = null;
  let finishDate: string | null = null;
  if (body.startDate != null) {
    if (!isIsoDate(body.startDate)) return { ok: false, status: 400, message: 'startDate must be an ISO date' };
    startDate = String(body.startDate);
  }
  if (body.finishDate != null) {
    if (!isIsoDate(body.finishDate)) return { ok: false, status: 400, message: 'finishDate must be an ISO date' };
    finishDate = String(body.finishDate);
  }

  return {
    ok: true,
    value: { productId, holderUserId, amount, quantity, saleDate, startDate, finishDate, externalId, note, currency }
  };
}

/**
 * Map a validated payload onto the exact params the shared `createSale` action
 * expects. `projectId` is supplied by the caller (derived from the API key,
 * never the client); `availableQuantity` / `kindOf` come from the product row.
 */
export function buildCreateSaleParams(args: {
  payload: SalesPayload;
  projectId: string;
  availableQuantity: number;
  kindOf: string;
}): Record<string, unknown> {
  const { payload, projectId, availableQuantity, kindOf } = args;
  const params: Record<string, unknown> = {
    productId: payload.productId,
    projectId,
    userId: payload.holderUserId,
    total: payload.amount,
    quantity: payload.quantity,
    saleDate: payload.saleDate,
    availableQuantity,
    kindOf,
    source: SALE_SOURCE
  };
  if (payload.startDate) params.startDate = payload.startDate;
  if (payload.finishDate) params.finishDate = payload.finishDate;
  if (payload.externalId) params.externalId = payload.externalId;
  if (payload.note.trim()) params.note = payload.note.trim();
  if (payload.currency) params.entryCurrency = payload.currency;
  return params;
}
