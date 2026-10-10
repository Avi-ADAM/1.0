import { describe, expect, it } from 'vitest';
import { isFinishApproval, isHoursApproval } from './kind';

describe('finiapruval kind', () => {
  it('a completeMission approval (no hours signal) is a finish', () => {
    const attrs = { isTimerSave: null, iskvua: null, month: null, timer: { data: null } };
    expect(isFinishApproval(attrs)).toBe(true);
    expect(isHoursApproval(attrs)).toBe(false);
  });

  it('a timer save is hours', () => {
    expect(isHoursApproval({ isTimerSave: true })).toBe(true);
    expect(isFinishApproval({ isTimerSave: true })).toBe(false);
  });

  it('a pre-2026-05 monthly approval (iskvua + month, no isTimerSave) is hours', () => {
    expect(isHoursApproval({ isTimerSave: null, iskvua: true, month: '2026-04-01' })).toBe(true);
    expect(isHoursApproval({ month: '2026-04-01' })).toBe(true);
  });

  it('an approval linked to a timer is hours even without the flag', () => {
    expect(isHoursApproval({ timer: { data: { id: '42' } } })).toBe(true);
  });

  it('nothing to read is neither', () => {
    expect(isHoursApproval(null)).toBe(false);
    expect(isFinishApproval(undefined)).toBe(false);
  });
});
