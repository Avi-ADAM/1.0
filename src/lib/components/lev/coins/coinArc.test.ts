import { describe, it, expect } from 'vitest';
import {
  coinArc,
  coinWindowMs,
  RESTIME_HOURS,
  FALLBACK_WINDOW_HOURS
} from './coinArc.js';

const HOUR = 3_600_000;

describe('coinWindowMs', () => {
  it('reads the restime enum', () => {
    for (const [key, hours] of Object.entries(RESTIME_HOURS)) {
      expect(coinWindowMs({ restime: key })).toBe(hours * HOUR);
    }
  });

  it('accepts a plain number of hours, which older processors pass', () => {
    expect(coinWindowMs({ restime: 12 })).toBe(12 * HOUR);
    expect(coinWindowMs({ restime: '12' })).toBe(12 * HOUR);
  });

  it('falls back to the longest restime, never the shortest', () => {
    const fallback = FALLBACK_WINDOW_HOURS * HOUR;
    expect(coinWindowMs({})).toBe(fallback);
    expect(coinWindowMs(null)).toBe(fallback);
    expect(coinWindowMs({ restime: 'nonsense' })).toBe(fallback);
    expect(coinWindowMs({ restime: 0 })).toBe(fallback);
    expect(coinWindowMs({ restime: -5 })).toBe(fallback);
    expect(fallback).toBe(Math.max(...Object.values(RESTIME_HOURS)) * HOUR);
  });
});

describe('coinArc', () => {
  it('is null when the item has no clock — an undated coin is not an expired one', () => {
    expect(coinArc({ restime: 'sth' }, null)).toBe(null);
    expect(coinArc({}, Number.NaN)).toBe(null);
  });

  it('is 1 at the start of the window and 0 at the deadline', () => {
    const item = { restime: 'sth' }; // 72h
    expect(coinArc(item, 72 * HOUR)).toBe(1);
    expect(coinArc(item, 0)).toBe(0);
  });

  it('is the fraction of the window still to run', () => {
    const item = { restime: 'feh' }; // 48h
    expect(coinArc(item, 24 * HOUR)).toBeCloseTo(0.5, 10);
    expect(coinArc(item, 12 * HOUR)).toBeCloseTo(0.25, 10);
  });

  it('clamps rather than overflowing: a deadline further out than the window is a full ring', () => {
    expect(coinArc({ restime: 'feh' }, 500 * HOUR)).toBe(1);
  });

  it('clamps a passed deadline to empty, not to a negative arc', () => {
    expect(coinArc({ restime: 'feh' }, -10 * HOUR)).toBe(0);
  });

  it('never increases as time runs out', () => {
    const item = { restime: 'sevend' };
    let prev = 2;
    for (let h = 200; h >= -10; h -= 1) {
      const v = coinArc(item, h * HOUR);
      expect(v).not.toBe(null);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v!;
    }
  });
});
