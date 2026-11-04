import { describe, it, expect } from 'vitest';
import {
  pastCycleWindows,
  normalizeBackfill,
  readBackfillEntries,
  backfillTotal,
  backfillPayload,
  MAX_BACKFILL_CYCLES
} from './backfill';

const NOW = new Date(2026, 10, 4, 12); // 4 Nov 2026

describe('pastCycleWindows', () => {
  it('lists every month from the start up to, not including, the current one', () => {
    const w = pastCycleWindows('month', new Date(2025, 4, 1), 1, NOW);
    expect(w.map((x) => x.key)[0]).toBe('2025-05');
    expect(w.at(-1)?.key).toBe('2026-10');
    expect(w).toHaveLength(18);
  });

  it('is empty when the start is in the current month or later', () => {
    expect(pastCycleWindows('month', new Date(2026, 10, 1), 1, NOW)).toEqual([]);
    expect(pastCycleWindows('month', new Date(2027, 0, 1), 1, NOW)).toEqual([]);
  });

  it('steps by cycleSize, aligned to the start', () => {
    const w = pastCycleWindows('month', new Date(2026, 0, 15), 2, NOW);
    // Nov–Dec is the current window, so Sep–Oct is the last past one.
    expect(w.map((x) => x.key)).toEqual(['2026-01', '2026-03', '2026-05', '2026-07', '2026-09']);
    expect(w.at(-1)?.cycleEnd).toEqual(new Date(2026, 10, 0, 23, 59, 59));
  });

  it('handles yearly cycles', () => {
    expect(pastCycleWindows('year', new Date(2024, 5, 1), 1, NOW).map((x) => x.key)).toEqual(['2024-01', '2025-01']);
  });

  it('accepts a date string and ignores nonsense', () => {
    expect(pastCycleWindows('month', '2026-08-01', 1, NOW).map((x) => x.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(pastCycleWindows('month', 'nope', 1, NOW)).toEqual([]);
    expect(pastCycleWindows('month', null, 1, NOW)).toEqual([]);
  });

  it('stops one past the limit so a caller can see the table is too long', () => {
    const w = pastCycleWindows('month', new Date(2010, 0, 1), 1, NOW);
    expect(w).toHaveLength(MAX_BACKFILL_CYCLES + 1);
  });
});

describe('readBackfillEntries', () => {
  it('reads the stored shape and a bare array, skipping junk', () => {
    expect(readBackfillEntries({ cycles: [{ key: '2026-01', amount: 10 }] })).toEqual([{ key: '2026-01', amount: 10 }]);
    expect(readBackfillEntries([{ key: '2026-01', amount: '7' }, { key: 'x', amount: 1 }, null, { key: '2026-02' }])).toEqual([
      { key: '2026-01', amount: 7 }
    ]);
    expect(readBackfillEntries(null)).toEqual([]);
  });
});

describe('normalizeBackfill', () => {
  const terms = { unit: 'month' as const, anchor: new Date(2026, 6, 1), now: NOW };

  it('keeps past months with a positive amount, in calendar order', () => {
    const c = normalizeBackfill(
      [
        { key: '2026-09', amount: 120 },
        { key: '2026-07', amount: 100 },
        { key: '2026-08', amount: 0 }
      ],
      terms
    );
    expect(c.map((x) => [x.key, x.amount])).toEqual([
      ['2026-07', 100],
      ['2026-09', 120]
    ]);
    expect(c[0].cycleStart).toEqual(new Date(2026, 6, 1));
  });

  it('drops the current month and months before an agreed later start', () => {
    const c = normalizeBackfill(
      [
        { key: '2026-11', amount: 50 },
        { key: '2026-06', amount: 50 },
        { key: '2026-08', amount: 50 }
      ],
      { ...terms, anchor: new Date(2026, 7, 1) }
    );
    expect(c.map((x) => x.key)).toEqual(['2026-08']);
  });

  it('a repeated month keeps its last amount', () => {
    const c = normalizeBackfill(
      [
        { key: '2026-07', amount: 1 },
        { key: '2026-07', amount: 2 }
      ],
      terms
    );
    expect(c.map((x) => x.amount)).toEqual([2]);
  });

  it('totals and serializes', () => {
    const c = normalizeBackfill(
      [
        { key: '2026-07', amount: 10.1 },
        { key: '2026-08', amount: 20.2 }
      ],
      terms
    );
    expect(backfillTotal(c)).toBe(30.3);
    expect(backfillPayload(c)).toEqual({ cycles: [{ key: '2026-07', amount: 10.1 }, { key: '2026-08', amount: 20.2 }] });
  });
});
