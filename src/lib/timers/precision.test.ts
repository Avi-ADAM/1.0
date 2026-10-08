import { describe, expect, it } from 'vitest';
import {
  MINUTE_HOURS,
  displayHours,
  hoursOfMs,
  isRealOverrun,
  roundHours,
  roundMoney,
  workValue
} from './precision';

const S = 1000;
const M = 60 * S;
const H = 60 * M;

describe('roundHours — whole minutes', () => {
  it('drops the seconds of a timer (deal 9: 8h + 6h39m + 21m04s)', () => {
    expect(hoursOfMs(8 * H + (6 * H + 39 * M) + (21 * M + 4 * S))).toBe(15);
  });

  it('rounds at the half minute: 29s down, 30s up', () => {
    expect(hoursOfMs(2 * H + 29 * S)).toBe(2);
    expect(hoursOfMs(2 * H + 30 * S)).toBe(roundHours(2 + MINUTE_HOURS));
    expect(hoursOfMs(29 * S)).toBe(0);
    expect(hoursOfMs(30 * S)).toBe(roundHours(MINUTE_HOURS));
  });

  it('cleans a stored figure that still carries seconds', () => {
    expect(roundHours(15.0013)).toBe(15);
    expect(roundHours(2.0006)).toBe(2);
    expect(roundHours(0.3511)).toBe(0.35); // 21m04s → 21m
  });

  it('keeps a minute that is not a round decimal stable under ×60 and in sums', () => {
    const third = roundHours(20 / 60);
    expect(third).toBe(0.333333);
    expect(Math.round(third * 60)).toBe(20);
    expect(roundHours(third + third + third)).toBe(1);
    expect(roundHours(roundHours(third))).toBe(third);
  });

  it('leaves a typed figure that is already whole minutes as it is', () => {
    expect(roundHours(15.5)).toBe(15.5);
    expect(roundHours(6.65)).toBe(6.65); // 6h39m
    expect(roundHours(17)).toBe(17);
  });

  it('survives junk', () => {
    expect(roundHours(NaN)).toBe(0);
    expect(roundHours(null)).toBe(0);
    expect(roundHours('x')).toBe(0);
    expect(roundHours(-0.001)).toBe(0);
    expect(Object.is(roundHours(-0.001), -0)).toBe(false);
  });
});

describe('roundMoney — agorot', () => {
  it('rounds to two decimals without float dust', () => {
    expect(roundMoney(2250.195)).toBe(2250.2);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(undefined)).toBe(0);
  });
});

describe('workValue — priced from the rounded hours', () => {
  it('the agreed price, not 2,250.2, for 15 hours and 4 seconds at 150', () => {
    expect(workValue(15.0013, 150)).toBe(2250);
    expect(workValue(2.0006, 250)).toBe(500);
  });

  it('a minute that is not a round decimal prices exactly', () => {
    expect(workValue(roundHours(15 + 20 / 60), 150)).toBe(2300); // 15h20m
    expect(workValue(20 / 60, 100)).toBe(33.33);
  });

  it('a single real minute over still counts', () => {
    expect(workValue(15 + 1 / 60, 150)).toBe(2252.5);
  });
});

describe('isRealOverrun — 1 ₪ and a minute of work', () => {
  it('the deal-9 leftovers are noise', () => {
    expect(isRealOverrun(0.2, 150)).toBe(false);
    expect(isRealOverrun(0.14, 250)).toBe(false);
  });

  it('the 1 ₪ boundary', () => {
    expect(isRealOverrun(0.99)).toBe(false);
    expect(isRealOverrun(0.994)).toBe(false); // rounds to 0.99
    expect(isRealOverrun(0.995)).toBe(true); // rounds to 1.00
    expect(isRealOverrun(1)).toBe(true);
  });

  it('the one-minute boundary at the line’s rate', () => {
    // a minute at 150/h is 2.50 ₪
    expect(isRealOverrun(2.5, 150)).toBe(true);
    // 1.20 ₪ at 150/h is 29 seconds of work — above 1 ₪, below a minute
    expect(isRealOverrun(1.2, 150)).toBe(false);
    // 1.30 ₪ at 150/h is 31 seconds — rounds to a minute
    expect(isRealOverrun(1.3, 150)).toBe(true);
    // at a low rate 1 ₪ is the binding threshold even past a minute
    expect(isRealOverrun(0.9, 30)).toBe(false);
  });

  it('without a rate only the money threshold applies', () => {
    expect(isRealOverrun(1.2)).toBe(true);
    expect(isRealOverrun(1.2, 0)).toBe(true);
  });

  it('junk is not an overrun', () => {
    expect(isRealOverrun(NaN, 150)).toBe(false);
    expect(isRealOverrun(-5)).toBe(false);
  });
});

describe('displayHours', () => {
  it('whole minutes to two decimals', () => {
    expect(displayHours(15.0013)).toBe(15);
    expect(displayHours(17.0019)).toBe(17);
    expect(displayHours(15 + 20 / 60)).toBe(15.33);
    expect(displayHours(undefined)).toBe(0);
  });
});
