import { describe, expect, it } from 'vitest';
import {
  WISH_RESTIME_DEFAULT,
  lastSignedAt,
  normalizeRestime,
  proposalDeadline,
  restimeHours,
  restimeMs,
  silenceApplies
} from './restime.js';

describe('when silence starts to count', () => {
  it('never at first contact — only once the two sides are talking (a counter exists)', () => {
    expect(silenceApplies(0)).toBe(false); // the invitation / the volunteer's offer, unanswered
    expect(silenceApplies(1)).toBe(true);
    expect(silenceApplies(4)).toBe(true);
  });
});

describe('the pace of a wish', () => {
  it('is 48 hours unless its owner chose otherwise', () => {
    expect(WISH_RESTIME_DEFAULT).toBe('feh');
    expect(restimeHours(undefined)).toBe(48);
    expect(restimeHours(null)).toBe(48); // every wish that predates the field
    expect(restimeHours('feh')).toBe(48);
  });

  it('offers the same four values a rikma does', () => {
    expect(['feh', 'sth', 'nsh', 'sevend'].map(restimeHours)).toEqual([48, 72, 96, 168]);
    expect(restimeMs('sth')).toBe(72 * 3600_000);
  });

  it('reads anything it does not know as the default, never as "no clock"', () => {
    expect(normalizeRestime('weekly')).toBe('feh');
    expect(normalizeRestime('')).toBe('feh');
    expect(normalizeRestime(72)).toBe('feh');
    expect(normalizeRestime('nsh')).toBe('nsh');
  });
});

describe('when silence matures the version on the table', () => {
  const opened = '2026-10-01T10:00:00.000Z';

  it('counts from the last signature — and from the opening before any', () => {
    expect(lastSignedAt([], opened)).toBe(opened);
    expect(lastSignedAt(undefined, opened)).toBe(opened);
    expect(
      lastSignedAt([{ submittedAt: '2026-10-01T12:00:00.000Z' }, { submittedAt: '2026-10-02T09:30:00.000Z' }], opened)
    ).toBe('2026-10-02T09:30:00.000Z');
  });

  it('is the order of time, not of the array', () => {
    expect(lastSignedAt([{ submittedAt: '2026-10-03T00:00:00.000Z' }, { submittedAt: '2026-10-02T00:00:00.000Z' }], opened)).toBe(
      '2026-10-03T00:00:00.000Z'
    );
  });

  it('ignores a signature with no usable time, and says null when nothing is known', () => {
    expect(lastSignedAt([{ submittedAt: 'not a date' }, { submittedAt: null }], opened)).toBe(opened);
    expect(lastSignedAt([], null)).toBeNull();
    expect(lastSignedAt([], 'nonsense')).toBeNull();
  });

  it('is the signature plus the wish’s own pace', () => {
    expect(proposalDeadline(opened, undefined)).toBe('2026-10-03T10:00:00.000Z'); // 48 h
    expect(proposalDeadline(opened, 'sevend')).toBe('2026-10-08T10:00:00.000Z');
    expect(proposalDeadline(null, 'feh')).toBeNull();
    expect(proposalDeadline('garbage', 'feh')).toBeNull();
  });
});
