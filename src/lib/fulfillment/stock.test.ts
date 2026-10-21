import { describe, expect, it } from 'vitest';
import {
  consumptionKey,
  isLowStock,
  movesToApply,
  movesToRestore,
  onHandOf,
  planConsumption,
  readStockMoves,
  isStockReceiptMaap,
  receiptName,
  receiptPriceOf,
  receiptValue,
  recipeRowOf,
  stockResourceOf,
  stockStateOf,
  totalsByResource,
  type RecipeRow
} from './stock';
import { planFulfillment } from './plan';

const order = {
  ref: '57:pi_1',
  lines: [
    { id: 'l1', position: 0, productId: 'p1', variantId: null, quantity: 2, name: 'צנצנת דבש', optionLabel: null },
    { id: 'l2', position: 1, productId: 'p2', variantId: 'vL', quantity: 1, name: 'חולצה', optionLabel: 'L' },
    { id: 'l3', position: 2, productId: 'p2', variantId: 'vM', quantity: 3, name: 'חולצה', optionLabel: 'M' }
  ]
};

const recipes: RecipeRow[] = [
  { id: 'r1', productId: 'p1', variantId: null, resourceId: 'jar', quantityPerUnit: 1 },
  { id: 'r2', productId: 'p2', variantId: 'vL', resourceId: 'fabric', quantityPerUnit: 2 },
  { id: 'r3', productId: 'p2', variantId: 'vM', resourceId: 'fabric', quantityPerUnit: 1.5 },
  { id: 'r4', productId: 'p2', variantId: null, resourceId: 'label', quantityPerUnit: 1 }
];

describe('planConsumption', () => {
  it('a row with a variant counts only for that variant; one without counts for every line of the product', () => {
    const out = planConsumption(order, recipes);
    expect(out.map((c) => [c.externalId, c.resourceId, c.quantity])).toEqual([
      ['order:57:pi_1:consume:r1:line:0', 'jar', 2],
      ['order:57:pi_1:consume:r2:line:1', 'fabric', 2],
      ['order:57:pi_1:consume:r4:line:1', 'label', 1],
      ['order:57:pi_1:consume:r3:line:2', 'fabric', 4.5],
      ['order:57:pi_1:consume:r4:line:2', 'label', 3]
    ]);
    expect(totalsByResource(out).get('fabric')).toBe(6.5);
  });

  it('the engine plans it with the acts, and only for a paid order', () => {
    const base = {
      event: 'order.paid' as const,
      steps: [],
      missions: new Map(),
      existingExternalIds: [],
      now: 0,
      recipes
    };
    const paid = { ...order, id: '1', number: '#1', status: 'paid', deliveryPreference: null, paidAt: null, buyerName: null, address: null };
    expect(planFulfillment({ ...base, order: paid }).consumptions).toHaveLength(5);
    expect(planFulfillment({ ...base, order: { ...paid, status: 'pendingPayment' } }).consumptions).toEqual([]);
  });
});

describe('the ledger', () => {
  it('a retry consumes nothing twice', () => {
    const planned = planConsumption(order, recipes);
    const ledger = readStockMoves([{ key: consumptionKey('57:pi_1', 'r1', 0), resourceId: 'jar', quantity: 2, at: 'x' }]);
    expect(movesToApply(planned, ledger).map((p) => p.externalId)).not.toContain('order:57:pi_1:consume:r1:line:0');
    expect(movesToApply(planned, ledger)).toHaveLength(4);
  });

  it('a cancel gives back what was taken and not yet given back', () => {
    const ledger = readStockMoves([
      { key: 'a', resourceId: 'jar', quantity: 2, at: 'x' },
      { key: 'b', resourceId: 'jar', quantity: 1, at: 'x', restoredAt: '2026-10-20' },
      { key: 'c', resourceId: 9, quantity: '1.5', at: 'x' },
      { nonsense: true },
      'junk'
    ]);
    expect(ledger).toHaveLength(3);
    expect(movesToRestore(ledger).map((m) => m.key)).toEqual(['a', 'c']);
    expect(ledger[2]).toMatchObject({ resourceId: '9', quantity: 1.5 });
  });
});

describe('shelf', () => {
  it('onHand, low and state', () => {
    const r = { quantityDelivered: 100, quantityConsumed: 92, lowStockAt: 10 };
    expect(onHandOf(r)).toBe(8);
    expect(isLowStock(r)).toBe(true);
    expect(stockStateOf(r)).toBe('low');
    expect(stockStateOf({ ...r, quantityConsumed: 100 })).toBe('out');
    expect(stockStateOf({ ...r, lowStockAt: null })).toBe('ok');
  });

  it('a receipt keeps quantity and value apart', () => {
    expect(receiptValue(50, 4, 3.5)).toBe(200);
    expect(receiptValue(50, null, 3.5)).toBe(175);
    expect(receiptValue(3, undefined, null)).toBe(0);
  });
});

describe('rows', () => {
  const rel = (id: string | number | null) => ({ data: id == null ? null : { id } });

  it('recipeRowOf reads only essence-only rows linked to a resource', () => {
    const node = { id: 5, attributes: { priceMode: 'none', quantityPerUnit: 2, matanot: rel(1), mashabetahalich: rel(40), product_variant: rel(null) } };
    expect(recipeRowOf(node)).toEqual({ id: '5', productId: '1', variantId: null, resourceId: '40', quantityPerUnit: 2 });
    expect(recipeRowOf({ ...node, attributes: { ...node.attributes, priceMode: 'fixed' } })).toBeNull();
    expect(recipeRowOf({ ...node, attributes: { ...node.attributes, mashabetahalich: rel(null) } })).toBeNull();
    expect(recipeRowOf({ ...node, attributes: { ...node.attributes, quantityPerUnit: 0 } })).toBeNull();
  });

  it('stockResourceOf defaults to owned and reads the giver', () => {
    const r = stockResourceOf({ id: 40, attributes: { name: 'צנצנות', quantityDelivered: 100, quantityConsumed: null, users_permissions_user: rel(7), project: rel(3) } })!;
    expect(r).toMatchObject({ id: '40', accounting: 'owned', quantityConsumed: 0, lowStockAt: null, responsibleId: '7', projectId: '3' });
  });
});

describe('a receipt names its price, so the heart can read it before Maap.unitPrice deploys', () => {
  it('round-trips the price through the name', () => {
    expect(receiptName('צנצנות', 50, 4)).toBe('צנצנות · +50 × 4');
    expect(receiptPriceOf(receiptName('צנצנות', 50, 4))).toBe(4);
    expect(receiptPriceOf(receiptName('בד · כחול', 2.5, 30.125))).toBe(30.125);
  });

  it('an opening count names no price — and reads as 0', () => {
    expect(receiptName('צנצנות', 100, 0)).toBe('צנצנות · +100');
    expect(receiptPriceOf('צנצנות · +100')).toBe(0);
    expect(receiptPriceOf(null)).toBe(0);
    expect(receiptPriceOf('משכירות · מחזור 3')).toBe(0);
  });

  it('tells a supply portion from a recurring month', () => {
    expect(isStockReceiptMaap({ unit: 'unit', cycleStart: null }, true)).toBe(true);
    expect(isStockReceiptMaap({ unit: 'unit', cycleStart: '2026-10-01T00:00:00Z' }, true)).toBe(false);
    expect(isStockReceiptMaap({ unit: null, cycleStart: null }, true)).toBe(false);
    expect(isStockReceiptMaap({ unit: 'unit', cycleStart: null }, false)).toBe(false);
  });
});
