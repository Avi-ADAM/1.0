import { describe, it, expect } from 'vitest';
import {
  buildMonthlyLedger,
  hoursByMonth,
  hoursInMonth,
  monthKeyOf,
  normalizeRows,
  reconcileMonter,
  segmentsFromTimers,
  type MonterRow
} from './missionMonths.js';

/** Local-time ISO string, so the tests read the same month the code does. */
function at(y: number, m: number, d: number, h = 0, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

describe('monthKeyOf', () => {
  it('slices a stored monthStart without re-parsing it as UTC', () => {
    expect(monthKeyOf('2026-07-01')).toBe('2026-07');
    expect(monthKeyOf('2026-07-01T00:00:00.000Z')).toBe('2026-07');
  });

  it('reads a Date in local time', () => {
    expect(monthKeyOf(new Date(2026, 6, 15))).toBe('2026-07');
  });

  it('returns null for junk', () => {
    expect(monthKeyOf('')).toBeNull();
    expect(monthKeyOf(null)).toBeNull();
    expect(monthKeyOf(new Date('nonsense'))).toBeNull();
  });
});

describe('hoursByMonth', () => {
  it('splits a segment that crosses a month boundary', () => {
    const segments = [{ start: at(2026, 7, 31, 22), stop: at(2026, 8, 1, 2) }];
    const byMonth = hoursByMonth(segments);
    expect(byMonth.get('2026-07')).toBeCloseTo(2, 6);
    expect(byMonth.get('2026-08')).toBeCloseTo(2, 6);
  });

  it('measures a still-running segment up to now', () => {
    const nowMs = new Date(2026, 7, 2, 12).getTime();
    const segments = [{ start: at(2026, 8, 2, 9), stop: null }];
    expect(hoursByMonth(segments, nowMs).get('2026-08')).toBeCloseTo(3, 6);
  });

  it('ignores junk and zero-length segments', () => {
    const segments = [
      { start: null, stop: at(2026, 7, 2) },
      { start: 'nonsense', stop: at(2026, 7, 2) },
      { start: at(2026, 7, 2), stop: at(2026, 7, 2) },
      { start: at(2026, 7, 3), stop: at(2026, 7, 2) }
    ];
    expect(hoursByMonth(segments).size).toBe(0);
  });

  it('hoursInMonth agrees with the map', () => {
    const segments = [{ start: at(2026, 7, 10, 8), stop: at(2026, 7, 10, 11) }];
    expect(hoursInMonth(segments, 2026, 6)).toBeCloseTo(3, 6);
    expect(hoursInMonth(segments, 2026, 7)).toBe(0);
  });
});

describe('normalizeRows', () => {
  it('coerces nulls into a usable row', () => {
    expect(normalizeRows([{ monthStart: '2026-07-01', hours: null, isDone: null, hoursDone: null }])).toEqual([
      { monthStart: '2026-07-01', hours: 0, isDone: false, hoursDone: 0 }
    ]);
  });

  it('tolerates a null monter', () => {
    expect(normalizeRows(null)).toEqual([]);
  });
});

describe('reconcileMonter', () => {
  const now = new Date(2026, 7, 2, 10); // 2 Aug 2026, 10:00 — the reported bug

  it('files July from the timers and leaves August on the counter', () => {
    const segments = [
      { start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }, // 8h in July
      { start: at(2026, 8, 1, 9), stop: at(2026, 8, 1, 9, 30) } // 0.5h in August
    ];
    const { rows, counter, changes } = reconcileMonter({ rows: [], segments, hoursassinged: 20, now });

    expect(rows).toEqual([{ monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 8 }]);
    expect(counter).toBeCloseTo(0.5, 6);
    expect(changes).toEqual([{ month: '2026-07', kind: 'added', to: 8 }]);
  });

  it('corrects a row a previous run filled with the wrong month', () => {
    const segments = [
      { start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) },
      { start: at(2026, 8, 1, 9), stop: at(2026, 8, 1, 9, 30) }
    ];
    // What the buggy run wrote: July stamped with August's half hour.
    const rows: MonterRow[] = [{ monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 0.5 }];
    const res = reconcileMonter({ rows, segments, hoursassinged: 20, now });

    expect(res.rows).toEqual([{ monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 8 }]);
    expect(res.counter).toBeCloseTo(0.5, 6);
    expect(res.changes).toEqual([{ month: '2026-07', kind: 'corrected', from: 0.5, to: 8 }]);
  });

  it('never rewrites an approved month', () => {
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [{ monthStart: '2026-07-01', hours: 20, isDone: true, hoursDone: 3 }];
    const res = reconcileMonter({ rows, segments, now });

    expect(res.rows).toEqual(rows);
    expect(res.changes).toEqual([]);
  });

  it('collapses a duplicate row for the same month', () => {
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [
      { monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 8 },
      { monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 0.5 }
    ];
    const res = reconcileMonter({ rows, segments, now });

    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].hoursDone).toBeCloseTo(8, 6);
    expect(res.changes).toContainEqual({ month: '2026-07', kind: 'collapsed' });
  });

  it('keeps an approved row and drops its unapproved twin', () => {
    const rows: MonterRow[] = [
      { monthStart: '2026-06-01', hours: 20, isDone: true, hoursDone: 12 },
      { monthStart: '2026-06-01', hours: 20, isDone: false, hoursDone: 0.5 }
    ];
    const res = reconcileMonter({ rows, segments: [], now });

    expect(res.rows).toEqual([rows[0]]);
  });

  it('keeps a month with no timer evidence unless dropEmpty', () => {
    const rows: MonterRow[] = [{ monthStart: '2026-05-01', hours: 20, isDone: false, hoursDone: 7 }];

    const kept = reconcileMonter({ rows, segments: [], now });
    expect(kept.rows).toEqual(rows);
    expect(kept.changes).toEqual([{ month: '2026-05', kind: 'unverified', from: 7 }]);

    const dropped = reconcileMonter({ rows, segments: [], now, dropEmpty: true });
    expect(dropped.rows).toEqual([]);
    expect(dropped.changes).toEqual([{ month: '2026-05', kind: 'dropped', from: 7 }]);
  });

  it('does not file the open month even when a row for it exists', () => {
    const segments = [{ start: at(2026, 8, 1, 9), stop: at(2026, 8, 1, 12) }];
    const rows: MonterRow[] = [{ monthStart: '2026-08-01', hours: 20, isDone: false, hoursDone: 1 }];
    const res = reconcileMonter({ rows, segments, now });

    expect(res.rows).toEqual(rows); // left exactly as it was
    expect(res.counter).toBeCloseTo(3, 6);
  });

  it('is chronological and idempotent', () => {
    const segments = [
      { start: at(2026, 6, 3, 9), stop: at(2026, 6, 3, 13) },
      { start: at(2026, 7, 3, 9), stop: at(2026, 7, 3, 12) },
      { start: at(2026, 8, 1, 9), stop: at(2026, 8, 1, 10) }
    ];
    const first = reconcileMonter({ rows: [], segments, hoursassinged: 20, now });
    expect(first.rows.map((r) => r.monthStart)).toEqual(['2026-06-01', '2026-07-01']);

    const second = reconcileMonter({ rows: first.rows, segments, hoursassinged: 20, now });
    expect(second.rows).toEqual(first.rows);
    expect(second.changes).toEqual([]);
  });

  it('keeps rows whose monthStart cannot be read', () => {
    const rows: MonterRow[] = [{ monthStart: '', hours: 0, isDone: false, hoursDone: 4 }];
    const res = reconcileMonter({ rows, segments: [], now });
    expect(res.rows).toEqual(rows);
  });
});

