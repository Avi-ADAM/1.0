import { describe, it, expect } from 'vitest';
import { materialize, shiftHours, suggestHeadcount, validatePattern, weeklyStaffedHours } from './pattern';
import type { ShiftPattern } from './types';

const TZ = 'Asia/Jerusalem';
const week = (days: ShiftPattern['days'], extra: Partial<ShiftPattern> = {}): ShiftPattern => ({
  version: 1,
  days,
  ...extra
});
const run = (p: ShiftPattern, from: string, to: string) =>
  materialize(p, { planId: '9', timeZone: TZ, from, to });

describe('materialize', () => {
  it('turns a weekly pattern into one shift per window per matching day', () => {
    // 2026-09-27 is a Sunday.
    const p = week([{ dow: 0, windows: [{ start: '11:00', end: '15:00', need: 2 }, { start: '15:00', end: '19:00', need: 1 }] }]);
    const out = run(p, '2026-09-26T00:00:00Z', '2026-10-11T00:00:00Z');
    expect(out.map((s) => s.localDate)).toEqual(['2026-09-27', '2026-09-27', '2026-10-04', '2026-10-04']);
    expect(out[0]).toMatchObject({ need: 2, tafkidimId: null });
    // 11:00 in Jerusalem during summer time (UTC+3) is 08:00Z.
    expect(out[0].start).toBe('2026-09-27T08:00:00.000Z');
    expect(out[0].end).toBe('2026-09-27T12:00:00.000Z');
  });

  it('keys every instance by plan, start and role, so a re-run cannot double it', () => {
    const p = week([{ dow: 0, windows: [{ start: '11:00', end: '15:00', need: 1, tafkidimId: '4' }] }]);
    const a = run(p, '2026-09-26T00:00:00Z', '2026-10-04T00:00:00Z');
    const b = run(p, '2026-09-26T00:00:00Z', '2026-10-04T00:00:00Z');
    expect(a).toEqual(b);
    expect(a[0].slotKey).toBe('9|2026-09-27T08:00:00.000Z|4');
  });

  it('rolls a window that crosses midnight into the next day', () => {
    const p = week([{ dow: 1, windows: [{ start: '22:00', end: '02:00', need: 1 }] }]);
    const [s] = run(p, '2026-09-27T00:00:00Z', '2026-10-03T00:00:00Z');
    expect(s.localDate).toBe('2026-09-28');
    expect(shiftHours(s)).toBe(4);
  });

  it('is DST-correct: the spring-forward night is an hour shorter', () => {
    // Israel moves to summer time on Friday 27 March 2026 at 02:00 → 03:00.
    const p = week([{ dow: 5, windows: [{ start: '01:00', end: '05:00', need: 1 }, { start: '11:00', end: '15:00', need: 1 }] }]);
    const [night, day] = run(p, '2026-03-26T00:00:00Z', '2026-03-28T00:00:00Z');
    expect(shiftHours(night)).toBe(3);
    expect(shiftHours(day)).toBe(4);
  });

  it('is DST-correct: the fall-back night is an hour longer', () => {
    // Israel returns to winter time on Sunday 25 October 2026 at 02:00 → 01:00.
    const p = week([{ dow: 0, windows: [{ start: '00:00', end: '04:00', need: 1 }] }]);
    const [s] = run(p, '2026-10-24T00:00:00Z', '2026-10-26T00:00:00Z');
    expect(shiftHours(s)).toBe(5);
  });

  it('replaces a day entirely with its exception — including closing it', () => {
    const p = week([{ dow: 5, windows: [{ start: '09:00', end: '13:00', need: 1 }] }], {
      exceptions: [
        { date: '2026-10-02', windows: [] },
        { date: '2026-10-09', windows: [{ start: '10:00', end: '12:00', need: 3 }] }
      ]
    });
    const out = run(p, '2026-09-27T00:00:00Z', '2026-10-17T00:00:00Z');
    expect(out.map((s) => [s.localDate, s.need])).toEqual([
      ['2026-10-09', 3],
      ['2026-10-16', 1]
    ]);
  });

  it('follows a two-week cycle from its anchor', () => {
    const p = week(
      [
        { dow: 0, week: 0, windows: [{ start: '09:00', end: '10:00', need: 1 }] },
        { dow: 0, week: 1, windows: [{ start: '18:00', end: '19:00', need: 1 }] }
      ],
      { weeks: 2, anchor: '2026-09-27' }
    );
    const out = run(p, '2026-09-26T00:00:00Z', '2026-10-25T00:00:00Z');
    expect(out.map((s) => s.start.slice(11, 16))).toEqual(['06:00', '15:00', '06:00', '15:00']);
  });

  it('only returns shifts that start inside [from, to)', () => {
    const p = week([0, 1, 2, 3, 4, 5, 6].map((dow) => ({ dow, windows: [{ start: '12:00', end: '13:00', need: 1 }] })));
    const out = run(p, '2026-09-28T09:00:00Z', '2026-09-29T09:00:00Z');
    expect(out).toHaveLength(1);
    expect(out[0].start).toBe('2026-09-28T09:00:00.000Z');
  });

  it('skips invalid windows instead of failing the whole run', () => {
    const p = week([{ dow: 0, windows: [{ start: '25:00', end: '26:00', need: 1 }, { start: '11:00', end: '11:00', need: 1 }, { start: '11:00', end: '12:00', need: 0 }, { start: '12:00', end: '13:00', need: 1 }] }]);
    expect(run(p, '2026-09-26T00:00:00Z', '2026-10-03T00:00:00Z')).toHaveLength(1);
  });

  it('returns nothing for an empty or inverted range', () => {
    const p = week([{ dow: 0, windows: [{ start: '11:00', end: '12:00', need: 1 }] }]);
    expect(run(p, '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z')).toEqual([]);
    expect(run(p, '2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z')).toEqual([]);
  });
});

