import { describe, expect, it } from 'vitest';
import {
  MAX_HOURS_IN_MONTH,
  missionBackfillBook,
  missionBackfillCycles,
  missionBackfillProblem,
  missionBackfillRows,
  missionPastMonths
} from './missionBackfill';
import { buildMonthlyLedger, normalizeRows, reconcileMonter } from './missionMonths';

const now = new Date(2026, 10, 11);
const anchor = new Date(2024, 10, 5).toISOString();
const entry = { key: '2026-01', amount: 10 };
const ok = { iskvua: true, isAssigned: true, anchor, now };

describe('missionPastMonths', () => {
  it('runs from the start month up to the month before the current one', () => {
    const months = missionPastMonths(anchor, now);
    expect(months).toHaveLength(24);
    expect(months[0].key).toBe('2024-11');
    expect(months.at(-1)?.key).toBe('2026-10');
  });
});

describe('missionBackfillProblem', () => {
  it('has nothing to say about a mission with no table', () => {
    expect(missionBackfillProblem(undefined, { ...ok, iskvua: false, isAssigned: false })).toBeNull();
    expect(missionBackfillProblem([], { ...ok, iskvua: false })).toBeNull();
  });

  it('accepts a table for a recurring mission with a named member', () => {
    expect(missionBackfillProblem([entry], ok)).toBeNull();
  });

  it('refuses a one-off mission', () => {
    expect(missionBackfillProblem([entry], { ...ok, iskvua: false })).toMatch(/recurring/);
  });

  it('refuses a mission nobody is assigned to', () => {
    expect(missionBackfillProblem([entry], { ...ok, isAssigned: false })).toMatch(/assigned/);
  });

  it('refuses negative hours and a month longer than a month', () => {
    expect(missionBackfillProblem([{ key: '2026-01', amount: -1 }], ok)).toMatch(/between/);
    expect(missionBackfillProblem([{ key: '2026-01', amount: MAX_HOURS_IN_MONTH + 1 }], ok)).toMatch(/between/);
  });

  it('refuses a start in the current month and a start too long ago', () => {
    expect(missionBackfillProblem([entry], { ...ok, anchor: new Date(2026, 10, 1).toISOString() })).toMatch(/before/);
    expect(missionBackfillProblem([entry], { ...ok, anchor: new Date(2015, 0, 1).toISOString() })).toMatch(/At most/);
  });
});

describe('missionBackfillCycles', () => {
  it('keeps the past months of this mission that have hours in them', () => {
    const cycles = missionBackfillCycles(
      {
        cycles: [
          { key: '2026-02', amount: 8 },
          { key: '2026-01', amount: 5 },
          { key: '2025-12', amount: 0 },
          { key: '2026-11', amount: 9 },
          { key: '2020-01', amount: 9 }
        ]
      },
      { anchor, now }
    );
    expect(cycles.map((c) => [c.key, c.amount])).toEqual([
      ['2026-01', 5],
      ['2026-02', 8]
    ]);
  });

  it('drops the months before a start date a counter-proposal moved later', () => {
    const cycles = missionBackfillCycles(
      [
        { key: '2025-01', amount: 5 },
        { key: '2026-03', amount: 7 }
      ],
      { anchor: new Date(2026, 0, 1).toISOString(), now }
    );
    expect(cycles.map((c) => c.key)).toEqual(['2026-03']);
  });
});

describe('the ledger the table leaves behind', () => {
  const cycles = missionBackfillCycles(
    [
      { key: '2026-01', amount: 10 },
      { key: '2026-02', amount: 12.5 }
    ],
    { anchor, now }
  );
  const rows = missionBackfillRows(cycles, 20);

  it('adds the hours up and prices them', () => {
    expect(missionBackfillBook(cycles, 100)).toEqual({ hours: 22.5, value: 2250 });
  });

  it('writes one approved row per month', () => {
    expect(rows).toEqual([
      { monthStart: '2026-01-01', hours: 20, isDone: true, hoursDone: 10 },
      { monthStart: '2026-02-01', hours: 20, isDone: true, hoursDone: 12.5 }
    ]);
  });

  it('reads as approved, not as unverified, with no timers behind it', () => {
    const { months } = buildMonthlyLedger({ rows, segments: [], now });
    expect(months.find((m) => m.key === '2026-02')).toMatchObject({ state: 'approved', hoursDone: 12.5 });
  });

  it('survives the month close and the repair job once real timers arrive', () => {
    const segments = [{ start: new Date(2026, 9, 3, 9).toISOString(), stop: new Date(2026, 9, 3, 11).toISOString() }];
    const { rows: after } = reconcileMonter({ rows: normalizeRows(rows), segments, now, dropEmpty: true });
    expect(after.filter((r) => r.isDone)).toEqual(rows);
    expect(after.find((r) => r.monthStart === '2026-10-01')).toMatchObject({ isDone: false, hoursDone: 2 });
  });
});
