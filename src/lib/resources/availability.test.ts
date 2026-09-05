import { describe, it, expect } from 'vitest';
import {
  capacityOf,
  checkAvailability,
  conflictingHolds,
  deriveAvailability,
  freeWindows,
  hasFutureAvailability,
  isHolding,
  nextFreeFrom,
  overlapDays,
  overlaps,
  peakBookedQuantity,
  rangeDays,
  roundToGranularity,
  usageProfile
} from './availability.js';
import type { BookingLike, ResourceLike } from './types.js';

const d = (iso: string) => new Date(iso);
const range = (s: string, e: string | null) => ({ start: d(s), end: e == null ? null : d(e) });

/** A booking that holds, unless overridden. */
function booking(s: string, e: string | null, over: Partial<BookingLike> = {}): BookingLike {
  return { id: over.id ?? `${s}→${e}`, start: s, end: e, status: 'confirmed', ...over };
}

const projector: ResourceLike = { id: '1', kindOf: 'rent' };
const chairs: ResourceLike = { id: '2', kindOf: 'perUnit', capacity: 10 };
const template: ResourceLike = { id: '3', kindOf: 'total', availability: 'unlimited' };

describe('deriveAvailability — null is legacy, and legacy must not change behaviour', () => {
  it('reads the explicit field when it is set', () => {
    expect(deriveAvailability({ kindOf: 'rent', availability: 'unlimited' })).toBe('unlimited');
  });

  it.each([
    ['rent', 'exclusive'],
    ['monthly', 'exclusive'],
    ['yearly', 'exclusive'],
    ['perUnit', 'pooled'],
    ['total', 'consumable']
  ] as const)('derives %s → %s while the field is null', (kindOf, expected) => {
    expect(deriveAvailability({ kindOf })).toBe(expected);
  });

  it('never promotes `total` to unlimited on its own', () => {
    // The whole migration rests on this: a resource recorded as one-time stays
    // one-time until its holder says otherwise.
    expect(deriveAvailability({ kindOf: 'total' })).toBe('consumable');
  });

  it('falls back to consumable for an unknown or missing kind', () => {
    expect(deriveAvailability({ kindOf: 'something-else' })).toBe('consumable');
    expect(deriveAvailability(null)).toBe('consumable');
  });
});

describe('capacityOf', () => {
  it('is 1 for exclusive, whatever `capacity` says', () => {
    expect(capacityOf({ kindOf: 'rent', capacity: 7 })).toBe(1);
  });

  it('reads capacity, then the legacy hm, then 1', () => {
    expect(capacityOf({ kindOf: 'perUnit', capacity: 10 })).toBe(10);
    expect(capacityOf({ kindOf: 'perUnit', hm: 4 })).toBe(4);
    expect(capacityOf({ kindOf: 'perUnit' })).toBe(1);
  });

  it('is Infinity for unlimited', () => {
    expect(capacityOf(template)).toBe(Infinity);
  });
});

describe('overlaps — half-open ranges', () => {
  it('touching edges do not overlap', () => {
    expect(overlaps(range('2026-04-01', '2026-04-10'), range('2026-04-10', '2026-04-20'))).toBe(false);
  });

  it('a shared interior instant does', () => {
    expect(overlaps(range('2026-04-01', '2026-04-11'), range('2026-04-10', '2026-04-20'))).toBe(true);
  });

  it('an open-ended booking swallows everything after its start', () => {
    expect(overlaps(range('2030-01-01', '2030-02-01'), range('2026-04-01', null))).toBe(true);
  });

  it('leadTimeHours turns a gap into an overlap', () => {
    const a = range('2026-04-10T12:00:00Z', '2026-04-12T12:00:00Z');
    const b = range('2026-04-08T12:00:00Z', '2026-04-10T06:00:00Z');
    expect(overlaps(a, b)).toBe(false);
    expect(overlaps(a, b, 12)).toBe(true);
  });

  it('overlapDays counts the shared span', () => {
    expect(overlapDays(range('2026-04-01', '2026-04-11'), range('2026-04-06', '2026-04-20'))).toBe(5);
    expect(rangeDays(range('2026-04-01', '2026-04-11'))).toBe(10);
    expect(rangeDays(range('2026-04-01', null))).toBe(Infinity);
  });
});