describe('segmentsFromTimers', () => {
  it('reads the component segments of each timer', () => {
    const segments = segmentsFromTimers([
      {
        id: '1',
        attributes: {
          start: at(2026, 7, 10, 9),
          finnish: at(2026, 7, 10, 17),
          timers: [
            { start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 12) },
            { start: at(2026, 7, 10, 14), stop: at(2026, 7, 10, 17) }
          ]
        }
      }
    ]);
    // the components only — not the entity's outer bounds on top of them
    expect(segments).toHaveLength(2);
    expect(hoursByMonth(segments).get('2026-07')).toBeCloseTo(6, 6);
  });

  it('falls back to the entity bounds for a timer with no components', () => {
    const segments = segmentsFromTimers([
      { id: '2', attributes: { start: at(2026, 7, 3, 9), finnish: at(2026, 7, 3, 11), timers: [] } }
    ]);
    expect(segments).toEqual([{ start: at(2026, 7, 3, 9), stop: at(2026, 7, 3, 11) }]);
  });

  it('leaves a running timer open so it can be measured up to now', () => {
    const segments = segmentsFromTimers([
      { id: '3', attributes: { start: at(2026, 8, 2, 9), isActive: true } }
    ]);
    expect(segments).toEqual([{ start: at(2026, 8, 2, 9), stop: null }]);
  });

  it('tolerates junk', () => {
    expect(segmentsFromTimers(null)).toEqual([]);
    expect(segmentsFromTimers([null, {}, { attributes: {} }])).toEqual([]);
  });
});

