import { describe, expect, it } from 'vitest';
import {
  PAYMENT_GRACE_MS,
  apiPromotionsOf,
  decorateProduct,
  floorOfShelf,
  pricePaidOrder,
  pricingPromotions,
  resolveCartLines,
  usageAfter,
  type PricingPromotionRow
} from './promoPricing';
import { priceCart } from './promotions';
import type { ShelfProduct } from './promoTerms';

const now = new Date('2026-11-01T12:00:00Z');
const iso = (ms: number) => new Date(now.getTime() + ms).toISOString();
const HOUR = 3600_000;

const shelf: ShelfProduct[] = [
  { id: '1', name: 'כוס', price: 100, pricingMode: 'fixed', origin: null, ownerId: null, archived: false, categoryIds: ['c1'], variants: [], cost: 70 },
  { id: '2', name: 'חולצה', price: 80, pricingMode: 'fixed', origin: null, ownerId: null, archived: false, categoryIds: ['c2'], variants: [{ id: '21', price: 90 }, { id: '22', price: null }] },
  { id: '3', name: 'מארז קבוצתי', price: 200, pricingMode: 'estimated', origin: null, ownerId: null, archived: false, categoryIds: ['c1'], variants: [] },
  { id: '4', name: 'טיוטה', price: 50, pricingMode: 'fixed', origin: null, ownerId: null, archived: false, categoryIds: [], variants: [], published: false }
];

const row = (over: Partial<PricingPromotionRow> = {}): PricingPromotionRow => ({
  id: '9',
  status: 'active',
  endedReason: null,
  kind: 'store',
  name: 'סוף עונה',
  scope: { all: true },
  rule: { pct: 20 },
  startsAt: iso(-HOUR),
  endsAt: iso(24 * HOUR),
  capUnits: null,
  capOrders: null,
  usedUnits: 0,
  usedOrders: 0,
  perOrderMax: null,
  ...over
});

describe('pricingPromotions', () => {
  it('keeps only running promotions, and excludes what a promotion cannot touch', () => {
    const promos = pricingPromotions([row(), row({ id: '10', status: 'paused' }), row({ id: '11', status: 'scheduled' })], shelf, { now });
    expect(promos.map((p) => p.id)).toEqual(['9']);
    expect(promos[0].scope.exclude).toContain('3'); // a pool product
  });

  it('a capped-out promotion no longer prices', () => {
    expect(pricingPromotions([row({ capUnits: 5, usedUnits: 5 })], shelf, { now })).toHaveLength(0);
  });

  it('honours a promotion the buyer paid under, within the grace after its end', () => {
    const ended = row({ status: 'ended', endedReason: 'time', endsAt: iso(-PAYMENT_GRACE_MS / 2) });
    expect(pricingPromotions([ended], shelf, { now })).toHaveLength(0);
    const honoured = pricingPromotions([ended], shelf, { now, honour: new Set(['9']) });
    expect(honoured).toHaveLength(1);
    expect(Date.parse(honoured[0].endsAt as string)).toBeGreaterThan(now.getTime());
    const late = row({ status: 'ended', endedReason: 'time', endsAt: iso(-PAYMENT_GRACE_MS - 1000) });
    expect(pricingPromotions([late], shelf, { now, honour: new Set(['9']) })).toHaveLength(0);
    // An early end is the rikma's decision, not a clock a buyer raced.
    const early = row({ status: 'ended', endedReason: 'early', endsAt: iso(-1000) });
    expect(pricingPromotions([early], shelf, { now, honour: new Set(['9']) })).toHaveLength(0);
  });
});

describe('resolveCartLines', () => {
  it("prices from the shelf, never from the caller", () => {
    const r = resolveCartLines([{ productId: '2', variantId: '22', quantity: 1 }, { productId: '1', variantId: null, quantity: 2 }], shelf);
    expect(r.ok).toBe(true);
    if (r.ok === false) return;
    expect(r.lines.map((l) => l.unitPrice)).toEqual([80, 100]); // variant 22 has no own price
  });

  it('refuses what a till cannot sell, with the orders endpoint’s codes', () => {
    expect(resolveCartLines([{ productId: '99', variantId: null, quantity: 1 }], shelf)).toMatchObject({ ok: false, status: 404, code: 'PRODUCT_NOT_FOUND' });
    expect(resolveCartLines([{ productId: '4', variantId: null, quantity: 1 }], shelf)).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
    expect(resolveCartLines([{ productId: '3', variantId: null, quantity: 1 }], shelf)).toMatchObject({ ok: false, status: 409, code: 'NOT_CHECKOUTABLE' });
    expect(resolveCartLines([{ productId: '2', variantId: null, quantity: 1 }], shelf)).toMatchObject({ ok: false, code: 'VARIANT_REQUIRED' });
    expect(resolveCartLines([{ productId: '2', variantId: '77', quantity: 1 }], shelf)).toMatchObject({ ok: false, code: 'VARIANT_NOT_FOUND', line: 0 });
  });
});

describe('floorOfShelf', () => {
  it('cuts a promotion at the BOM cost unless the rikma voted floor none', () => {
    const lines = resolveCartLines([{ productId: '1', variantId: null, quantity: 1 }], shelf);
    if (lines.ok === false) throw new Error();
    const deep = pricingPromotions([row({ rule: { pct: 50 } })], shelf, { now });
    expect(priceCart(lines.lines, deep, { now, floorOf: floorOfShelf(shelf, null) }).total).toBe(70);
    expect(priceCart(lines.lines, deep, { now, floorOf: floorOfShelf(shelf, { floor: 'none' } as any) }).total).toBe(50);
  });
});

