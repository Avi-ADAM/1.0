import { describe, expect, it } from 'vitest';
import { resourceStockViewOf, resourceStockViews, unitsCovered } from './stockView';

const rel = (id: string | number | null, attributes: Record<string, unknown> = {}) => ({ data: id == null ? null : { id, attributes } });

const jars = (extra: Record<string, unknown> = {}) => ({
  id: 40,
  attributes: {
    name: 'צנצנות',
    recurring: false,
    pricePerUnit: 4,
    quantityDelivered: 100,
    quantityConsumed: 93,
    lowStockAt: 10,
    accounting: null,
    users_permissions_user: rel(7, { username: 'דנה' }),
    project: rel(3),
    matanot_recipe_resources: {
      data: [
        {
          id: 5,
          attributes: { quantityPerUnit: 1, matanot: rel(1, { name: 'דבש' }), product_variant: rel(null) }
        },
        {
          id: 6,
          attributes: { quantityPerUnit: 2, matanot: rel(2, { name: 'מארז' }), product_variant: rel(9, { name: 'L', sku: 'BOX-L' }) }
        }
      ]
    },
    maaps: {
      data: [
        // A supply portion waiting for silence.
        { id: 70, attributes: { name: 'צנצנות · +50 × 4', quantityDelivered: 50, unit: 'unit', unitPrice: null, timegrama: rel(1, { date: '2026-10-23T09:00:00Z', done: false }) } },
        // A recurring month is not a receipt.
        { id: 71, attributes: { name: 'שכירות', quantityDelivered: 300, unit: null, cycleStart: '2026-10-01T00:00:00Z' } }
      ]
    },
    ...extra
  }
});

describe('resourceStockViewOf', () => {
  it('reads the shelf, the giver, the links and the receipts that wait', () => {
    const v = resourceStockViewOf(jars())!;
    expect(v).toMatchObject({
      id: '40',
      name: 'צנצנות',
      giverId: '7',
      giverName: 'דנה',
      accounting: 'owned',
      delivered: 100,
      consumed: 93,
      onHand: 7,
      state: 'low',
      tracked: true
    });
    expect(v.links).toEqual([
      { recipeId: '5', productId: '1', productName: 'דבש', variantId: null, variantName: null, quantityPerUnit: 1 },
      { recipeId: '6', productId: '2', productName: 'מארז', variantId: '9', variantName: 'L', quantityPerUnit: 2 }
    ]);
    // The price is read from the receipt's name until Maap.unitPrice is there.
    expect(v.pending).toEqual([{ maapId: '70', quantity: 50, unitPrice: 4, deadline: '2026-10-23T09:00:00Z' }]);
  });

  it('a recurring resource has no shelf', () => {
    expect(resourceStockViewOf(jars({ recurring: true }))).toBeNull();
  });

  it('a resource nobody counted yet is untracked, not "out"', () => {
    const v = resourceStockViewOf(
      jars({ quantityDelivered: null, quantityConsumed: null, lowStockAt: null, matanot_recipe_resources: { data: [] }, maaps: { data: [] } })
    )!;
    expect(v.tracked).toBe(false);
    expect(v.onHand).toBe(0);
  });
});

describe('resourceStockViews', () => {
  it('puts empty and low shelves first, untracked ones last', () => {
    const views = resourceStockViews([
      { ...jars(), id: 1, attributes: { ...jars().attributes, name: 'א', quantityConsumed: 0 } },
      { ...jars(), id: 2, attributes: { ...jars().attributes, name: 'ב', quantityConsumed: 100 } },
      { ...jars(), id: 3, attributes: { ...jars().attributes, name: 'ג', quantityDelivered: null, quantityConsumed: null, lowStockAt: null, matanot_recipe_resources: { data: [] }, maaps: { data: [] } } },
      { ...jars(), id: 4, attributes: { ...jars().attributes, name: 'ד' } }
    ]);
    expect(views.map((v) => v.id)).toEqual(['2', '4', '1', '3']);
  });
});

describe('unitsCovered', () => {
  it('floors without float noise', () => {
    expect(unitsCovered(7, 2)).toBe(3);
    expect(unitsCovered(0.3, 0.1)).toBe(3);
    expect(unitsCovered(-2, 1)).toBe(0);
    expect(unitsCovered(5, 0)).toBe(0);
  });
});
