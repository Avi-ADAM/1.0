import { describe, it, expect } from 'vitest';
import { hasUnsavedTime, withoutSavedTimer } from './afterSave';

const sixHours = [
  { start: '2026-10-07T06:00:00.000Z', stop: '2026-10-07T12:39:00.000Z' }
];

function storeEntry(mId: string, attrs: Record<string, unknown>) {
  return {
    mId,
    running: false,
    zman: 6.65 * 3600000,
    missionName: 'm' + mId,
    attributes: {
      howmanyhoursalready: 3,
      activeTimer: { data: { id: '900', attributes: attrs } }
    }
  };
}

describe('hasUnsavedTime', () => {
  it('is true for logged intervals that were never saved', () => {
    expect(hasUnsavedTime({ saved: false, totalHours: 6.65, timers: sixHours })).toBe(true);
  });

  it('is false once the timer is saved, whatever it still lists', () => {
    expect(hasUnsavedTime({ saved: true, totalHours: 6.65, timers: sixHours })).toBe(false);
  });

  it('is false for an empty manual-entry timer (nothing to save yet)', () => {
    expect(hasUnsavedTime({ saved: false, totalHours: 0, timers: [] })).toBe(false);
  });

  it('is false with no timer on the mission', () => {
    expect(hasUnsavedTime(null)).toBe(false);
    expect(hasUnsavedTime(undefined)).toBe(false);
  });

  it('counts a legacy timer that has hours but no interval list', () => {
    expect(hasUnsavedTime({ saved: null, totalHours: 2, timers: null })).toBe(true);
  });
});

describe('withoutSavedTimer — the store after a successful timerSave', () => {
  it('takes the saved timer off its mission, so "finish" no longer finds unsaved time', () => {
    const list = [storeEntry('196', { saved: false, totalHours: 6.65, timers: sixHours })];
    expect(hasUnsavedTime(list[0].attributes.activeTimer.data.attributes)).toBe(true);

    const after = withoutSavedTimer(list, 196);
    expect(after[0].attributes.activeTimer.data).toBeNull();
    expect(after[0].running).toBe(false);
    expect(after[0].zman).toBe(0);
    expect(hasUnsavedTime(after[0].attributes.activeTimer.data?.attributes)).toBe(false);
  });

  it('keeps the rest of the mission entry (name, monthly counter)', () => {
    const [after] = withoutSavedTimer([storeEntry('196', { saved: false, timers: sixHours })], '196');
    expect(after.missionName).toBe('m196');
    expect(after.attributes.howmanyhoursalready).toBe(3);
  });

  it('leaves every other mission alone', () => {
    const other = storeEntry('197', { saved: false, totalHours: 1, timers: sixHours });
    const list = [storeEntry('196', { saved: false, timers: sixHours }), other];
    const after = withoutSavedTimer(list, '196');
    expect(after[1]).toBe(other);
  });

  it('copes with an entry that never had a timer', () => {
    const [after] = withoutSavedTimer([{ mId: 5, attributes: {} as Record<string, any> }], 5);
    expect(after.attributes?.activeTimer).toEqual({ data: null, isActive: false });
  });
});
