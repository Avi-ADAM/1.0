import { describe, expect, it } from 'vitest';
import { buildCustomers, matchesCustomer } from './customers';

const order = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  number: `10${id}`,
  status: 'paid',
  name: 'Avi',
  email: null,
  phone: null,
  total: 100,
  currency: 'ILS',
  at: '2026-11-01T10:00:00Z',
  ...over
});

describe('buildCustomers', () => {
  it('one person behind a won lead and two paid orders, matched by phone or by email', () => {
    const customers = buildCustomers(
      [
        {
          id: '7',
          name: 'דנה כהן',
          organization: 'הרצל 12',
          email: 'dana@example.com',
          phone: '050-123-4567',
          createdAt: '2026-10-01T10:00:00Z',
          lastActivityAt: '2026-10-05T10:00:00Z'
        }
      ],
      [
        order('40', { name: 'Dana', phone: '+972501234567', at: '2026-10-10T10:00:00Z' }),
        order('41', { name: 'Dana C', email: 'DANA@example.com', total: 50.5, at: '2026-11-02T10:00:00Z' }),
        order('42', { name: 'Someone else', email: 'x@y.co' })
      ]
    );
    expect(customers).toHaveLength(2);
    const dana = customers.find((c) => c.leadIds.includes('7'))!;
    expect(dana).toMatchObject({
      name: 'Dana C',
      organization: 'הרצל 12',
      orders: 2,
      orderIds: ['40', '41'],
      totals: [{ currency: 'ILS', amount: 150.5 }],
      firstAt: '2026-10-05T10:00:00Z',
      lastAt: '2026-11-02T10:00:00Z'
    });
  });

  it('only paid orders make a customer', () => {
    expect(buildCustomers([], [order('1', { status: 'pendingPayment', email: 'a@b.co' }), order('2', { status: 'cancelled', email: 'c@d.co' })])).toEqual([]);
  });

  it('newest customer first, and search by name, phone digits or email', () => {
    const cs = buildCustomers([], [
      order('1', { email: 'old@x.co', at: '2026-01-01T00:00:00Z' }),
      order('2', { email: 'new@x.co', phone: '0521112233', at: '2026-11-01T00:00:00Z' })
    ]);
    expect(cs.map((c) => c.email)).toEqual(['new@x.co', 'old@x.co']);
    expect(matchesCustomer(cs[0], '111')).toBe(true);
    expect(matchesCustomer(cs[0], 'NEW@')).toBe(true);
    expect(matchesCustomer(cs[1], '111')).toBe(false);
  });
});