describe('isHolding — a lapsed hold holds nothing', () => {
  const now = d('2026-04-10T00:00:00Z');

  it('confirmed and active hold', () => {
    expect(isHolding(booking('2026-04-01', '2026-04-20', { status: 'confirmed' }), now)).toBe(true);
    expect(isHolding(booking('2026-04-01', '2026-04-20', { status: 'active' }), now)).toBe(true);
  });

  it('done and cancelled do not', () => {
    expect(isHolding(booking('2026-04-01', '2026-04-20', { status: 'done' }), now)).toBe(false);
    expect(isHolding(booking('2026-04-01', '2026-04-20', { status: 'cancelled' }), now)).toBe(false);
  });

  it('a hold holds until its expiry passes', () => {
    const live = booking('2026-04-01', '2026-04-20', {
      status: 'hold',
      holdExpiresAt: '2026-04-12T00:00:00Z'
    });
    const lapsed = booking('2026-04-01', '2026-04-20', {
      status: 'hold',
      holdExpiresAt: '2026-04-09T00:00:00Z'
    });
    expect(isHolding(live, now)).toBe(true);
    expect(isHolding(lapsed, now)).toBe(false);
  });

  it('a hold with no expiry keeps holding', () => {
    expect(isHolding(booking('2026-04-01', '2026-04-20', { status: 'hold' }), now)).toBe(true);
  });

  it('an unrecognised row counts as holding — never free a resource by accident', () => {
    expect(isHolding({ start: '2026-04-01', end: '2026-04-20' }, now)).toBe(true);
  });
});

describe('peakBookedQuantity — peak, not sum', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('three sequential bookings inside a month take one unit, not three', () => {
    const bookings = [
      booking('2026-04-02', '2026-04-05'),
      booking('2026-04-07', '2026-04-10'),
      booking('2026-04-12', '2026-04-15')
    ];
    expect(peakBookedQuantity(bookings, range('2026-04-01', '2026-05-01'), { now })).toBe(1);
  });

  it('genuinely concurrent bookings add up', () => {
    const bookings = [
      booking('2026-04-02', '2026-04-10', { quantity: 3 }),
      booking('2026-04-05', '2026-04-08', { quantity: 4 })
    ];
    expect(peakBookedQuantity(bookings, range('2026-04-01', '2026-05-01'), { now })).toBe(7);
  });

  it('ignores bookings outside the asked range', () => {
    const bookings = [booking('2026-06-01', '2026-06-10', { quantity: 9 })];
    expect(peakBookedQuantity(bookings, range('2026-04-01', '2026-05-01'), { now })).toBe(0);
  });
});

