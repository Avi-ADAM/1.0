import { describe, it, expect } from 'vitest';
import { describeShiftError, shiftError, shiftErrorKey, SHIFT_ERROR_CODES } from './errors';
import he from '$lib/translations/he/shifts.json';

describe('shift error codes', () => {
  it('maps every coded refusal to its translation key', () => {
    expect(shiftErrorKey(shiftError('clash').message)).toBe('shifts.error.clash');
    expect(shiftErrorKey('Action failed: swap:alreadyThere')).toBe('shifts.swap.problem.alreadyThere');
    expect(shiftErrorKey('rules:emptyRange:2')).toBe('shifts.rules.issue.emptyRange');
    expect(shiftErrorKey('Timer already saved')).toBeNull();
    expect(shiftErrorKey('shift:nonsense')).toBeNull();
  });

  it('every code has words in the base locale', () => {
    for (const code of SHIFT_ERROR_CODES) expect((he as any).error?.[code], code).toBeTruthy();
  });

  it('falls back to the server text when uncoded, and to the generic line when untranslated', () => {
    const t = (k: string) => (k === 'shifts.error.clash' ? 'חפיפה' : k);
    expect(describeShiftError('shift:clash', t, 'שגיאה')).toBe('חפיפה');
    expect(describeShiftError('shift:started', t, 'שגיאה')).toBe('שגיאה');
    expect(describeShiftError('Timer already saved', t, 'שגיאה')).toBe('Timer already saved');
    expect(describeShiftError('', t, 'שגיאה')).toBe('שגיאה');
  });
});
