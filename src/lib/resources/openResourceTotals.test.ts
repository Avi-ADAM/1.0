import { describe, it, expect } from 'vitest';
import { openResourceTotals } from './openResourceTotals';

describe('openResourceTotals', () => {
  it('multiplies a monthly resource by the months between the dates', () => {
    const r = openResourceTotals({
      kindOf: 'monthly',
      price: 100,
      easy: 150,
      sqadualed: '2026-01-01',
      sqadualedf: '2026-07-01'
    });
    expect(r.cycles).toBe(6);
    expect(r.cycleUnit).toBe('monthly');
    expect(r.total).toBe(600);
    expect(r.maxTotal).toBe(900);
    expect(r.hasPeriod).toBe(true);
  });

  it('multiplies a yearly resource by the years between the dates', () => {
    const r = openResourceTotals({
      kindOf: 'yearly',
      price: 1200,
      easy: 2000,
      sqadualed: '2026-01-01',
      sqadualedf: '2028-01-01'
    });
    expect(r.cycles).toBe(2);
    expect(r.total).toBe(2400);
    expect(r.maxTotal).toBe(4000);
  });

  it('leaves the total unknown when a time-based resource has no period', () => {
    const r = openResourceTotals({ kindOf: 'monthly', price: 100, easy: 150 });
    expect(r.cycles).toBeNull();
    expect(r.total).toBeNull();
    expect(r.maxTotal).toBeNull();
    // the per-cycle price is still known
    expect(r.price).toBe(100);
  });

  it('multiplies a perUnit resource by its quantity', () => {
    const r = openResourceTotals({ kindOf: 'perUnit', price: 25, easy: 30, hm: 4 });
    expect(r.quantity).toBe(4);
    expect(r.total).toBe(100);
    expect(r.maxTotal).toBe(120);
    expect(r.hasPeriod).toBe(false);
  });

  it('treats rent as a one-off price over a period', () => {
    const r = openResourceTotals({
      kindOf: 'rent',
      price: 800,
      easy: 900,
      sqadualed: '2026-01-01',
      sqadualedf: '2026-03-01'
    });
    expect(r.total).toBe(800);
    expect(r.maxTotal).toBe(900);
    expect(r.hasPeriod).toBe(true);
  });

  it('treats total as a one-off price with no period', () => {
    const r = openResourceTotals({ kindOf: 'total', price: 500, easy: 640 });
    expect(r.total).toBe(500);
    expect(r.maxTotal).toBe(640);
    expect(r.hasPeriod).toBe(false);
  });

  it('coerces numeric strings and survives missing attributes', () => {
    expect(openResourceTotals({ kindOf: 'perUnit', price: '25', hm: '3' }).total).toBe(75);
    const empty = openResourceTotals(null);
    expect(empty.total).toBeNull();
    expect(empty.maxTotal).toBeNull();
    expect(empty.kind).toBeNull();
  });

  it('ignores invalid dates instead of producing NaN', () => {
    const r = openResourceTotals({
      kindOf: 'monthly',
      price: 100,
      sqadualed: 'not-a-date',
      sqadualedf: '2026-07-01'
    });
    expect(r.cycles).toBeNull();
    expect(r.total).toBeNull();
  });
});