describe('checkAvailability', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('unlimited is always available and costs nothing to give', () => {
    const busy = [booking('2020-01-01', null, { quantity: 999 })];
    expect(checkAvailability(template, busy, range('2026-04-01', '2026-04-10'), 1, { now })).toEqual({
      kind: 'unlimited',
      dateFit: 1
    });
  });

  it('an empty ledger means available', () => {
    const result = checkAvailability(projector, [], range('2026-04-01', '2026-04-10'), 1, { now });
    expect(result.kind).toBe('available');
    expect(result.dateFit).toBe(1);
  });

  it('a fully covering booking means taken, and reports when it frees up', () => {
    const bookings = [booking('2026-03-20', '2026-04-20')];
    const result = checkAvailability(projector, bookings, range('2026-04-01', '2026-04-10'), 1, { now });
    expect(result.kind).toBe('taken');
    expect(result.dateFit).toBe(0);
    if (result.kind === 'taken') {
      expect(result.nextFreeFrom).toEqual(d('2026-04-20'));
      expect(result.conflicts).toHaveLength(1);
    }
  });

  it('a partial collision is partial — not a rejection', () => {
    // Requested 1–11 April, booked 6–20 April → 5 free days out of 10.
    const bookings = [booking('2026-04-06', '2026-04-20')];
    const result = checkAvailability(projector, bookings, range('2026-04-01', '2026-04-11'), 1, { now });
    expect(result.kind).toBe('partial');
    if (result.kind === 'partial') {
      expect(result.freeDays).toBe(5);
      expect(result.requestedDays).toBe(10);
      expect(result.dateFit).toBe(0.5);
      expect(result.freeWindows).toEqual([{ start: d('2026-04-01'), end: d('2026-04-06') }]);
      expect(result.conflicts).toHaveLength(1);
    }
  });

  it('a pool with room left is available; one unit short is not', () => {
    const bookings = [booking('2026-04-01', '2026-04-10', { quantity: 8 })];
    expect(checkAvailability(chairs, bookings, range('2026-04-02', '2026-04-05'), 2, { now }).kind).toBe(
      'available'
    );
    expect(checkAvailability(chairs, bookings, range('2026-04-02', '2026-04-05'), 3, { now }).kind).toBe(
      'taken'
    );
  });

  it('a request wholly outside the offer window is outOfWindow', () => {
    const seasonal: ResourceLike = { kindOf: 'rent', sdate: '2026-06-01', fdate: '2026-09-01' };
    const result = checkAvailability(seasonal, [], range('2026-04-01', '2026-04-10'), 1, { now });
    expect(result.kind).toBe('outOfWindow');
    expect(result.dateFit).toBe(0);
  });

  it('a request that runs past the offer window is partial, not available', () => {
    const seasonal: ResourceLike = { kindOf: 'rent', sdate: '2026-04-01', fdate: '2026-04-06' };
    const result = checkAvailability(seasonal, [], range('2026-04-01', '2026-04-11'), 1, { now });
    expect(result.kind).toBe('partial');
    if (result.kind === 'partial') expect(result.dateFit).toBe(0.5);
  });

  it('a lapsed hold does not block', () => {
    const bookings = [
      booking('2026-03-20', '2026-04-20', { status: 'hold', holdExpiresAt: '2026-03-25T00:00:00Z' })
    ];
    expect(checkAvailability(projector, bookings, range('2026-04-01', '2026-04-10'), 1, { now }).kind).toBe(
      'available'
    );
  });

  it('leadTimeHours keeps a gap free of the next booking', () => {
    const withLead: ResourceLike = { kindOf: 'rent', leadTimeHours: 24 };
    const bookings = [booking('2026-04-01T00:00:00Z', '2026-04-05T00:00:00Z')];
    const tight = range('2026-04-05T00:00:00Z', '2026-04-08T00:00:00Z');
    expect(checkAvailability(projector, bookings, tight, 1, { now }).kind).toBe('available');
    expect(checkAvailability(withLead, bookings, tight, 1, { now }).kind).toBe('partial');
  });

  it('a consumable handed over is gone for good', () => {
    const sand: ResourceLike = { kindOf: 'total' };
    const bookings = [booking('2026-04-02', null)];
    const result = checkAvailability(sand, bookings, range('2027-01-01', '2027-02-01'), 1, { now });
    expect(result.kind).toBe('taken');
    if (result.kind === 'taken') expect(result.nextFreeFrom).toBeNull();
  });
});

describe('freeWindows — contiguity survives quantity changes', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('merges adjacent slices that are both under capacity', () => {
    // 2 chairs out 1–5 April, 5 chairs out 5–10. Both leave room for 3, and the
    // window must come back as one continuous stretch.
    const bookings = [
      booking('2026-04-01', '2026-04-05', { quantity: 2 }),
      booking('2026-04-05', '2026-04-10', { quantity: 5 })
    ];
    expect(freeWindows(chairs, bookings, range('2026-04-01', '2026-04-10'), 3, { now })).toEqual([
      { start: d('2026-04-01'), end: d('2026-04-10') }
    ]);
  });

  it('clips to the holder’s own offer window', () => {
    const seasonal: ResourceLike = { kindOf: 'rent', sdate: '2026-04-05', fdate: '2026-04-08' };
    expect(freeWindows(seasonal, [], range('2026-04-01', '2026-04-20'), 1, { now })).toEqual([
      { start: d('2026-04-05'), end: d('2026-04-08') }
    ]);
  });
});

describe('nextFreeFrom', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('skips a gap too short for the request', () => {
    // Free 10–12 April is only 2 days; the request is 5 days long.
    const bookings = [booking('2026-04-01', '2026-04-10'), booking('2026-04-12', '2026-04-25')];
    expect(nextFreeFrom(projector, bookings, range('2026-04-01', '2026-04-06'), 1, { now })).toEqual(
      d('2026-04-25')
    );
  });

  it('returns null when the offer window closes first', () => {
    const seasonal: ResourceLike = { kindOf: 'rent', sdate: '2026-04-01', fdate: '2026-04-20' };
    const bookings = [booking('2026-04-01', '2026-04-20')];
    expect(nextFreeFrom(seasonal, bookings, range('2026-04-01', '2026-04-06'), 1, { now })).toBeNull();
  });
});

