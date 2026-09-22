/**
 * Tests for the smaller shift modules: balance, settings, coverage, explain.
 * The pattern, quota and draft modules have their own files.
 */
import { describe, it, expect } from 'vitest';
import { carryOver, placesTaken } from './balance';
import { cycleContaining, cyclesBetween, phaseAt, resolveSettings, SHIFT_DEFAULTS } from './settings';
import { coverageOf, headroom, holesIn, nextInLine, upcomingFor } from './coverage';
import { explainQuota, nextStance, reasonKey } from './explain';
import { computeQuotas } from './quota';
import type { AssignmentLike, ShiftLike } from './types';

const row = (shiftId: string, userId: string, rank: number, state: AssignmentLike['state'] = 'confirmed'): AssignmentLike => ({
  shiftId,
  userId,
  rank,
  state
});

describe('balance', () => {
  it('counts only standing rank-1 places', () => {
    expect(
      placesTaken([row('a', 'ron', 1), row('b', 'ron', 1, 'released'), row('c', 'ron', 2), row('d', 'dana', 1, 'done')])
    ).toEqual({ ron: 1, dana: 1 });
  });

  it('carries the difference from quota, fading with age', () => {
    const c = carryOver(
      [
        { closedAt: '2026-09-20T00:00:00Z', quotas: { ron: 2, dana: 2 }, assignments: [row('a', 'ron', 1), row('b', 'ron', 1), row('c', 'ron', 1), row('d', 'dana', 1)] },
        { closedAt: '2026-09-13T00:00:00Z', quotas: { ron: 2, dana: 2 }, assignments: [row('a', 'dana', 1), row('b', 'dana', 1), row('c', 'dana', 1), row('d', 'ron', 1)] }
      ],
      0.5
    );
    // Latest: ron +1, dana −1 (weight 1). Before: ron −1, dana +1 (weight ½).
    expect(c).toEqual({ ron: 0.5, dana: -0.5 });
  });

  it('a decay of 0 remembers only the last cycle', () => {
    const c = carryOver(
      [
        { closedAt: '2026-09-20T00:00:00Z', quotas: { ron: 1 }, assignments: [row('a', 'ron', 1)] },
        { closedAt: '2026-09-13T00:00:00Z', quotas: { ron: 1 }, assignments: [row('a', 'ron', 1), row('b', 'ron', 1)] }
      ],
      0
    );
    expect(c).toEqual({ ron: 0 });
  });

  it('feeds back: whoever took more gets less next time', () => {
    const carry = carryOver([{ closedAt: '2026-09-20T00:00:00Z', quotas: { ron: 1, dana: 1 }, assignments: [row('a', 'ron', 1), row('b', 'ron', 1)] }]);
    const q = computeQuotas(2, [
      { userId: 'ron', available: 5, carry: carry.ron },
      { userId: 'dana', available: 5, carry: carry.dana }
    ]);
    expect(q.quotas).toEqual({ ron: 0, dana: 2 });
  });
});

describe('settings', () => {
  it('inherits plan → project → constant', () => {
    expect(resolveSettings({}, {}).cycleDays).toBe(SHIFT_DEFAULTS.cycleDays);
    expect(resolveSettings({}, { shiftCycleDays: 14 }).cycleDays).toBe(14);
    expect(resolveSettings({ cycleDays: 3 }, { shiftCycleDays: 14 }).cycleDays).toBe(3);
  });

  it('never lets the objection window run past the start of the cycle', () => {
    expect(resolveSettings({ closeOffsetHours: 12, draftWindowHours: 48 }).draftWindowHours).toBe(12);
  });

  it('aligns weekly cycles to Sunday local midnight', () => {
    const s = resolveSettings();
    // Wednesday 30 Sep 2026, 15:00 Jerusalem.
    const c = cycleContaining('9', '2026-09-30T12:00:00Z', s);
    // Sunday 27 Sep 00:00 Jerusalem (UTC+3) = 26 Sep 21:00Z.
    expect(c.start).toBe('2026-09-26T21:00:00.000Z');
    expect(c.end).toBe('2026-10-03T21:00:00.000Z');
    expect(c.periodKey).toBe('9|2026-09-26T21:00:00.000Z');
    // Draft 48h before the start, objections for 24h.
    expect(c.draftAt).toBe('2026-09-24T21:00:00.000Z');
    expect(c.closesAt).toBe('2026-09-25T21:00:00.000Z');
  });

  it('keeps cycles at local midnight across the DST change', () => {
    const cycles = cyclesBetween('9', '2026-10-20T00:00:00Z', '2026-11-05T00:00:00Z', resolveSettings());
    // Sunday 25 Oct starts in summer time... and the change happens that night.
    expect(cycles.map((c) => c.start)).toEqual([
      '2026-10-17T21:00:00.000Z',
      '2026-10-24T21:00:00.000Z',
      '2026-10-31T22:00:00.000Z'
    ]);
    for (let i = 1; i < cycles.length; i++) expect(cycles[i].start).toBe(cycles[i - 1].end);
  });

  it('names the phase of a cycle at any moment', () => {
    const c = cycleContaining('9', '2026-09-30T12:00:00Z', resolveSettings());
    expect(phaseAt(c, '2026-08-01T00:00:00Z')).toBe('upcoming');
    expect(phaseAt(c, '2026-09-20T00:00:00Z')).toBe('declaring');
    expect(phaseAt(c, '2026-09-25T00:00:00Z')).toBe('draft');
    expect(phaseAt(c, '2026-09-26T12:00:00Z')).toBe('closed');
    expect(phaseAt(c, '2026-09-30T12:00:00Z')).toBe('running');
    expect(phaseAt(c, '2026-10-10T00:00:00Z')).toBe('past');
  });
});

