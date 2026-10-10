import { describe, it, expect } from 'vitest';
import { formatWhen } from './formatWhen';

// Thursday 2026-10-08, 12:00 in Jerusalem (UTC+3). A fixed zone keeps the
// calendar-day rules deterministic whatever machine runs the suite.
const NOW = Date.parse('2026-10-08T09:00:00Z');
const TZ = { timeZone: 'Asia/Jerusalem' };
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatWhen', () => {
  it('returns null for anything that is not a date', () => {
    for (const bad of [null, undefined, '', 'not a date', {}, [], NaN]) {
      expect(formatWhen(bad, NOW, 'he', TZ)).toBeNull();
    }
  });

  it('under a minute reads "now"', () => {
    const w = formatWhen(ago(30_000), NOW, 'he', TZ)!;
    expect(w.mode).toBe('relative');
    expect(w.short).toBe('עכשיו');
    expect(formatWhen(ago(30_000), NOW, 'en', TZ)!.short).toBe('now');
  });

  it('under an hour counts minutes back', () => {
    const w = formatWhen(ago(12 * MIN), NOW, 'he', TZ)!;
    expect(w.mode).toBe('relative');
    expect(w.short).toContain('12');
    expect(w.short).toContain('לפני');
    expect(formatWhen(ago(12 * MIN), NOW, 'en', TZ)!.short).toMatch(/12 min.* ago/);
  });

  it('earlier today reads "today" with the clock time', () => {
    const w = formatWhen(ago(3 * HOUR), NOW, 'he', TZ)!;
    expect(w.mode).toBe('relative');
    expect(w.short.startsWith('היום')).toBe(true);
    expect(w.short).toContain('9:00');
  });

  it('the calendar day before reads "yesterday"', () => {
    const w = formatWhen('2026-10-07T15:00:00Z', NOW, 'he', TZ)!;
    expect(w.mode).toBe('relative');
    expect(w.short.startsWith('אתמול')).toBe(true);
    expect(w.short).toContain('18:00');
  });

  it('decides "today"/"yesterday" by the calendar, not by 24 hours', () => {
    // 00:10 on Oct 8 in Jerusalem.
    const justAfterMidnight = Date.parse('2026-10-07T21:10:00Z');
    // 23:40 the night before is 30 minutes ago — still minutes.
    expect(formatWhen('2026-10-07T20:40:00Z', justAfterMidnight, 'he', TZ)!.short).toContain('30');
    // 22:00 the night before is only 2h10m ago, but it was yesterday.
    expect(
      formatWhen('2026-10-07T19:00:00Z', justAfterMidnight, 'he', TZ)!.short.startsWith('אתמול')
    ).toBe(true);
  });

  it('within the week names the weekday', () => {
    const w = formatWhen(ago(3 * DAY), NOW, 'en', TZ)!;
    expect(w.mode).toBe('weekday');
    expect(w.short).toMatch(/^Mon/);
  });

  it('older this year gives the date without a year', () => {
    const w = formatWhen(ago(20 * DAY), NOW, 'en', TZ)!;
    expect(w.mode).toBe('date');
    expect(w.short).toBe('Sep 18');
  });

  it('a previous year carries the year', () => {
    const w = formatWhen('2025-03-02T10:00:00Z', NOW, 'he', TZ)!;
    expect(w.mode).toBe('date');
    expect(w.short).toContain('2025');
  });

  it('treats a little future as clock skew and a lot as a date', () => {
    expect(formatWhen(new Date(NOW + 2 * MIN), NOW, 'he', TZ)!.short).toBe('עכשיו');
    const far = formatWhen(new Date(NOW + 2 * DAY), NOW, 'en', TZ)!;
    expect(far.mode).toBe('date');
    expect(far.short).toBe('Oct 10');
  });

  it('always gives the full date and an ISO stamp', () => {
    const w = formatWhen('2026-10-06T11:30:00Z', NOW, 'he', TZ)!;
    expect(w.iso).toBe('2026-10-06T11:30:00.000Z');
    expect(w.full).toContain('2026');
    expect(w.full).toContain('14:30');
  });

  it('produces a phrase in every locale the site ships', () => {
    for (const locale of ['he', 'en', 'ar', 'ru', 'es']) {
      for (const at of [ago(5 * MIN), ago(3 * HOUR), ago(DAY), ago(4 * DAY), ago(40 * DAY)]) {
        const w = formatWhen(at, NOW, locale, TZ);
        expect(w, `${locale} ${at}`).not.toBeNull();
        expect(w!.short.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
