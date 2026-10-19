/**
 * Payment by arrangement (PLAN_SHOP_OPERATIONS §5) — the pure decisions:
 * what an arranged order must carry, where it may move, when it lapses, and
 * how the money that arrived is spread over the lines.
 */
import { describe, it, expect } from 'vitest';
import {
  arrangedMethodOf,
  expiresAtOf,
  hasLapsed,
  splitReceived,
  toOrderView,
  transitionOf,
  validateOrderPayload
} from './ordersApi.js';
import { lapsedOf } from './shop/arrangedExpiry.js';

const base = {
  externalId: 'arr_1',
  payment: 'arranged',
  buyer: { name: 'דנה', phone: '050-1234567' },
  lines: [{ productId: '1901', quantity: 2, unitPrice: 40 }]
};

describe('validateOrderPayload — payment', () => {
  it('a body without payment is a paid order, as it always was', () => {
    const v = validateOrderPayload({ ...base, payment: undefined });
    expect(v.ok && v.value.payment).toBe('paid');
  });

  it('an arranged order needs a name and a phone — somebody has to call', () => {
    const v = validateOrderPayload({ ...base, buyer: { email: 'a@b.co' } });
    expect(v.ok).toBe(false);
    if (v.ok === false) {
      expect(v.problems.map((p) => p.field)).toEqual(expect.arrayContaining(['buyer.name', 'buyer.phone']));
    }
  });

  it('refuses an amount — nothing was charged', () => {
    const v = validateOrderPayload({ ...base, amount: 80 });
    expect(v.ok === false && v.problems[0].field).toBe('amount');
  });

  it('takes expiresInHours only for an arranged order, within bounds', () => {
    expect(validateOrderPayload({ ...base, expiresInHours: 24 }).ok).toBe(true);
    expect(validateOrderPayload({ ...base, expiresInHours: 0 }).ok).toBe(false);
    expect(validateOrderPayload({ ...base, payment: 'paid', expiresInHours: 24 }).ok).toBe(false);
  });

  it('refuses an unknown payment', () => {
    expect(validateOrderPayload({ ...base, payment: 'bitcoin' }).ok).toBe(false);
  });
});

describe('transitionOf — pendingPayment', () => {
  it('becomes paid or cancelled, never shipped before the money', () => {
    expect(transitionOf('pendingPayment', 'paid')).toMatchObject({ kind: 'move' });
    expect(transitionOf('pendingPayment', 'cancelled')).toMatchObject({ kind: 'move' });
    expect(transitionOf('pendingPayment', 'shipped')).toMatchObject({ kind: 'refused', code: 'PAYMENT_PENDING' });
    expect(transitionOf('pendingPayment', 'fulfilled')).toMatchObject({ kind: 'refused', code: 'PAYMENT_PENDING' });
  });

  it('a paid order never goes back to waiting', () => {
    expect(transitionOf('paid', 'pendingPayment').kind).toBe('refused');
  });
});

describe('expiry', () => {
  it('lapses after the default 72 hours, or the hours the storefront set', () => {
    const t0 = Date.parse('2026-10-19T10:00:00Z');
    expect(expiresAtOf(t0, null)).toBe('2026-10-22T10:00:00.000Z');
    expect(expiresAtOf(t0, 2)).toBe('2026-10-19T12:00:00.000Z');
    expect(hasLapsed('2026-10-19T12:00:00Z', Date.parse('2026-10-19T12:00:00Z'))).toBe(true);
    expect(hasLapsed('2026-10-19T12:00:00Z', Date.parse('2026-10-19T11:59:59Z'))).toBe(false);
    expect(hasLapsed(null, t0)).toBe(false);
  });

  it('the cron lapses only waiting orders nobody started confirming', () => {
    const now = Date.parse('2026-10-20T00:00:00Z');
    const row = (id: string, attrs: Record<string, unknown>) => ({ id, attributes: attrs });
    const { lapse, skipped } = lapsedOf(
      [
        row('1', { status: 'pendingPayment', expiresAt: '2026-10-19T00:00:00Z', holder: { data: null } }),
        row('2', { status: 'pendingPayment', expiresAt: '2026-10-21T00:00:00Z' }),
        row('3', { status: 'pendingPayment', expiresAt: '2026-10-19T00:00:00Z', holder: { data: { id: 9 } } }),
        row('4', { status: 'paid', expiresAt: '2026-10-19T00:00:00Z' })
      ],
      now
    );
    expect(lapse.map((n) => n.id)).toEqual(['1']);
    expect(skipped).toBe(1);
  });

  it('GET /orders/{ref} says when a waiting order lapses, and only then', () => {
    const view = (status: string) =>
      toOrderView({ id: 1, attributes: { ref: '57:arr_1', status, expiresAt: '2026-10-22T10:00:00Z' } });
    expect(view('pendingPayment')?.expiresAt).toBe('2026-10-22T10:00:00Z');
    expect(view('paid')?.expiresAt).toBeNull();
  });
});

describe('splitReceived — what arrived is what is recorded', () => {
  it('the full price keeps each line at its own total; the fee is not a sale', () => {
    expect(splitReceived(110, [80, 20], 10)).toEqual({ amounts: [80, 20], catalogTotal: 110, received: 110, under: false });
  });

  it('a discount is shared by the lines and the fee in proportion', () => {
    const s = splitReceived(99, [80, 20], 10);
    expect(s.under).toBe(true);
    expect(s.amounts).toEqual([72, 18]);
  });

  it('agorot left by rounding land on the last line, and the sum is exact', () => {
    const s = splitReceived(100, [33.33, 33.33, 33.34], 0.01);
    const sum = Math.round(s.amounts.reduce((a, b) => a + b, 0) * 100) / 100;
    // The lines' share of 100 out of 100.01 asked: 99.99.
    expect(sum).toBe(99.99);
    expect(s.amounts.every((n) => n >= 0)).toBe(true);
  });

  it('nothing arrived is a counter of 0, not a missing sale', () => {
    expect(splitReceived(0, [80, 20], 0).amounts).toEqual([0, 0]);
  });
});

describe('arrangedMethodOf', () => {
  it('knows the ways money reaches a member', () => {
    expect(arrangedMethodOf('bit')).toBe('bit');
    expect(arrangedMethodOf('cash')).toBe('cash');
    expect(arrangedMethodOf('card')).toBeNull();
  });
});