describe('validatePattern', () => {
  it('accepts a sound pattern', () => {
    expect(validatePattern(week([{ dow: 0, windows: [{ start: '11:00', end: '15:00', need: 2 }] }]))).toEqual([]);
  });

  it('names each problem by path and code', () => {
    const issues = validatePattern(
      week(
        [
          { dow: 7, windows: [{ start: '9:00', end: '10:00', need: 1 }] },
          { dow: 1, windows: [{ start: '10:00', end: '10:00', need: 0 }] },
          { dow: 2, windows: [{ start: '10:00', end: '11:00', need: 1 }, { start: '10:00', end: '12:00', need: 1 }] }
        ],
        { exceptions: [{ date: '2026-02-31', windows: [] }] }
      )
    );
    const codes = issues.map((i) => `${i.path}:${i.code}`);
    expect(codes).toContain('days[0].dow:badDow');
    expect(codes).toContain('days[0].windows[0].start:badTime');
    expect(codes).toContain('days[1].windows[0]:zeroLength');
    expect(codes).toContain('days[1].windows[0].need:badNeed');
    expect(codes).toContain('days[2].windows[1]:duplicate');
    expect(codes).toContain('exceptions[0].date:badDate');
  });

  it('allows the same start for different roles', () => {
    const p = week([{ dow: 2, windows: [{ start: '10:00', end: '11:00', need: 1, tafkidimId: '1' }, { start: '10:00', end: '11:00', need: 1, tafkidimId: '2' }] }]);
    expect(validatePattern(p)).toEqual([]);
  });

  it('requires a multi-week anchor to be a Sunday', () => {
    expect(validatePattern(week([], { weeks: 2, anchor: '2026-09-28' }))[0]).toMatchObject({ code: 'badAnchor' });
  });
});

describe('weeklyStaffedHours / suggestHeadcount', () => {
  // The worked example of §9.5: 4h×5 days of one person + 8h×2 days of one person = 36.
  const p = week([
    ...[0, 1, 2, 3, 4].map((dow) => ({ dow, windows: [{ start: '11:00', end: '15:00', need: 1 }] })),
    { dow: 5, windows: [{ start: '08:00', end: '16:00', need: 1 }] },
    { dow: 6, windows: [{ start: '08:00', end: '16:00', need: 1 }] }
  ]);

  it('sums window length × need', () => {
    expect(weeklyStaffedHours(p)).toBe(36);
  });

  it('suggests ceil(hours / hours per person)', () => {
    expect(suggestHeadcount(p, 12)).toBe(3);
    expect(suggestHeadcount(p, 10)).toBe(4);
    expect(suggestHeadcount(p, 36)).toBe(1);
  });

  it('never suggests fewer than one person', () => {
    expect(suggestHeadcount(week([]), 10)).toBe(1);
    expect(suggestHeadcount(p, 0)).toBe(1);
  });

  it('counts a night window across midnight and averages a two-week cycle', () => {
    const q = week(
      [
        { dow: 0, windows: [{ start: '22:00', end: '02:00', need: 2 }] },
        { dow: 1, week: 1, windows: [{ start: '10:00', end: '12:00', need: 1 }] }
      ],
      { weeks: 2, anchor: '2026-09-27' }
    );
    // Sunday night: 4h × 2 every week; Monday of week 1: 2h once per two weeks.
    expect(weeklyStaffedHours(q)).toBe(8 + 1);
  });
});
