import { describe, it, expect } from 'vitest';
import {
  resolveRecurringPlan,
  normalizeCycleSize,
  cycleWindow,
  cycleWindowIso
} from './recurringPlan.js';

const base = { recurring: true, kindOf: 'monthly', isPmash: false, isAssigned: false };

describe('resolveRecurringPlan — is it recurring at all', () => {
  it('needs both the flag and a kindOf that can recur', () => {
    expect(resolveRecurringPlan({ ...base, kindOf: 'monthly' }).isRecurring).toBe(true);
    expect(resolveRecurringPlan({ ...base, kindOf: 'yearly' }).isRecurring).toBe(true);
    expect(resolveRecurringPlan({ ...base, kindOf: 'total' }).isRecurring).toBe(false);
    expect(resolveRecurringPlan({ ...base, kindOf: 'perUnit' }).isRecurring).toBe(false);
    expect(resolveRecurringPlan({ ...base, kindOf: 'rent' }).isRecurring).toBe(false);
    expect(resolveRecurringPlan({ ...base, recurring: false }).isRecurring).toBe(false);
  });

  it('gives a non-recurring resource no engine and nothing to stamp', () => {
    const plan = resolveRecurringPlan({ ...base, recurring: false });
    expect(plan.engineOn).toBeNull();
    expect(plan.stampOnRecord).toBe(false);
    expect(plan.cycleEvery).toBe(1);
  });

  it('derives the cycle unit from kindOf', () => {
    expect(resolveRecurringPlan({ ...base, kindOf: 'yearly' }).unit).toBe('year');
    expect(resolveRecurringPlan({ ...base, kindOf: 'monthly' }).unit).toBe('month');
  });
});

describe('resolveRecurringPlan — when the engine may be built', () => {
  it('builds it at once when the solo creator is the provider', () => {
    const plan = resolveRecurringPlan({ ...base, isPmash: false, isAssigned: true });
    expect(plan.engineOn).toBe('now');
  });

  // The regression this module exists for: a solo rikma publishing a recurring
  // need used to get an engine (and an archived, undiscoverable record) anyway.
  it('waits for approval when a solo creator has not claimed the resource', () => {
    const plan = resolveRecurringPlan({ ...base, isPmash: false, isAssigned: false });
    expect(plan.engineOn).toBe('onApproval');
  });

  it('never builds it at once in a multi-member rikma, claimed or not', () => {
    expect(resolveRecurringPlan({ ...base, isPmash: true, isAssigned: true }).engineOn).toBe(
      'onApproval'
    );
    expect(resolveRecurringPlan({ ...base, isPmash: true, isAssigned: false }).engineOn).toBe(
      'onApproval'
    );
  });

  it('stamps the terms on the record in every recurring case', () => {
    for (const isPmash of [true, false]) {
      for (const isAssigned of [true, false]) {
        expect(resolveRecurringPlan({ ...base, isPmash, isAssigned }).stampOnRecord).toBe(true);
      }
    }
  });
});

describe('normalizeCycleSize', () => {
  it('keeps sane periods', () => {
    expect(normalizeCycleSize(1)).toBe(1);
    expect(normalizeCycleSize(2)).toBe(2);
    expect(normalizeCycleSize('3')).toBe(3);
  });

  it('falls back to every-cycle for anything unusable', () => {
    for (const bad of [0, -4, null, undefined, '', 'abc', NaN, Infinity, {}]) {
      expect(normalizeCycleSize(bad)).toBe(1);
    }
  });

  it('floors fractions rather than producing a fractional period', () => {
    expect(normalizeCycleSize(2.9)).toBe(2);
    expect(normalizeCycleSize(0.5)).toBe(1);
  });
});

describe('cycleWindow — monthly', () => {
  it('returns the calendar month containing ref when size is 1', () => {
    const { cycleStart, cycleEnd } = cycleWindow(
      'month',
      new Date(2026, 0, 15),
      1,
      new Date(2026, 4, 20)
    );
    expect(cycleStart).toEqual(new Date(2026, 4, 1));
    expect(cycleEnd).toEqual(new Date(2026, 4, 31, 23, 59, 59));
  });

  // A bi-monthly resource anchored to January runs Jan-Feb, Mar-Apr, May-Jun…
  // so a ref in April must return the March window, not April's.
  it('aligns multi-month windows to the anchor', () => {
    const anchor = new Date(2026, 0, 10);
    const { cycleStart, cycleEnd } = cycleWindow('month', anchor, 2, new Date(2026, 3, 5));
    expect(cycleStart).toEqual(new Date(2026, 2, 1));
    expect(cycleEnd).toEqual(new Date(2026, 3, 30, 23, 59, 59));
  });

  it('handles a window that crosses the year boundary', () => {
    const anchor = new Date(2026, 10, 1); // November
    const { cycleStart, cycleEnd } = cycleWindow('month', anchor, 3, new Date(2026, 11, 15));
    expect(cycleStart).toEqual(new Date(2026, 10, 1));
    expect(cycleEnd).toEqual(new Date(2027, 1, 0, 23, 59, 59)); // end of Jan 2027
  });

  it('clamps to the first window when ref precedes the anchor', () => {
    const anchor = new Date(2026, 5, 1);
    const { cycleStart } = cycleWindow('month', anchor, 2, new Date(2026, 0, 1));
    expect(cycleStart).toEqual(new Date(2026, 5, 1));
  });
});

describe('cycleWindow — yearly', () => {
  it('returns the calendar year containing ref when size is 1', () => {
    const { cycleStart, cycleEnd } = cycleWindow(
      'year',
      new Date(2024, 3, 1),
      1,
      new Date(2026, 7, 9)
    );
    expect(cycleStart).toEqual(new Date(2026, 0, 1));
    expect(cycleEnd).toEqual(new Date(2026, 11, 31, 23, 59, 59));
  });

  it('aligns multi-year windows to the anchor year', () => {
    const { cycleStart, cycleEnd } = cycleWindow(
      'year',
      new Date(2024, 0, 1),
      2,
      new Date(2027, 5, 1)
    );
    expect(cycleStart).toEqual(new Date(2026, 0, 1));
    expect(cycleEnd).toEqual(new Date(2027, 11, 31, 23, 59, 59));
  });
});

describe('cycleWindow — unparseable dates', () => {
  // A malformed sqadualed reaching .toISOString() would throw a RangeError and
  // take down the acceptance flow, so an unusable anchor degrades instead.
  it('falls back to the window around ref when the anchor is invalid', () => {
    const ref = new Date(2026, 4, 20);
    expect(cycleWindow('month', new Date('nonsense'), 1, ref)).toEqual(
      cycleWindow('month', ref, 1, ref)
    );
  });

  it('still returns serializable dates when both anchor and ref are invalid', () => {
    const { cycleStart, cycleEnd } = cycleWindow('month', new Date(NaN), 2, new Date(NaN));
    expect(() => cycleStart.toISOString()).not.toThrow();
    expect(() => cycleEnd.toISOString()).not.toThrow();
    expect(cycleStart.getTime()).toBeLessThan(cycleEnd.getTime());
  });
});

describe('cycleWindowIso', () => {
  it('is cycleWindow serialized', () => {
    const args = ['month', new Date(2026, 0, 1), 1, new Date(2026, 4, 4)] as const;
    const dates = cycleWindow(...args);
    expect(cycleWindowIso(...args)).toEqual({
      cycleStart: dates.cycleStart.toISOString(),
      cycleEnd: dates.cycleEnd.toISOString()
    });
  });
});