describe('coverage', () => {
  const s: ShiftLike = { id: 'a', start: '2026-10-04T08:00:00Z', end: '2026-10-04T12:00:00Z', need: 2 };

  it('reports who is coming, the chain, and what is missing', () => {
    const cov = coverageOf(s, [row('a', 'ron', 1), row('a', 'dana', 1, 'released'), row('a', 'yoav', 3), row('a', 'tal', 2)]);
    expect(cov.coming.map((x) => x.userId)).toEqual(['ron']);
    expect(cov.backups.map((x) => x.userId)).toEqual(['tal', 'yoav']);
    expect(cov).toMatchObject({ missing: 1, status: 'short' });
  });

  it('asks the next backup who has not been asked yet', () => {
    const cov = coverageOf(s, [row('a', 'ron', 1), row('a', 'tal', 2), row('a', 'yoav', 3)]);
    expect(nextInLine(cov)?.userId).toBe('tal');
    expect(nextInLine(cov, ['tal'])?.userId).toBe('yoav');
    expect(nextInLine(cov, ['tal', 'yoav'])).toBeNull();
  });

  it('lists holes earliest first and skips cancelled shifts', () => {
    const b: ShiftLike = { id: 'b', start: '2026-10-03T08:00:00Z', end: '2026-10-03T12:00:00Z', need: 1 };
    const x: ShiftLike = { id: 'x', start: '2026-10-01T08:00:00Z', end: '2026-10-01T12:00:00Z', need: 1, state: 'cancelled' };
    expect(holesIn([s, b, x], [row('a', 'ron', 1)]).map((h) => h.shiftId)).toEqual(['b', 'a']);
  });

  it('shows a member their coming shifts, with backups flagged', () => {
    const b: ShiftLike = { id: 'b', start: '2026-10-05T08:00:00Z', end: '2026-10-05T12:00:00Z', need: 1 };
    const past: ShiftLike = { id: 'p', start: '2026-09-01T08:00:00Z', end: '2026-09-01T12:00:00Z', need: 1 };
    const up = upcomingFor('ron', [s, b, past], [row('a', 'ron', 1), row('b', 'ron', 2), row('p', 'ron', 1)], '2026-10-01T00:00:00Z');
    expect(up.map((u) => [u.shift.id, u.rank])).toEqual([['a', 1], ['b', 2]]);
  });

  it('puts the members with the most spare commitment first on the hole card', () => {
    expect(headroom([{ userId: 'ron', max: 7 }, { userId: 'dana', max: 2 }, { userId: 'yoav', max: 3 }], { ron: 4, dana: 2, yoav: 1 })).toEqual([
      { userId: 'ron', spare: 3 },
      { userId: 'yoav', spare: 2 }
    ]);
  });
});

describe('explain', () => {
  it('maps codes to keys, and an unknown one to the neutral tie-break', () => {
    expect(reasonKey('wanted')).toBe('shifts.reason.wanted');
    expect(reasonKey('nonsense')).toBe('shifts.reason.tieBreak');
  });

  it('cycles the stance on each tap, back to empty', () => {
    expect([nextStance(null), nextStance('want'), nextStance('can'), nextStance('ifNeeded'), nextStance('cannot')]).toEqual([
      'want',
      'can',
      'ifNeeded',
      'cannot',
      null
    ]);
  });

  it('says a quota was capped only when the cap actually moved it', () => {
    const q = computeQuotas(10, [
      { userId: 'a', available: 9, max: 2 },
      { userId: 'b', available: 9 },
      { userId: 'c', available: 9 }
    ]);
    const ex = (u: string, max?: number) =>
      explainQuota({ quota: q.quotas[u], ...q.bounds[u], level: q.level, max, available: 9, belowMin: q.belowMin.includes(u) });
    expect(ex('a', 2)).toBe('cappedByMax');
    expect(ex('b')).toBe('equalShare');
  });

  it('says a quota was raised to the minimum only when it was', () => {
    const q = computeQuotas(10, [
      { userId: 'a', available: 9, min: 7 },
      { userId: 'b', available: 9, min: 1 },
      { userId: 'c', available: 9 }
    ]);
    const ex = (u: string) => explainQuota({ quota: q.quotas[u], ...q.bounds[u], level: q.level, available: 9, belowMin: false });
    expect(ex('a')).toBe('raisedToMin');
    // b's minimum of 1 is below the equal share — it did not move her.
    expect(ex('b')).toBe('equalShare');
  });
});
