import { describe, expect, it } from 'vitest';
import { addMonths, resolveFundingRequestTerms } from './fundingRequestTerms.js';

const NOW = new Date('2026-08-29T00:00:00.000Z');

describe('resolveFundingRequestTerms', () => {
  it('keeps the duration out of the money fields — the bug on resource 117', () => {
    // ₪60/hour × 40 hours = ₪2,400 a month, for 36 months = ₪86,400.
    const t = resolveFundingRequestTerms({
      totalCap: 86400,
      monthlyCap: 2400,
      months: 36,
      now: NOW
    });

    expect(t.monthly).toBe(2400); // price/easy: one cycle, not the whole budget
    expect(t.hm).toBe(1); // units per cycle, never the month count
    expect(t.months).toBe(36);
    expect(t.total).toBe(86400);
  });

  it('closes the window so montsi() recovers exactly the month count', () => {
    const t = resolveFundingRequestTerms({ totalCap: 86400, monthlyCap: 2400, months: 36, now: NOW });
    expect(t.startISO).toBe(NOW.toISOString());
    expect(t.endISO).toBe('2029-08-29T00:00:00.000Z');
  });

  it('derives the month count from the budget when none was asked for', () => {
    const t = resolveFundingRequestTerms({ totalCap: 24000, monthlyCap: 2000, now: NOW });
    expect(t.months).toBe(12);
    expect(t.monthly).toBe(2000);
  });

  it('falls back to a year when there is nothing to count from', () => {
    const t = resolveFundingRequestTerms({ totalCap: null, monthlyCap: 1500, now: NOW });
    expect(t.months).toBe(12);
    expect(t.monthly).toBe(1500);
    expect(t.total).toBe(18000);
  });

  it('splits a budget with no monthly ceiling across the asked months', () => {
    const t = resolveFundingRequestTerms({ totalCap: 9000, monthlyCap: null, months: 6, now: NOW });
    expect(t.monthly).toBe(1500);
    expect(t.total).toBe(9000);
  });

  it('prefers the program monthly rate over budget ÷ months on a partial ask', () => {
    // A year of a 36-month program is 12 × ₪2,400, not ₪86,400 ÷ 12.
    const t = resolveFundingRequestTerms({ totalCap: 86400, monthlyCap: 2400, months: 12, now: NOW });
    expect(t.monthly).toBe(2400);
    expect(t.total).toBe(28800);
  });

  it('lets an explicit monthly amount override the program', () => {
    const t = resolveFundingRequestTerms({
      totalCap: 86400,
      monthlyCap: 2400,
      monthlyAmount: 1000,
      months: 6,
      now: NOW
    });
    expect(t.monthly).toBe(1000);
    expect(t.total).toBe(6000);
  });

  it('lets an explicit end date define the duration, over the asked months', () => {
    const t = resolveFundingRequestTerms({
      totalCap: 86400,
      monthlyCap: 2400,
      months: 36,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-07-01T00:00:00.000Z',
      now: NOW
    });
    expect(t.months).toBe(6);
    expect(t.endISO).toBe('2026-07-01T00:00:00.000Z');
    expect(t.total).toBe(14400);
  });

  it('never produces a zero or negative run, whatever it is handed', () => {
    for (const months of [0, -5, NaN, 'nonsense', null]) {
      expect(resolveFundingRequestTerms({ totalCap: 1200, monthlyCap: 100, months, now: NOW }).months)
        .toBeGreaterThanOrEqual(1);
    }
    // An end date before the start cannot shorten the run below one cycle.
    const back = resolveFundingRequestTerms({
      totalCap: 1200,
      monthlyCap: 100,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-01-01T00:00:00.000Z',
      now: NOW
    });
    expect(back.months).toBeGreaterThanOrEqual(1);
  });

  it('caps a mistyped budget instead of publishing a 400-year commitment', () => {
    const t = resolveFundingRequestTerms({ totalCap: 8640000, monthlyCap: 1, now: NOW });
    expect(t.months).toBe(600);
  });

  it('survives an unparseable date and a missing budget', () => {
    const t = resolveFundingRequestTerms({
      totalCap: null,
      monthlyCap: null,
      startDate: 'not a date',
      endDate: '',
      now: NOW
    });
    expect(t.startISO).toBe(NOW.toISOString());
    expect(t.months).toBe(12);
    expect(t.monthly).toBe(0);
  });
});

describe('addMonths', () => {
  it('clamps to the end of a shorter month', () => {
    expect(addMonths(new Date('2026-01-31T00:00:00.000Z'), 1).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z'
    );
    expect(addMonths(new Date('2028-01-31T00:00:00.000Z'), 1).toISOString()).toBe(
      '2028-02-29T00:00:00.000Z'
    );
  });

  it('keeps the day of month when the target month is long enough', () => {
    expect(addMonths(new Date('2026-03-15T09:30:00.000Z'), 5).toISOString()).toBe(
      '2026-08-15T09:30:00.000Z'
    );
  });
});
