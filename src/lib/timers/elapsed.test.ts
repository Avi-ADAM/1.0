import { describe, it, expect } from 'vitest';
import { runningStartMs, elapsedMs, hoursDone, formatClock } from './elapsed.js';

/** A store row shaped the way `stores/timers.js` builds one. */
function row({
  running = false,
  totalHours = 0,
  segments = [] as Array<{ start: string; stop: string | null }>,
  already = 0
} = {}) {
  return {
    mId: 7,
    running,
    attributes: {
      howmanyhoursalready: already,
      activeTimer: { data: { id: 1, attributes: { totalHours, timers: segments } } }
    }
  };
}

const T0 = Date.parse('2026-01-01T10:00:00.000Z');

describe('runningStartMs', () => {
  it('is null while the timer is stopped, even with closed segments on it', () => {
    const t = row({
      totalHours: 2,
      segments: [{ start: '2026-01-01T08:00:00.000Z', stop: '2026-01-01T10:00:00.000Z' }]
    });
    expect(runningStartMs(t)).toBeNull();
  });

  it('is the last segment\'s start while running', () => {
    const t = row({
      running: true,
      segments: [
        { start: '2026-01-01T08:00:00.000Z', stop: '2026-01-01T09:00:00.000Z' },
        { start: '2026-01-01T09:30:00.000Z', stop: null }
      ]
    });
    expect(runningStartMs(t)).toBe(Date.parse('2026-01-01T09:30:00.000Z'));
  });

  it('survives a record with no active timer at all', () => {
    expect(runningStartMs({ running: true, attributes: {} })).toBeNull();
    expect(runningStartMs(undefined)).toBeNull();
  });
});

describe('elapsedMs', () => {
  // `totalHours` is HOURS (calculateTotalHours divides down to them) and it
  // holds only the CLOSED segments — the running one is the delta added here.
  it('is the banked hours while stopped, whatever `now` is', () => {
    expect(elapsedMs(row({ totalHours: 1.5 }), T0)).toBe(1.5 * 3600000);
  });

  it('adds the segment in flight to the banked hours', () => {
    const t = row({
      running: true,
      totalHours: 1,
      segments: [{ start: '2026-01-01T09:30:00.000Z', stop: null }]
    });
    // one banked hour + the half hour running since 09:30
    expect(elapsedMs(t, T0)).toBe(1.5 * 3600000);
  });

  it('never goes negative when a clock skews behind the segment start', () => {
    const t = row({
      running: true,
      segments: [{ start: '2026-01-01T10:05:00.000Z', stop: null }]
    });
    expect(elapsedMs(t, T0)).toBe(0);
  });
});

describe('hoursDone', () => {
  it('counts previously approved hours alongside the live timer', () => {
    const t = row({ totalHours: 2, already: 5 });
    expect(hoursDone(t, T0)).toBe(7);
  });
});

describe('formatClock', () => {
  it('zero-pads every field', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(61_000)).toBe('00:01:01');
  });

  it('lets the hours run past 24 rather than wrapping', () => {
    expect(formatClock(26 * 3600000 + 61_000)).toBe('26:01:01');
  });

  it('clamps a negative to zero instead of printing a minus', () => {
    expect(formatClock(-5000)).toBe('00:00:00');
  });
});
