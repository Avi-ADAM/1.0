import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeQuotas, type QuotaMember } from './quota';

const m = (userId: string, available: number, extra: Partial<QuotaMember> = {}): QuotaMember => ({
  userId,
  available,
  ...extra
});
const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

describe('computeQuotas', () => {
  it('splits evenly when nobody stated a commitment', () => {
    const r = computeQuotas(6, [m('a', 9), m('b', 9), m('c', 9)]);
    expect(r.quotas).toEqual({ a: 2, b: 2, c: 2 });
    expect(r.shortage).toBe(0);
  });

  it('rounds so the quotas add up to the places exactly', () => {
    // 5 / 3 = 1.67 each — naive rounding gives 6 or 3.
    const r = computeQuotas(5, [m('a', 9), m('b', 9), m('c', 9)]);
    expect(sum(r.quotas)).toBe(5);
    expect(Object.values(r.quotas).sort()).toEqual([1, 2, 2]);
  });

  it('caps a member at their agreed maximum and gives the rest to the others', () => {
    // "Only 2 a week" — the other two share what is left evenly.
    const r = computeQuotas(10, [m('a', 9, { max: 2 }), m('b', 9), m('c', 9)]);
    expect(r.quotas).toEqual({ a: 2, b: 4, c: 4 });
  });

  it('lifts a member to their agreed minimum', () => {
    // "I want 7 a week" — floored at 7 when the work is there.
    const r = computeQuotas(10, [m('a', 9, { min: 7 }), m('b', 9), m('c', 9)]);
    expect(r.quotas.a).toBe(7);
    expect(r.quotas.b + r.quotas.c).toBe(3);
  });

  it('never gives anyone more than they declared themselves available for', () => {
    const r = computeQuotas(9, [m('a', 1), m('b', 9), m('c', 9)]);
    expect(r.quotas.a).toBe(1);
    expect(r.quotas).toEqual({ a: 1, b: 4, c: 4 });
  });

  it('treats a minimum above the availability as the availability', () => {
    const r = computeQuotas(9, [m('a', 1, { min: 4 }), m('b', 9)]);
    expect(r.bounds.a).toMatchObject({ lo: 1, hi: 1 });
    expect(r.quotas).toEqual({ a: 1, b: 8 });
  });

  it('reports a shortage instead of inventing capacity', () => {
    const r = computeQuotas(10, [m('a', 9, { max: 2 }), m('b', 3)]);
    expect(r.quotas).toEqual({ a: 2, b: 3 });
    expect(r.shortage).toBe(5);
  });

  it('drops evenly below the minimums when there is more commitment than work', () => {
    const r = computeQuotas(4, [m('a', 9, { min: 3 }), m('b', 9, { min: 3 })]);
    expect(r.quotas).toEqual({ a: 2, b: 2 });
    expect(r.belowMin).toEqual(['a', 'b']);
    expect(r.shortage).toBe(0);
  });

  it('gives less to whoever took more than their share last time', () => {
    const r = computeQuotas(6, [m('a', 9, { carry: 2 }), m('b', 9), m('c', 9)]);
    expect(r.quotas.a).toBeLessThan(r.quotas.b);
    expect(sum(r.quotas)).toBe(6);
  });

  it('breaks a rounding tie in favour of whoever is owed more', () => {
    const r = computeQuotas(1, [m('a', 9, { carry: 0 }), m('b', 9, { carry: -0.5 })]);
    expect(r.quotas).toEqual({ a: 0, b: 1 });
  });

  it('does not depend on the order members are listed in', () => {
    const members = [m('a', 3, { max: 2 }), m('b', 9, { min: 1 }), m('c', 5, { carry: 1 }), m('d', 9)];
    const a = computeQuotas(11, members).quotas;
    const b = computeQuotas(11, [...members].reverse()).quotas;
    expect(a).toEqual(b);
  });

  it('handles an empty rikma and zero places', () => {
    expect(computeQuotas(3, [])).toMatchObject({ quotas: {}, shortage: 3 });
    expect(computeQuotas(0, [m('a', 4)]).quotas).toEqual({ a: 0 });
  });
});

describe('computeQuotas — properties', () => {
  const member = fc.record({
    userId: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f'),
    available: fc.integer({ min: 0, max: 12 }),
    min: fc.option(fc.integer({ min: 0, max: 8 }), { nil: null }),
    max: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
    carry: fc.float({ min: -3, max: 3, noNaN: true })
  });
  const members = fc.uniqueArray(member, { selector: (x) => x.userId, maxLength: 6 });

  it('every quota lies inside the member’s own bounds, and they sum to min(places, Σhi)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), members, (slots, ms) => {
        const r = computeQuotas(slots, ms);
        const sumHi = Object.values(r.bounds).reduce((a, b) => a + b.hi, 0);
        expect(sum(r.quotas)).toBe(Math.min(slots, sumHi));
        expect(r.shortage).toBe(Math.max(0, slots - sumHi));
        for (const [u, q] of Object.entries(r.quotas)) {
          expect(Number.isInteger(q)).toBe(true);
          expect(q).toBeGreaterThanOrEqual(0);
          expect(q).toBeLessThanOrEqual(r.bounds[u].hi);
          if (!r.belowMin.includes(u)) expect(q).toBeGreaterThanOrEqual(r.bounds[u].lo);
        }
      })
    );
  });

  it('with no commitments and no carry, nobody gets two more than anybody else', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 1, max: 6 }), (slots, n) => {
        const ms = Array.from({ length: n }, (_, i) => m(`u${i}`, 99));
        const q = Object.values(computeQuotas(slots, ms).quotas);
        expect(Math.max(...q) - Math.min(...q)).toBeLessThanOrEqual(1);
      })
    );
  });
});
