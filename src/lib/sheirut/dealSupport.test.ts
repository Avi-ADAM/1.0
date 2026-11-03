import { describe, expect, it } from 'vitest';
import { dealSupport, fixedDealPrice, lineShare, wishGivesSupport } from './dealSupport';

describe('dealSupport', () => {
  it('is the gap between what the work is worth and what she pays', () => {
    expect(dealSupport(1800, 1800)).toEqual({ planValue: 1800, price: 1800, support: 0, kind: 'none' });
    expect(dealSupport(1800, 1200)).toEqual({ planValue: 1800, price: 1200, support: 600, kind: 'discount' });
    expect(dealSupport(1800, 0)).toEqual({ planValue: 1800, price: 0, support: 1800, kind: 'help' });
  });

  it('a price above the plan gives nothing', () => {
    expect(dealSupport(1000, 1500)).toMatchObject({ support: 0, kind: 'none' });
  });
});

describe('fixedDealPrice', () => {
  const base = { track: 'fixed', given: true, planValue: 1800 };

  it('a fixed price pays the amount she can, never more than the plan', () => {
    expect(fixedDealPrice({ ...base, amount: 50 })).toBe(50);
    expect(fixedDealPrice({ ...base, amount: 0 })).toBe(0);
    expect(fixedDealPrice({ ...base, amount: 2500 })).toBe(1800);
  });

  it('no amount given, or another track, pays the plan — as before', () => {
    expect(fixedDealPrice({ ...base, given: false, amount: 0 })).toBe(1800);
    expect(fixedDealPrice({ ...base, track: 'atCost', amount: 50 })).toBe(1800);
    expect(fixedDealPrice({ ...base, track: null, amount: 50 })).toBe(1800);
  });
});

describe('wishGivesSupport', () => {
  it('only when the fixed price is below the plan', () => {
    expect(wishGivesSupport({ track: 'fixed', given: true, amount: 50, planValue: 1800 })).toBe(true);
    expect(wishGivesSupport({ track: 'fixed', given: true, amount: 1800, planValue: 1800 })).toBe(false);
    expect(wishGivesSupport({ track: 'atCost', given: true, amount: 50, planValue: 1800 })).toBe(false);
  });
});

describe('lineShare', () => {
  it('splits the price by what each line is worth (§7.2 example)', () => {
    expect(lineShare({ value: 1000, planValue: 1800, price: 1200 })).toEqual({ money: 666.67, gift: 333.33 });
    expect(lineShare({ value: 1000, planValue: 1800, price: 0 })).toEqual({ money: 0, gift: 1000 });
    expect(lineShare({ value: 1000, planValue: 1800, price: 1800 })).toEqual({ money: 1000, gift: 0 });
  });
});
