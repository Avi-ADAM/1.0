import { describe, it, expect } from 'vitest';
import { monthsBetween, suggestStipendBudget } from './suggestBudget.js';

/**
 * What these protect (PLAN_STIPEND §6): the budget a member votes on is
 * *derived from the work*, never typed from memory. A wrong number here is a
 * wrong dilution, so every branch is pinned.
 */
describe('suggestStipendBudget', () => {
  it('makes a one-off mission its own closed total', () => {
    const s = suggestStipendBudget({ stipendRate: 10, hours: 40, recurring: false });
    expect(s).toMatchObject({ shape: 'total', totalCap: 400, monthlyCap: null, openEnded: false });
  });

  it('reads a recurring mission’s hours as monthly, and leaves it open-ended with no end date', () => {
    const s = suggestStipendBudget({ stipendRate: 20, hours: 70, recurring: true });
    // ₪1,400 a month, for as long as it lasts — no total to state.
    expect(s).toMatchObject({ shape: 'monthly', monthlyCap: 1400, totalCap: null, openEnded: true });
  });

  it('closes the total once a recurring mission names a start and an end', () => {
    const s = suggestStipendBudget({
      stipendRate: 20,
      hours: 70,
      recurring: true,
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-07-01T00:00:00.000Z'
    });
    expect(s?.months).toBe(6);
    expect(s?.totalCap).toBe(8400);
    expect(s?.monthlyCap).toBe(1400);
    expect(s?.openEnded).toBe(false);
    expect(s?.shape).toBe('total');
  });

  it('counts from today when the recurring mission has an end but no start yet', () => {
    // An open mission nobody has taken: it will start when it starts, and an
    // end date still makes the horizon countable.
    const s = suggestStipendBudget({
      stipendRate: 10,
      hours: 10,
      recurring: true,
      end: '2026-11-19T00:00:00.000Z',
      now: new Date('2026-08-19T00:00:00.000Z')
    });
    expect(s?.months).toBe(3);
    expect(s?.totalCap).toBe(300);
  });

  it('ignores an end date that is already past — it cannot bound anything', () => {
    const s = suggestStipendBudget({
      stipendRate: 10,
      hours: 10,
      recurring: true,
      start: '2026-08-01T00:00:00.000Z',
      end: '2026-07-01T00:00:00.000Z'
    });
    expect(s?.openEnded).toBe(true);
    expect(s?.monthlyCap).toBe(100);
  });

  it('suggests nothing when there is nothing to derive from', () => {
    expect(suggestStipendBudget({ stipendRate: 0, hours: 40, recurring: false })).toBeNull();
    expect(suggestStipendBudget({ stipendRate: 10, hours: null, recurring: false })).toBeNull();
  });
});

describe('monthsBetween', () => {
  it('rounds a part-month up — that month still pays a cycle', () => {
    expect(monthsBetween('2026-01-01T00:00:00.000Z', '2026-03-15T00:00:00.000Z')).toBe(3);
  });

  it('never returns less than one month for a real window', () => {
    expect(monthsBetween('2026-01-01T00:00:00.000Z', '2026-01-20T00:00:00.000Z')).toBe(1);
  });

  it('refuses an unusable window', () => {
    expect(monthsBetween('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBeNull();
    expect(monthsBetween('not a date', '2026-01-01T00:00:00.000Z')).toBeNull();
  });
});
