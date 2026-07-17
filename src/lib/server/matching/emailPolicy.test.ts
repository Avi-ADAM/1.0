import { describe, it, expect } from 'vitest';
import {
  isWithinSendWindow,
  underDailyCap,
  capWindowStartIso,
  MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY,
  CAP_WINDOW_HOURS
} from './emailPolicy';

describe('isWithinSendWindow (Asia/Jerusalem)', () => {
  // Winter (IST = UTC+2): 06:00 UTC → 08:00 local, 19:30 UTC → 21:30 local
  it('08:00 local is inside the window', () => {
    expect(isWithinSendWindow(new Date('2026-01-15T06:00:00Z'))).toBe(true);
  });
  it('21:30 local is outside the window', () => {
    expect(isWithinSendWindow(new Date('2026-01-15T19:30:00Z'))).toBe(false);
  });
  it('03:00 local (night) is outside the window', () => {
    expect(isWithinSendWindow(new Date('2026-01-15T01:00:00Z'))).toBe(false);
  });
  // Summer (IDT = UTC+3): 07:00 UTC → 10:00 local
  it('10:00 local in summer is inside the window', () => {
    expect(isWithinSendWindow(new Date('2026-07-15T07:00:00Z'))).toBe(true);
  });
  it('23:00 local in summer is outside the window', () => {
    expect(isWithinSendWindow(new Date('2026-07-15T20:00:00Z'))).toBe(false);
  });
});

describe('underDailyCap', () => {
  it('allows below the cap and blocks at the cap', () => {
    expect(underDailyCap(0)).toBe(true);
    expect(underDailyCap(MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY - 1)).toBe(true);
    expect(underDailyCap(MAX_SUGGESTION_EMAILS_PER_USER_PER_DAY)).toBe(false);
  });
});

describe('capWindowStartIso', () => {
  it('is exactly the window size in the past', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const start = new Date(capWindowStartIso(now));
    expect(now.getTime() - start.getTime()).toBe(CAP_WINDOW_HOURS * 60 * 60 * 1000);
  });
});
