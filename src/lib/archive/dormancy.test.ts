import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DORMANCY_DAYS,
  dormancyDeadline,
  effectiveDormancyDays,
  hasAccruedValue,
  isDormant,
} from './dormancy.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-01T12:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();

describe('effectiveDormancyDays', () => {
  it('prefers the object over the rikma, and the rikma over the default', () => {
    expect(effectiveDormancyDays(3, 14)).toBe(3);
    expect(effectiveDormancyDays(null, 14)).toBe(14);
    expect(effectiveDormancyDays(null, null)).toBe(DEFAULT_DORMANCY_DAYS);
  });

  it('accepts the numeric strings GraphQL hands back', () => {
    expect(effectiveDormancyDays('7', null)).toBe(7);
  });

  it('falls through values that cannot be a period', () => {
    expect(effectiveDormancyDays(0, 14)).toBe(14);
    expect(effectiveDormancyDays(-5, null)).toBe(DEFAULT_DORMANCY_DAYS);
    expect(effectiveDormancyDays('soon', 14)).toBe(14);
  });
});

describe('dormancyDeadline', () => {
  it('is the last activity plus the period', () => {
    expect(dormancyDeadline('2026-06-01T00:00:00.000Z', 3).toISOString()).toBe(
      '2026-06-04T00:00:00.000Z',
    );
  });
});

describe('isDormant', () => {
  const idle = { lastActivityAt: daysAgo(40) };

  it('is true only once the period has actually run out', () => {
    expect(isDormant(idle, 30, NOW)).toBe(true);
    expect(isDormant({ lastActivityAt: daysAgo(29) }, 30, NOW)).toBe(false);
  });

  it('respects a tighter per-mission period', () => {
    const twoDaysIdle = { lastActivityAt: daysAgo(2) };
    expect(isDormant(twoDaysIdle, 30, NOW)).toBe(false);
    expect(isDormant(twoDaysIdle, 1, NOW)).toBe(true);
  });

  it('is false the moment any value accrued — that is a settlement, not a cleanup', () => {
    expect(isDormant({ ...idle, hoursAlready: 4 }, 30, NOW)).toBe(false);
    expect(isDormant({ ...idle, finnishedMissionCount: 1 }, 30, NOW)).toBe(false);
  });

  it('is false while a timer runs, however stale the dates look', () => {
    expect(isDormant({ ...idle, hasActiveTimer: true }, 30, NOW)).toBe(false);
  });

  it('is false when there is no activity date to measure from', () => {
    expect(isDormant({ lastActivityAt: null }, 30, NOW)).toBe(false);
  });
});

describe('hasAccruedValue', () => {
  it('separates "nothing happened here" from "someone worked"', () => {
    expect(hasAccruedValue({ hoursAlready: 0, finnishedMissionCount: 0 })).toBe(false);
    expect(hasAccruedValue({ hoursAlready: 0.5 })).toBe(true);
    expect(hasAccruedValue({ finnishedMissionCount: 2 })).toBe(true);
  });
});
