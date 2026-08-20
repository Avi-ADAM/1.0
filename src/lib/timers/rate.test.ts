import { describe, it, expect } from 'vitest';
import {
  blendedRate,
  pickRateRow,
  resolveRate,
  rowRate,
  sameRate,
  segmentHours,
  sumRowsValue,
  type RateRow,
} from './rate.js';

const row = (id: string, noofhours: number, perhour: number | null): RateRow => ({
  id,
  noofhours,
  perhour,
});

describe('resolveRate', () => {
  it('takes the first stamp that exists', () => {
    expect(resolveRate(null, 80, 50)).toBe(80);
    expect(resolveRate(120, 80, 50)).toBe(120);
  });

  it('falls back to the mission for anything unstamped — legacy behaviour', () => {
    expect(resolveRate(null, undefined, 50)).toBe(50);
  });

  it('treats 0 as a real rate, not as missing', () => {
    expect(resolveRate(0, 50)).toBe(0);
  });
});

describe('pickRateRow', () => {
  it('grows the row of the same rate era', () => {
    const rows = [row('1', 10, 50), row('2', 4, 80)];
    expect(pickRateRow(rows, 80)?.id).toBe('2');
  });

  it('returns null for a rate that has no row yet', () => {
    expect(pickRateRow([row('1', 10, 50)], 80)).toBeNull();
  });

  it('lets a legacy row keep absorbing hours', () => {
    expect(pickRateRow([row('1', 10, null)], 80)?.id).toBe('1');
  });

  it('prefers an exact rate match over the legacy row', () => {
    const rows = [row('1', 10, null), row('2', 4, 80)];
    expect(pickRateRow(rows, 80)?.id).toBe('2');
  });

  it('survives an empty list', () => {
    expect(pickRateRow([], 50)).toBeNull();
    expect(pickRateRow(null, 50)).toBeNull();
  });
});

describe('sumRowsValue', () => {
  it('prices every era at its own rate', () => {
    const { hours, value } = sumRowsValue([row('1', 10, 50), row('2', 4, 80)], 80);
    expect(hours).toBe(14);
    // The whole point: NOT 14 × 80 = 1120.
    expect(value).toBe(820);
  });

  it('prices a legacy row at the rate being applied', () => {
    expect(sumRowsValue([row('1', 10, null)], 50).value).toBe(500);
  });
});

describe('blendedRate', () => {
  it('keeps hours × rate equal to the mixed total', () => {
    const blended = blendedRate(14, 820, 80);
    expect(blended * 14).toBeCloseTo(820);
  });

  it('falls back when there are no hours to divide by', () => {
    expect(blendedRate(0, 0, 80)).toBe(80);
  });
});

describe('segmentHours', () => {
  const now = Date.parse('2026-08-20T12:00:00.000Z');

  it('sums closed segments', () => {
    expect(
      segmentHours(
        [{ start: '2026-08-20T08:00:00.000Z', stop: '2026-08-20T10:00:00.000Z' }],
        now,
      ),
    ).toBe(2);
  });

  it('runs an open segment up to now', () => {
    expect(segmentHours([{ start: '2026-08-20T11:00:00.000Z', stop: null }], now)).toBe(1);
  });

  it('ignores junk rather than producing NaN', () => {
    expect(segmentHours([{ start: null }, { start: 'not-a-date' }], now)).toBe(0);
  });
});

describe('sameRate', () => {
  it('matches across a float round-trip', () => {
    expect(sameRate(12.5, 12.500000001)).toBe(true);
    expect(sameRate(12.5, 12.6)).toBe(false);
  });

  it('only calls two missing rates equal', () => {
    expect(sameRate(null, null)).toBe(true);
    expect(sameRate(null, 50)).toBe(false);
  });
});

describe('rowRate', () => {
  it('prefers the row stamp and falls back otherwise', () => {
    expect(rowRate(row('1', 3, 50), 80)).toBe(50);
    expect(rowRate(row('1', 3, null), 80)).toBe(80);
  });
});
