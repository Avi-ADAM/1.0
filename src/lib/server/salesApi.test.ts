import { describe, it, expect } from 'vitest';
import { validateSalesPayload, buildCreateSaleParams, SALE_SOURCE } from './salesApi';

describe('validateSalesPayload', () => {
  const good = {
    productId: '123',
    holderUserId: '45',
    amount: 250,
    quantity: 2,
    externalId: 'order_8811'
  };

  it('accepts a well-formed payload', () => {
    const r = validateSalesPayload(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.productId).toBe('123');
      expect(r.value.holderUserId).toBe('45');
      expect(r.value.amount).toBe(250);
      expect(r.value.quantity).toBe(2);
      expect(r.value.externalId).toBe('order_8811');
    }
  });

  it('defaults quantity to 1 when omitted', () => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.quantity).toBe(1);
  });

  it('defaults saleDate to a valid ISO string when omitted', () => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount: 10 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isNaN(Date.parse(r.value.saleDate))).toBe(false);
  });

  it('coerces numeric ids to strings', () => {
    const r = validateSalesPayload({ productId: 7, holderUserId: 9, amount: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.productId).toBe('7');
      expect(r.value.holderUserId).toBe('9');
    }
  });

  it('rejects a missing productId', () => {
    const r = validateSalesPayload({ holderUserId: '2', amount: 10 });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a missing holderUserId', () => {
    const r = validateSalesPayload({ productId: '1', amount: 10 });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it.each([0, -5, 'abc', null, undefined])('rejects non-positive/invalid amount %p', (amount) => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a non-positive quantity', () => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount: 10, quantity: 0 });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a non-ISO saleDate', () => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount: 10, saleDate: 'not-a-date' });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it('accepts valid ISO start/finish dates', () => {
    const r = validateSalesPayload({
      productId: '1',
      holderUserId: '2',
      amount: 10,
      startDate: '2026-07-01T00:00:00Z',
      finishDate: '2026-08-01T00:00:00Z'
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.startDate).toBe('2026-07-01T00:00:00Z');
      expect(r.value.finishDate).toBe('2026-08-01T00:00:00Z');
    }
  });

  it('rejects an invalid startDate', () => {
    const r = validateSalesPayload({ productId: '1', holderUserId: '2', amount: 10, startDate: 'xyz' });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a non-object body', () => {
    expect(validateSalesPayload(null)).toMatchObject({ ok: false, status: 400 });
    expect(validateSalesPayload('nope')).toMatchObject({ ok: false, status: 400 });
  });
});

describe('buildCreateSaleParams', () => {
  const payload = {
    productId: '123',
    holderUserId: '45',
    amount: 250,
    quantity: 2,
    saleDate: '2026-07-13T09:30:00Z',
    startDate: null,
    finishDate: null,
    externalId: 'order_8811',
    note: '  shop.example.com  '
  };

  it('maps payload fields onto the createSale action params', () => {
    const params = buildCreateSaleParams({
      payload,
      projectId: '99',
      availableQuantity: 10,
      kindOf: 'total'
    });
    expect(params).toMatchObject({
      productId: '123',
      projectId: '99',
      userId: '45', // holder → users_permissions_user
      total: 250, // amount → in
      quantity: 2,
      saleDate: '2026-07-13T09:30:00Z',
      availableQuantity: 10,
      kindOf: 'total',
      source: SALE_SOURCE,
      externalId: 'order_8811'
    });
  });

  it('never trusts a client projectId — uses the one supplied by the key', () => {
    const params = buildCreateSaleParams({
      payload: { ...payload, ...({ projectId: 'evil' } as any) },
      projectId: '99',
      availableQuantity: -1,
      kindOf: 'total'
    });
    expect(params.projectId).toBe('99');
  });

  it('trims the note', () => {
    const params = buildCreateSaleParams({ payload, projectId: '99', availableQuantity: -1, kindOf: 'total' });
    expect(params.note).toBe('shop.example.com');
  });

  it('omits optional fields when empty', () => {
    const params = buildCreateSaleParams({
      payload: { ...payload, externalId: '', note: '', startDate: null, finishDate: null },
      projectId: '99',
      availableQuantity: -1,
      kindOf: 'total'
    });
    expect(params).not.toHaveProperty('externalId');
    expect(params).not.toHaveProperty('note');
    expect(params).not.toHaveProperty('startDate');
    expect(params).not.toHaveProperty('finishDate');
  });

  it('passes through subscription dates', () => {
    const params = buildCreateSaleParams({
      payload: { ...payload, startDate: '2026-07-01T00:00:00Z', finishDate: '2026-08-01T00:00:00Z' },
      projectId: '99',
      availableQuantity: -1,
      kindOf: 'monthly'
    });
    expect(params.startDate).toBe('2026-07-01T00:00:00Z');
    expect(params.finishDate).toBe('2026-08-01T00:00:00Z');
    expect(params.kindOf).toBe('monthly');
  });
});
