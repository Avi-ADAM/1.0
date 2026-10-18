import { describe, it, expect } from 'vitest';
import {
  availableFilter,
  countedWrite,
  countOf,
  isUnlimited,
  moveStock,
  unavailableFilter,
  unlimitedWrite,
  waitingUnits,
  type StockFields
} from './stock.js';

describe('isUnlimited', () => {
  it('reads the flag when it is written', () => {
    expect(isUnlimited({ quant: -1, unlimited: true })).toBe(true);
    expect(isUnlimited({ quant: 5, unlimited: true })).toBe(true);
    expect(isUnlimited({ quant: -1, unlimited: false })).toBe(false);
  });

  it('keeps the old -1 sentinel only for a row that predates the flag', () => {
    expect(isUnlimited({ quant: -1 })).toBe(true);
    expect(isUnlimited({ quant: -1, unlimited: null })).toBe(true);
    expect(isUnlimited({ quant: '-1', unlimited: null })).toBe(true);
    expect(isUnlimited({ quant: -2, unlimited: null })).toBe(false);
    expect(isUnlimited({ quant: 0 })).toBe(false);
    expect(isUnlimited({ quant: null })).toBe(false);
    expect(isUnlimited(null)).toBe(false);
  });
});

describe('a counted stock that sells past zero (the 0 − 1 bug)', () => {
  it('0 − 1 is one unit waiting, not unlimited', () => {
    const after = moveStock({ quant: 0, unlimited: false }, -1);
    expect(after).toEqual({ quant: -1, unlimited: false });
    expect(isUnlimited(after)).toBe(false);
    expect(countOf(after)).toBe(-1);
    expect(waitingUnits(after)).toBe(1);
  });

  it('a legacy row at 0 stops being legacy the first time it moves', () => {
    const after = moveStock({ quant: 0 }, -1)!;
    expect(after.unlimited).toBe(false);
    expect(isUnlimited(after)).toBe(false);
  });

  it('a restock that lands on -1 is still a count', () => {
    expect(moveStock({ quant: -3, unlimited: false }, 2)).toEqual({ quant: -1, unlimited: false });
  });

  it('a missing count moves from 0', () => {
    expect(moveStock({ quant: null, unlimited: false }, -2)).toEqual({ quant: -2, unlimited: false });
  });

  it('an unlimited row has nothing to move', () => {
    expect(moveStock({ quant: -1, unlimited: true }, -1)).toBeNull();
    expect(moveStock({ quant: -1 }, -1)).toBeNull();
  });
});

describe('count and writes', () => {
  it('countOf is null exactly when unlimited', () => {
    expect(countOf({ quant: 7, unlimited: false })).toBe(7);
    expect(countOf({ quant: -1, unlimited: true })).toBeNull();
    expect(countOf({ quant: -1 })).toBeNull();
    expect(waitingUnits({ quant: -1 })).toBe(0);
    expect(waitingUnits({ quant: 4, unlimited: false })).toBe(0);
  });

  it('unlimited keeps the sentinel beside the flag for older readers', () => {
    expect(unlimitedWrite()).toEqual({ quant: -1, unlimited: true });
    expect(countedWrite(-1)).toEqual({ quant: -1, unlimited: false });
  });
});

// The filters are checked by evaluating them the way SQL would — `ne` and
// `gt` are false on NULL — against every kind of row.
function sqlMatch(filter: any, row: Record<string, unknown>): boolean {
  if (filter.or) return filter.or.some((f: any) => sqlMatch(f, row));
  if (filter.and) return filter.and.every((f: any) => sqlMatch(f, row));
  const [field, op] = Object.entries(filter)[0] as [string, Record<string, unknown>];
  const v = row[field] ?? null;
  const [k, want] = Object.entries(op)[0];
  if (k === 'null') return (v === null) === want;
  if (v === null) return false;
  if (k === 'eq') return v === want;
  if (k === 'ne') return v !== want;
  if (k === 'gt') return (v as number) > (want as number);
  if (k === 'lte') return (v as number) <= (want as number);
  throw new Error(`op ${k}`);
}

describe('availableFilter / unavailableFilter', () => {
  const rows: [StockFields, boolean][] = [
    [{ quant: 5, unlimited: false }, true],
    [{ quant: 5, unlimited: null }, true],
    [{ quant: 0, unlimited: false }, false],
    [{ quant: 0, unlimited: null }, false],
    [{ quant: -1, unlimited: false }, false], // the bug: one unit waiting
    [{ quant: -1, unlimited: null }, true], // legacy sentinel
    [{ quant: -1, unlimited: true }, true],
    [{ quant: -4, unlimited: false }, false],
    [{ quant: -4, unlimited: null }, false],
    [{ quant: null, unlimited: null }, false],
    [{ quant: null, unlimited: true }, true]
  ];

  it.each(rows)('%o → available %s, and exactly one of the two filters matches', (row, available) => {
    expect(sqlMatch(availableFilter(), row)).toBe(available);
    expect(sqlMatch(unavailableFilter(), row)).toBe(!available);
  });

  it('takes the field names of the denormalized total', () => {
    const row = { stockTotal: -1, stockUnlimited: false };
    expect(sqlMatch(availableFilter('stockTotal', 'stockUnlimited'), row)).toBe(false);
    expect(sqlMatch(unavailableFilter('stockTotal', 'stockUnlimited'), row)).toBe(true);
  });
});
