import { describe, expect, it } from 'vitest';
import { landingTab, productShips, visibleTabs, type ManageFacts } from './manageTabs';

const facts = (f: Partial<ManageFacts> = {}): ManageFacts => ({ products: 0, ships: false, shippingSet: false, orders: 0, ...f });

describe('visibleTabs', () => {
  it('a rikma that sells a service sees in progress, sales, products and connect', () => {
    expect(visibleTabs(facts())).toEqual(['pipeline', 'products', 'sales', 'customers', 'connect']);
  });

  it('a product opens orders, stock, fulfilment and promotions — shipping only when something ships', () => {
    expect(visibleTabs(facts({ products: 2 }))).toEqual(['pipeline', 'orders', 'stock', 'fulfillment', 'promotions', 'products', 'sales', 'customers', 'connect']);
    expect(visibleTabs(facts({ products: 2, ships: true }))).toContain('shipping');
    expect(visibleTabs(facts({ shippingSet: true }))).toContain('shipping');
  });

  it('orders stay while the rikma has any, even with no product left', () => {
    expect(visibleTabs(facts({ orders: 1 }))).toContain('orders');
  });

  it('never hides the tab a member is on, and shows everything when facts are unknown', () => {
    expect(visibleTabs(facts(), 'stock')).toContain('stock');
    expect(visibleTabs(null)).toHaveLength(10);
  });
});

describe('landingTab', () => {
  const paidToShip = { status: 'paid', delivery: { preference: 'delivery' } } as any;
  it('lands on orders when a paid order waits to go out', () => {
    expect(landingTab([paidToShip], facts())).toBe('orders');
  });
  it('otherwise on the deals in progress', () => {
    expect(landingTab([], facts({ products: 1 }))).toBe('pipeline');
    expect(landingTab([{ status: 'pendingPayment', delivery: { preference: 'delivery' } } as any], facts())).toBe('pipeline');
  });
});

describe('productShips', () => {
  it('reads the array, or its string', () => {
    expect(productShips([{ kind: 'pickup' }, { kind: 'delivery', fee: 30 }])).toBe(true);
    expect(productShips('[{"kind":"delivery"}]')).toBe(true);
    expect(productShips([{ kind: 'digital' }])).toBe(false);
    expect(productShips(null)).toBe(false);
    expect(productShips('not json')).toBe(false);
  });
});
