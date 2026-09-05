import { describe, it, expect } from 'vitest';
import { grantQuantity, grantRange } from './grantBooking.js';

const NOW = new Date('2026-04-10T00:00:00Z');

describe('grantRange — what a grant occupies', () => {
  it('uses the scheduled window when there is one', () => {
    expect(
      grantRange({ kindOf: 'rent', sqadualed: '2026-05-01T00:00:00Z', sqadualedf: '2026-05-10T00:00:00Z' }, NOW)
    ).toEqual({ start: new Date('2026-05-01T00:00:00Z'), end: new Date('2026-05-10T00:00:00Z') });
  });

  it('a recurring resource with no end is open-ended', () => {
    // Capping it at, say, a year would quietly free a resource that is still out.
    const range = grantRange({ kindOf: 'monthly', sqadualed: '2026-05-01T00:00:00Z', recurring: true }, NOW);
    expect(range.end).toBeNull();
  });

  it('a consumable is open-ended too — it never comes back', () => {
    expect(grantRange({ kindOf: 'total' }, NOW)).toEqual({ start: NOW, end: null });
  });

  it('falls back to now rather than refusing to record the grant', () => {
    // The resource is out either way. Dropping the row would understate
    // occupancy, which is the failure that actually hurts.
    expect(grantRange({ kindOf: 'rent' }, NOW).start).toEqual(NOW);
    expect(grantRange({ kindOf: 'rent', sqadualed: 'not-a-date' }, NOW).start).toEqual(NOW);
  });

  it('ignores an end that is not after the start', () => {
    const range = grantRange(
      { sqadualed: '2026-05-10T00:00:00Z', sqadualedf: '2026-05-01T00:00:00Z' },
      NOW
    );
    expect(range.end).toBeNull();
    expect(range.start).toEqual(new Date('2026-05-10T00:00:00Z'));
  });

  it('ignores an unparseable end', () => {
    expect(grantRange({ sqadualed: '2026-05-01T00:00:00Z', sqadualedf: 'soon' }, NOW).end).toBeNull();
  });
});

describe('grantQuantity', () => {
  it('takes `hm` units for a pool', () => {
    expect(grantQuantity({ kindOf: 'perUnit', hm: 6 })).toBe(6);
    expect(grantQuantity({ kindOf: 'perUnit', hm: '6' })).toBe(6);
  });

  it('takes exactly one of anything else, whatever hm says', () => {
    // `hm` doubles as a period count on time-based kinds, so reading it as a
    // quantity there would book six vans for a six-month rental.
    expect(grantQuantity({ kindOf: 'monthly', hm: 6 })).toBe(1);
    expect(grantQuantity({ kindOf: 'rent', hm: 6 })).toBe(1);
    expect(grantQuantity({ kindOf: 'total', hm: 6 })).toBe(1);
  });

  it('falls back to one for a missing or nonsense quantity', () => {
    expect(grantQuantity({ kindOf: 'perUnit' })).toBe(1);
    expect(grantQuantity({ kindOf: 'perUnit', hm: 0 })).toBe(1);
    expect(grantQuantity({ kindOf: 'perUnit', hm: -3 })).toBe(1);
    expect(grantQuantity({ kindOf: 'perUnit', hm: 'many' })).toBe(1);
  });
});
