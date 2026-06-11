import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  money, moneyFromMinor, majorToMinor, minorToMajorString,
  addMoney, subMoney, mulRatio, eqMoney, isZero, distribute,
  serializeMoney, parseMoney
} from './money';

describe('majorToMinor / minorToMajorString — round-trip', () => {
  it('handles integers', () => {
    expect(majorToMinor('5')).toBe(500n);
    expect(majorToMinor('0')).toBe(0n);
    expect(majorToMinor('100')).toBe(10000n);
  });

  it('handles two-digit fractions', () => {
    expect(majorToMinor('5.50')).toBe(550n);
    expect(majorToMinor('5.5')).toBe(550n);
    expect(majorToMinor('5.05')).toBe(505n);
    expect(majorToMinor('0.01')).toBe(1n);
  });

  it('rejects more than 2 fractional digits', () => {
    expect(() => majorToMinor('5.123')).toThrow();
  });

  it('handles negatives', () => {
    expect(majorToMinor('-5.50')).toBe(-550n);
    expect(minorToMajorString(-550n)).toBe('-5.50');
  });

  it('round-trips through major-string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }),
        (n) => {
          const m = BigInt(n);
          const str = minorToMajorString(m);
          return majorToMinor(str) === m;
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('Money arithmetic', () => {
  it('adds same currency', () => {
    const a = money('5.50', 'ILS');
    const b = money('2.25', 'ILS');
    expect(addMoney(a, b).amount).toBe(775n);
  });

  it('rejects currency mismatch on add', () => {
    expect(() => addMoney(money('5', 'ILS'), money('5', 'USD'))).toThrow();
  });

  it('subtracts', () => {
    expect(subMoney(money('5.00', 'ILS'), money('1.50', 'ILS')).amount).toBe(350n);
  });

  it('multiplies by ratio with truncation', () => {
    // 10.00 × 1/3 = 3.33... → truncated to 3.33
    expect(mulRatio(money('10.00', 'ILS'), 1n, 3n).amount).toBe(333n);
  });

  it('throws on zero denominator', () => {
    expect(() => mulRatio(money('10', 'ILS'), 1n, 0n)).toThrow();
  });

  it('compares equality', () => {
    expect(eqMoney(money('5', 'ILS'), money('5.00', 'ILS'))).toBe(true);
    expect(eqMoney(money('5', 'ILS'), money('5', 'USD'))).toBe(false);
    expect(eqMoney(money('5', 'ILS'), money('5.01', 'ILS'))).toBe(false);
  });

  it('detects zero', () => {
    expect(isZero(money('0', 'ILS'))).toBe(true);
    expect(isZero(money('0.01', 'ILS'))).toBe(false);
  });
});

describe('distribute — fairness and exactness', () => {
  it('distributes equally with equal weights', () => {
    const total = money('100', 'ILS');
    const shares = distribute(total, [1n, 1n, 1n, 1n]);
    expect(shares.map((s) => s.amount)).toEqual([2500n, 2500n, 2500n, 2500n]);
  });

  it('absorbs residual in the last share', () => {
    // 10.00 / 3 = 3.33 + 3.33 + 3.34
    const total = money('10', 'ILS');
    const shares = distribute(total, [1n, 1n, 1n]);
    expect(shares.map((s) => s.amount)).toEqual([333n, 333n, 334n]);
    expect(shares.reduce((s, sh) => s + sh.amount, 0n)).toBe(total.amount);
  });

  it('weights drive proportional shares', () => {
    const total = money('100', 'ILS');
    const shares = distribute(total, [1n, 2n, 1n]); // 25/50/25
    expect(shares.map((s) => s.amount)).toEqual([2500n, 5000n, 2500n]);
  });

  it('sum of shares always equals total (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
        (totalMinor, weights) => {
          const total = moneyFromMinor(totalMinor, 'ILS');
          const shares = distribute(total, weights.map((w) => BigInt(w)));
          const sum = shares.reduce((s, sh) => s + sh.amount, 0n);
          return sum === total.amount;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('rejects empty weights', () => {
    expect(() => distribute(money('100', 'ILS'), [])).toThrow();
  });

  it('rejects zero-sum weights', () => {
    expect(() => distribute(money('100', 'ILS'), [0n, 0n])).toThrow();
  });
});

describe('canonical serialization', () => {
  it('round-trips via serialize/parse', () => {
    const m = money('5.50', 'ILS');
    const ser = serializeMoney(m);
    expect(ser).toEqual({ amount: '550', code: 'ILS' });
    expect(eqMoney(parseMoney(ser), m)).toBe(true);
  });

  it('amount is a string (never a number — JSON loses precision)', () => {
    const big = moneyFromMinor('999999999999999999', 'ILS');
    const ser = serializeMoney(big);
    expect(typeof ser.amount).toBe('string');
    expect(eqMoney(parseMoney(ser), big)).toBe(true);
  });

  it('rejects malformed input', () => {
    expect(() => parseMoney({ amount: 5 as unknown as string, code: 'ILS' })).toThrow();
    expect(() => parseMoney(null as unknown as { amount: string; code: string })).toThrow();
  });
});
