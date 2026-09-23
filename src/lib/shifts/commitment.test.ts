import { describe, it, expect } from 'vitest';
import { commitmentOf } from './commitment';

const om = (isshift: boolean) => ({ data: [{ id: '1', attributes: { isshift } }] });

describe('commitmentOf', () => {
  it('returns the agreed commitment of a mission staffed in shifts', () => {
    expect(commitmentOf({ shiftsMin: 2, shiftsMax: '5', open_missions: om(true) })).toEqual({ min: 2, max: 5 });
  });
  it('returns an empty commitment, not null, when a shift mission has none yet', () => {
    expect(commitmentOf({ open_missions: om(true) })).toEqual({ min: null, max: null });
  });
  it('returns null for a mission that is not staffed in shifts — nothing to offer', () => {
    expect(commitmentOf({ shiftsMin: 2, open_missions: om(false) })).toBeNull();
    expect(commitmentOf({})).toBeNull();
    expect(commitmentOf(null)).toBeNull();
  });
});
