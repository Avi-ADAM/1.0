import { describe, expect, it } from 'vitest';
import { buildCustomers, customerRefOf, findCustomerByRef, ordersOfCustomer } from './customers';

const order = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  number: `10${id}`,
  status: 'paid',
  name: 'Dana',
  email: null as string | null,
  phone: null as string | null,
  total: 100,
  currency: 'ILS',
  at: '2026-11-01T10:00:00Z',
  ...over
});

const lead = {
  id: '7',
  name: 'דנה כהן',
  organization: null,
  email: 'dana@example.com',
  phone: '050-123-4567',
  createdAt: '2026-10-01T10:00:00Z',
  lastActivityAt: '2026-10-05T10:00:00Z'
};

describe('customerRefOf / findCustomerByRef', () => {
  const orders = [order('40', { phone: '0501234567' }), order('41', { email: 'x@y.co' })];
  const customers = buildCustomers([lead], orders);

  it('addresses a person by their lead, else by a paid order', () => {
    const withLead = customers.find((c) => c.leadIds.includes('7'))!;
    expect(customerRefOf(withLead)).toBe('l7');
    const buyer = customers.find((c) => c.orderIds.includes('41'))!;
    expect(customerRefOf(buyer)).toBe('o41');
    expect(customerRefOf({ leadIds: [], orderIds: [] })).toBeNull();
  });

  it('finds the same person again from either anchor', () => {
    expect(findCustomerByRef(customers, 'l7')).toBe(customers.find((c) => c.leadIds.includes('7')));
    // Order 40 shares the lead's phone: it is the same person.
    expect(findCustomerByRef(customers, 'o40')).toBe(findCustomerByRef(customers, 'l7'));
    expect(findCustomerByRef(customers, 'o41')?.orderIds).toEqual(['41']);
  });

  it('finds nobody for an unknown or malformed anchor', () => {
    expect(findCustomerByRef(customers, 'o999')).toBeNull();
    expect(findCustomerByRef(customers, 'l')).toBeNull();
    expect(findCustomerByRef(customers, 'x7')).toBeNull();
    expect(findCustomerByRef(customers, '')).toBeNull();
  });
});

describe('ordersOfCustomer', () => {
  it('lists every status, newest first — the history, not only what was paid', () => {
    const orders = [
      order('40', { phone: '050-123 4567', at: '2026-10-10T10:00:00Z' }),
      order('41', { email: 'DANA@example.com', at: '2026-11-02T10:00:00Z' }),
      order('42', { phone: '+972501234567', status: 'cancelled', at: '2026-10-20T10:00:00Z' }),
      order('43', { phone: '0501234567', status: 'pendingPayment', at: '2026-11-05T10:00:00Z' }),
      order('44', { email: 'other@y.co', at: '2026-11-06T10:00:00Z' })
    ];
    const dana = findCustomerByRef(buildCustomers([lead], orders), 'l7')!;
    expect(dana.orders).toBe(2); // paid only
    expect(ordersOfCustomer(dana, orders).map((o) => o.id)).toEqual(['43', '41', '42', '40']);
  });

  it('a person with only paid orders and no lead', () => {
    const orders = [order('1', { email: 'a@b.co', at: '2026-10-01T00:00:00Z' }), order('2', { email: 'a@b.co', at: '2026-10-02T00:00:00Z' })];
    const [c] = buildCustomers([], orders);
    expect(ordersOfCustomer(c, orders).map((o) => o.id)).toEqual(['2', '1']);
  });

  it('does not borrow a stranger\'s orders, nor orders with no contact at all', () => {
    const orders = [order('1', { email: 'a@b.co' }), order('2'), order('3', { email: 'z@z.co' })];
    const customers = buildCustomers([], orders);
    const a = customers.find((c) => c.email === 'a@b.co')!;
    expect(ordersOfCustomer(a, orders).map((o) => o.id)).toEqual(['1']);
  });
});