describe('decorateProduct', () => {
  const product = (over: Record<string, any> = {}) => ({
    id: '2',
    price: 80,
    categories: [{ id: 'c2' }],
    priceRange: { min: 80, max: 90, currency: 'ILS' },
    variants: [
      { id: '21', price: 90, active: true },
      { id: '22', price: 80, active: true }
    ],
    ...over
  });

  it('adds salePrice and the promotion beside an unchanged price, and discounts the range', () => {
    const d = decorateProduct(product(), pricingPromotions([row()], shelf, { now }), now);
    expect(d.price).toBe(80);
    expect(d.salePrice).toBe(64);
    expect(d.promotion).toMatchObject({ id: '9', name: 'סוף עונה', kind: 'store' });
    expect(d.variants.map((v) => v.salePrice)).toEqual([72, 64]);
    expect(d.priceRange).toEqual({ min: 64, max: 72, currency: 'ILS' });
  });

  it('without loaded variants the range is discounted from its own ends', () => {
    const d = decorateProduct(product({ variants: [] }), pricingPromotions([row()], shelf, { now }), now);
    expect(d.priceRange).toEqual({ min: 64, max: 72, currency: 'ILS' });
  });

  it('a cart-only promotion (bundle) gives no shelf price', () => {
    const bundle = pricingPromotions([row({ kind: 'bundle', rule: { qty: 3, price: 200 } })], shelf, { now });
    const d = decorateProduct(product(), bundle, now);
    expect(d.salePrice).toBeNull();
    expect(d.promotion).toBeNull();
    expect(d.priceRange).toEqual({ min: 80, max: 90, currency: 'ILS' });
  });
});

describe('apiPromotionsOf', () => {
  it('lists running and coming promotions with what is left of a cap', () => {
    const list = apiPromotionsOf(
      [row({ capUnits: 10, usedUnits: 4 }), row({ id: '10', status: 'scheduled', startsAt: iso(HOUR) }), row({ id: '11', status: 'proposed' }), row({ id: '12', capOrders: 2, usedOrders: 2 })],
      shelf
    );
    expect(list.map((p) => p.id)).toEqual(['9', '10']);
    expect(list[0].remaining).toEqual({ units: 6, orders: null });
    expect(list[0].scope.exclude).toEqual(['3']); // the pool product
  });
});

describe('pricePaidOrder', () => {
  const paid = (lineTotal: number, promotionId: string | null = null) => [
    { position: 0, productId: '1', variantId: null, quantity: 2, lineTotal, promotionId }
  ];

  it('paid at the promotion price: linked, counted, no gap', () => {
    const r = pricePaidOrder({ paid: paid(160), shelf, rows: [row()], policy: null, now })!;
    expect(r).toMatchObject({ listTotal: 200, catalogTotal: 160, paidTotal: 160, gap: 0 });
    expect(r.lines[0]).toEqual({ position: 0, listPrice: 100, discount: 40, promotionId: '9' });
    expect(r.usage.get('9')).toEqual({ units: 2, orders: 1 });
  });

  it('paid the list price while a promotion ran: no link, nothing counted', () => {
    const r = pricePaidOrder({ paid: paid(200), shelf, rows: [row()], policy: null, now })!;
    expect(r.lines[0]).toMatchObject({ discount: 0, promotionId: null });
    expect(r.usage.size).toBe(0);
  });

  it('a promotion that just ended keeps the price only when the storefront names it', () => {
    const ended = row({ status: 'ended', endedReason: 'time', endsAt: iso(-60_000) });
    const unnamed = pricePaidOrder({ paid: paid(160), shelf, rows: [ended], policy: null, now })!;
    expect(unnamed).toMatchObject({ catalogTotal: 200, gap: 40, gapPct: 20 });
    const named = pricePaidOrder({ paid: paid(160, '9'), shelf, rows: [ended], policy: null, now })!;
    expect(named).toMatchObject({ catalogTotal: 160, gap: 0 });
    expect(named.lines[0].promotionId).toBe('9');
  });

  it('below the catalog with no promotion: the gap, and whether it passes the arranged limit', () => {
    const r = pricePaidOrder({ paid: paid(190), shelf, rows: [], policy: { arrangedDiscountPct: 10 } as any, now })!;
    expect(r).toMatchObject({ gap: 10, gapPct: 5, overArranged: false });
    expect(r.lines[0].promotionId).toBeNull();
    expect(pricePaidOrder({ paid: paid(150), shelf, rows: [], policy: { arrangedDiscountPct: 10 } as any, now })!.overArranged).toBe(true);
  });

  it('an order off the shelf is left exactly as it was', () => {
    expect(pricePaidOrder({ paid: [{ position: 0, productId: '3', variantId: null, quantity: 1, lineTotal: 200 }], shelf, rows: [row()], policy: null, now })).toBeNull();
  });
});

describe('usageAfter', () => {
  it('adds the order and says when it reached the cap', () => {
    expect(usageAfter({ capUnits: 10, capOrders: null, usedUnits: 8, usedOrders: 3 }, { units: 3, orders: 1 })).toEqual({ usedUnits: 11, usedOrders: 4, capped: true });
    expect(usageAfter({ capUnits: null, capOrders: null, usedUnits: null, usedOrders: null }, { units: 1, orders: 1 })).toEqual({ usedUnits: 1, usedOrders: 1, capped: false });
  });
});