describe('buildMonthlyLedger', () => {
  const now = new Date(2026, 7, 2, 10); // 2 Aug 2026, 10:00

  it('shows the open month live from the timers, never from monter', () => {
    const segments = [
      { start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }, // 8h in July
      { start: at(2026, 8, 2, 9), stop: null } // running, 1h so far in August
    ];
    const rows: MonterRow[] = [{ monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 8 }];
    const { months, openMonth, totalDone } = buildMonthlyLedger({
      rows,
      segments,
      hoursassinged: 20,
      now
    });

    expect(months.map((m) => m.key)).toEqual(['2026-08', '2026-07']); // newest first
    expect(openMonth?.hoursDone).toBeCloseTo(1, 6);
    expect(openMonth?.state).toBe('live');
    expect(months[1]).toMatchObject({ key: '2026-07', hoursDone: 8, state: 'filed' });
    expect(totalDone).toBeCloseTo(9, 6);
  });

  it('does not flag a difference too small to be shown', () => {
    // 8h to the millisecond, filed as the rounded 8.7-style figure the close wrote
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [
      { monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 8.001 }
    ];
    const { months } = buildMonthlyLedger({ rows, segments, now });
    expect(months.find((m) => m.key === '2026-07')?.state).toBe('filed');
  });

  it('flags a past month the timers disagree with', () => {
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [
      { monthStart: '2026-07-01', hours: 20, isDone: false, hoursDone: 0.5 }
    ];
    const { months } = buildMonthlyLedger({ rows, segments, now });
    const july = months.find((m) => m.key === '2026-07');

    expect(july).toMatchObject({ state: 'mismatch', hoursDone: 8, filed: 0.5, computed: 8 });
  });

  it('trusts an approved month over the timers', () => {
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [{ monthStart: '2026-07-01', hours: 20, isDone: true, hoursDone: 3 }];
    const { months } = buildMonthlyLedger({ rows, segments, now });
    const july = months.find((m) => m.key === '2026-07');

    expect(july).toMatchObject({ state: 'approved', hoursDone: 3, isDone: true });
  });

  it('marks a month no timer backs as unverified', () => {
    const rows: MonterRow[] = [{ monthStart: '2026-05-01', hours: 20, isDone: false, hoursDone: 7 }];
    const { months } = buildMonthlyLedger({ rows, segments: [], now });
    const may = months.find((m) => m.key === '2026-05');

    expect(may).toMatchObject({ state: 'unverified', hoursDone: 7, computed: 0 });
  });

  it('falls back to the counter for the open month of a timer-less mission', () => {
    const { openMonth } = buildMonthlyLedger({ rows: [], segments: [], counter: 4.5, now });
    expect(openMonth).toMatchObject({ key: '2026-08', hoursDone: 4.5, state: 'live' });
  });

  it('always includes the open month, even with nothing in it', () => {
    const { months, openMonth } = buildMonthlyLedger({ rows: [], segments: [], now });
    expect(months).toHaveLength(1);
    expect(openMonth).toMatchObject({ key: '2026-08', hoursDone: 0 });
  });

  it('takes the monthly plan from the row, and the mission assignment otherwise', () => {
    const segments = [{ start: at(2026, 7, 10, 9), stop: at(2026, 7, 10, 17) }];
    const rows: MonterRow[] = [{ monthStart: '2026-07-01', hours: 12, isDone: false, hoursDone: 8 }];
    const { months } = buildMonthlyLedger({ rows, segments, hoursassinged: 20, now });

    expect(months.find((m) => m.key === '2026-07')?.assigned).toBe(12);
    expect(months.find((m) => m.key === '2026-08')?.assigned).toBe(20);
  });
});
