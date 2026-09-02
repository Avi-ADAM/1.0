import { describe, it, expect } from 'vitest';
import { cycleLabel } from './cycleLabel.js';

describe('cycleLabel', () => {
  it('names the month when the window is a whole calendar month', () => {
    const label = cycleLabel('2026-03-01T00:00:00.000Z', '2026-03-31T23:59:59.999Z', 'en');
    expect(label).toBe('March 2026');
  });

  it('names it in the reader’s own language', () => {
    const label = cycleLabel('2026-03-01T00:00:00.000Z', '2026-03-31T23:59:59.999Z', 'he');
    expect(label).toContain('2026');
    expect(label).not.toContain('March');
  });

  it('shows the real dates for a partial window', () => {
    // A pledge that started mid-month, or a second settlement in one month:
    // saying "March" would claim the payment covers work it does not.
    const label = cycleLabel('2026-03-15T09:00:00.000Z', '2026-03-31T23:59:59.999Z', 'en');
    expect(label).toContain('–');
    expect(label).toMatch(/15/);
    expect(label).toMatch(/31/);
  });

  it('is empty when there is no window to name', () => {
    expect(cycleLabel(null, null)).toBe('');
    expect(cycleLabel(undefined, '')).toBe('');
  });

  it('survives an unparseable date rather than throwing', () => {
    expect(cycleLabel('not-a-date', 'also-not')).toBe('');
  });
});