describe('conflictingHolds — approving one proposal releases the other', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('cancels an overlapping hold when the winner is confirmed', () => {
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed' });
    const loser = booking('2026-04-08', '2026-04-15', { id: 'B', status: 'hold' });
    const losers = conflictingHolds(projector, [winner, loser], winner, { now });
    expect(losers.map((b) => b.id)).toEqual(['B']);
  });

  it('leaves a non-overlapping hold alone', () => {
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed' });
    const other = booking('2026-04-12', '2026-04-20', { id: 'B', status: 'hold' });
    expect(conflictingHolds(projector, [winner, other], winner, { now })).toEqual([]);
  });

  it('never cancels somebody else’s standing agreement', () => {
    // A confirmed booking is a signed deal. If it collides, that is a problem
    // for a human, not something this function silently resolves.
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed' });
    const standing = booking('2026-04-08', '2026-04-15', { id: 'B', status: 'active' });
    expect(conflictingHolds(projector, [winner, standing], winner, { now })).toEqual([]);
  });

  it('a pool with room for both keeps both', () => {
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed', quantity: 4 });
    const other = booking('2026-04-08', '2026-04-15', { id: 'B', status: 'hold', quantity: 4 });
    expect(conflictingHolds(chairs, [winner, other], winner, { now })).toEqual([]);
  });

  it('a pool that would be oversubscribed releases the hold', () => {
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed', quantity: 8 });
    const other = booking('2026-04-08', '2026-04-15', { id: 'B', status: 'hold', quantity: 4 });
    expect(conflictingHolds(chairs, [winner, other], winner, { now }).map((b) => b.id)).toEqual(['B']);
  });

  it('unlimited resources never conflict', () => {
    const winner = booking('2026-04-05', '2026-04-12', { id: 'A', status: 'confirmed' });
    const other = booking('2026-04-08', '2026-04-15', { id: 'B', status: 'hold' });
    expect(conflictingHolds(template, [winner, other], winner, { now })).toEqual([]);
  });
});

describe('usageProfile + hasFutureAvailability', () => {
  const now = d('2026-04-01T00:00:00Z');

  it('reports the quantity in use per stretch', () => {
    const bookings = [
      booking('2026-04-02', '2026-04-06', { quantity: 2 }),
      booking('2026-04-04', '2026-04-08', { quantity: 3 })
    ];
    expect(usageProfile(bookings, range('2026-04-01', '2026-04-10'), { now })).toEqual([
      { start: d('2026-04-01'), end: d('2026-04-02'), quantity: 0 },
      { start: d('2026-04-02'), end: d('2026-04-04'), quantity: 2 },
      { start: d('2026-04-04'), end: d('2026-04-06'), quantity: 5 },
      { start: d('2026-04-06'), end: d('2026-04-08'), quantity: 3 },
      { start: d('2026-04-08'), end: d('2026-04-10'), quantity: 0 }
    ]);
  });

  it('a resource booked out for the whole horizon has no future availability', () => {
    expect(hasFutureAvailability(projector, [booking('2026-03-01', null)], { now })).toBe(false);
    expect(hasFutureAvailability(projector, [booking('2026-04-02', '2026-04-05')], { now })).toBe(true);
    expect(hasFutureAvailability(template, [booking('2020-01-01', null)], { now })).toBe(true);
  });
});

describe('roundToGranularity — display only', () => {
  it('expands a day-granular range to whole local days', () => {
    const rounded = roundToGranularity(
      { start: new Date(2026, 3, 5, 14, 30), end: new Date(2026, 3, 7, 9, 15) },
      'day'
    );
    expect(rounded.start).toEqual(new Date(2026, 3, 5, 0, 0, 0, 0));
    expect(rounded.end).toEqual(new Date(2026, 3, 8, 0, 0, 0, 0));
  });

  it('leaves an already-whole day alone', () => {
    const rounded = roundToGranularity(
      { start: new Date(2026, 3, 5), end: new Date(2026, 3, 7) },
      'day'
    );
    expect(rounded.end).toEqual(new Date(2026, 3, 7));
  });

  it('leaves hour-granular ranges untouched', () => {
    const original = { start: new Date(2026, 3, 5, 14, 30), end: new Date(2026, 3, 5, 16, 0) };
    expect(roundToGranularity(original, 'hour')).toEqual(original);
  });
});
