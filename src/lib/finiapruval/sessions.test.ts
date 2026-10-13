import { describe, it, expect } from 'vitest';
import { claimSessions, disputeNote, hoursClock, hoursWithout } from './sessions';
import { encodeCounter, parseCounter } from './rounds';

const iv = (start: string, stop: string | null) => ({ start, stop });

describe('hoursClock', () => {
  it('reads hours the way people say them', () => {
    expect(hoursClock(2.5)).toBe('2:30');
    expect(hoursClock(0.333333)).toBe('0:20');
    expect(hoursClock(10)).toBe('10:00');
    expect(hoursClock(undefined)).toBe('0:00');
  });
});

describe('claimSessions', () => {
  it('keeps closed sittings only, oldest first, in whole minutes', () => {
    const s = claimSessions([
      iv('2026-10-14T20:00:00Z', '2026-10-14T21:15:00Z'),
      iv('2026-10-13T09:10:00Z', '2026-10-13T11:40:00Z'),
      iv('2026-10-15T08:00:00Z', null),
      iv('2026-10-15T09:00:00Z', '2026-10-15T08:00:00Z')
    ]);
    expect(s.map((x) => x.hours)).toEqual([2.5, 1.25]);
    expect(s[0].start).toBe('2026-10-13T09:10:00Z');
  });

  it('nothing to show for a legacy approval with no timer', () => {
    expect(claimSessions(null)).toEqual([]);
  });
});

describe('a dispute is a counter', () => {
  const sessions = claimSessions([
    iv('2026-10-13T09:10:00Z', '2026-10-13T11:40:00Z'),
    iv('2026-10-14T20:00:00Z', '2026-10-14T21:15:00Z')
  ]);

  it('takes the disputed sittings off the hours', () => {
    expect(hoursWithout(sessions, [])).toBe(3.75);
    expect(hoursWithout(sessions, [1])).toBe(2.5);
    expect(hoursWithout(sessions, [0, 1])).toBe(0);
  });

  it('writes them under the member\'s own words, and survives the counter encoding', () => {
    const note = disputeNote('the evening was the same bug', sessions, [1], 'en-GB');
    const lines = note.split('\n');
    expect(lines[0]).toBe('the evening was the same bug');
    expect(lines[1]).toMatch(/^✗ .*\(1:15\)$/);
    expect(parseCounter(encodeCounter({ from: 3.75, to: 2.5, note }))?.note).toBe(note);
  });

  it('folds the sittings that do not fit the vote column into one line', () => {
    const many = claimSessions(
      Array.from({ length: 12 }, (_, d) =>
        iv(`2026-10-${String(d + 1).padStart(2, '0')}T09:00:00Z`, `2026-10-${String(d + 1).padStart(2, '0')}T10:00:00Z`)
      )
    );
    const all = many.map((_, i) => i);
    const note = disputeNote('none of these happened on this mission', many, all, 'en-GB');
    expect(note.length).toBeLessThanOrEqual(230);
    expect(note.split('\n').at(-1)).toMatch(/^✗ \+\d+ \(\d+:00\)$/);
  });

  it('no disputed sitting leaves the note as written', () => {
    expect(disputeNote('  only words  ', sessions, [], 'en-GB')).toBe('only words');
  });
});
