/**
 * Property-based tests for resource availability.
 *
 * The example tests pin down the cases we reasoned about; these pin down the
 * one invariant the whole feature rests on:
 *
 *   **a resource is never handed to more people at once than it has units.**
 *
 * If that can be broken, two rikmot show up for the same projector on the same
 * morning, and no amount of calendar UI helps.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  capacityOf,
  checkAvailability,
  conflictingHolds,
  deriveAvailability,
  freeWindows,
  isHolding,
  overlaps,
  peakBookedQuantity,
  rangeDays
} from './availability.js';
import type { BookingLike, ResourceLike } from './types.js';

const BASE = Date.UTC(2026, 3, 1); // 1 April 2026
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(BASE);

const at = (day: number) => new Date(BASE + day * DAY).toISOString();

/** A booking somewhere in a ±120-day window, sometimes open-ended. */
const bookingArb = fc
  .record({
    startDay: fc.integer({ min: -120, max: 120 }),
    length: fc.integer({ min: 1, max: 60 }),
    openEnded: fc.boolean(),
    quantity: fc.integer({ min: 1, max: 5 }),
    status: fc.constantFrom('hold', 'confirmed', 'active', 'done', 'cancelled'),
    expiryDay: fc.integer({ min: -30, max: 30 })
  })
  .map(
    ({ startDay, length, openEnded, quantity, status, expiryDay }, ): BookingLike => ({
      id: `${startDay}/${length}/${status}`,
      start: at(startDay),
      end: openEnded ? null : at(startDay + length),
      quantity,
      status: status as BookingLike['status'],
      holdExpiresAt: status === 'hold' ? at(expiryDay) : null
    })
  );

const bookingsArb = fc.array(bookingArb, { maxLength: 12 });

const resourceArb = fc.record({
  kindOf: fc.constantFrom('total', 'rent', 'monthly', 'yearly', 'perUnit'),
  availability: fc.constantFrom(null, 'exclusive', 'pooled', 'unlimited', 'consumable'),
  capacity: fc.oneof(fc.integer({ min: 1, max: 8 }), fc.constant(null)),
  leadTimeHours: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 48 }))
}) as fc.Arbitrary<ResourceLike>;

const requestArb = fc
  .record({ startDay: fc.integer({ min: -60, max: 60 }), length: fc.integer({ min: 1, max: 45 }) })
  .map(({ startDay, length }) => ({
    start: new Date(BASE + startDay * DAY),
    end: new Date(BASE + (startDay + length) * DAY)
  }));

describe('checkAvailability — properties', () => {
  it('never over-books: granting an `available` request keeps peak usage within capacity', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, requestArb, fc.integer({ min: 1, max: 3 }), (resource, bookings, request, qty) => {
        const result = checkAvailability(resource, bookings, request, qty, { now: NOW });
        if (result.kind !== 'available') return true;

        const capacity = capacityOf(resource);
        if (capacity === Infinity) return true;

        const granted: BookingLike = {
          id: 'new',
          start: request.start.toISOString(),
          end: request.end.toISOString(),
          quantity: qty,
          status: 'confirmed'
        };
        const peak = peakBookedQuantity([...bookings, granted], request, {
          now: NOW,
          leadTimeHours: resource.leadTimeHours ?? 0
        });
        return peak <= capacity;
      })
    );
  });

  it('the same holds for every window it reports as free', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, requestArb, fc.integer({ min: 1, max: 3 }), (resource, bookings, request, qty) => {
        const capacity = capacityOf(resource);
        if (capacity === Infinity) return true;
        const windows = freeWindows(resource, bookings, request, qty, { now: NOW });
        return windows.every((window) => {
          const granted: BookingLike = {
            id: 'new',
            start: window.start.toISOString(),
            end: window.end == null ? null : window.end.toISOString(),
            quantity: qty,
            status: 'confirmed'
          };
          const peak = peakBookedQuantity([...bookings, granted], window, {
            now: NOW,
            leadTimeHours: resource.leadTimeHours ?? 0
          });
          return peak <= capacity;
        });
      })
    );
  });

  it('dateFit always lands in [0,1] and free days never exceed the request', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, requestArb, (resource, bookings, request) => {
        const result = checkAvailability(resource, bookings, request, 1, { now: NOW });
        if (!(result.dateFit >= 0 && result.dateFit <= 1)) return false;
        if (result.kind !== 'partial') return true;
        return (
          result.freeDays > 0 &&
          result.freeDays <= result.requestedDays &&
          result.requestedDays === rangeDays(request)
        );
      })
    );
  });

  it('free windows are disjoint, ordered, and inside the request', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, requestArb, (resource, bookings, request) => {
        const windows = freeWindows(resource, bookings, request, 1, { now: NOW });
        let previousEnd = -Infinity;
        for (const window of windows) {
          const s = window.start.getTime();
          const e = window.end == null ? Infinity : window.end.getTime();
          if (!(e > s)) return false;
          if (s < previousEnd) return false;
          if (s < request.start.getTime()) return false;
          if (e > request.end.getTime()) return false;
          previousEnd = e;
        }
        return true;
      })
    );
  });

  it('unlimited resources answer `unlimited` no matter what the ledger says', () => {
    fc.assert(
      fc.property(bookingsArb, requestArb, fc.integer({ min: 1, max: 50 }), (bookings, request, qty) => {
        const resource: ResourceLike = { kindOf: 'total', availability: 'unlimited' };
        const result = checkAvailability(resource, bookings, request, qty, { now: NOW });
        return result.kind === 'unlimited';
      })
    );
  });

  it('dead rows change nothing — a cancelled booking is not a booking', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, bookingArb, requestArb, (resource, bookings, extra, request) => {
        const dead: BookingLike = { ...extra, id: 'dead', status: 'cancelled' };
        const before = checkAvailability(resource, bookings, request, 1, { now: NOW });
        const after = checkAvailability(resource, [...bookings, dead], request, 1, { now: NOW });
        return before.kind === after.kind && before.dateFit === after.dateFit;
      })
    );
  });

  it('adding a live booking can only reduce availability, never increase it', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, bookingArb, requestArb, (resource, bookings, extra, request) => {
        if (deriveAvailability(resource) === 'unlimited') return true;
        const live: BookingLike = { ...extra, id: 'extra', status: 'confirmed', holdExpiresAt: null };
        const freeBefore = freeWindows(resource, bookings, request, 1, { now: NOW }).reduce(
          (sum, w) => sum + rangeDays(w),
          0
        );
        const freeAfter = freeWindows(resource, [...bookings, live], request, 1, { now: NOW }).reduce(
          (sum, w) => sum + rangeDays(w),
          0
        );
        return freeAfter <= freeBefore + 1e-9;
      })
    );
  });
});

describe('conflictingHolds — properties', () => {
  it('releases exactly enough holds that the winner then fits', () => {
    fc.assert(
      fc.property(resourceArb, bookingsArb, requestArb, fc.integer({ min: 1, max: 3 }), (resource, bookings, request, qty) => {
        if (deriveAvailability(resource) === 'unlimited') return true;
        const capacity = capacityOf(resource);

        const winner: BookingLike = {
          id: 'winner',
          start: request.start.toISOString(),
          end: request.end.toISOString(),
          quantity: qty,
          status: 'confirmed'
        };
        // A request for more units than exist was never grantable in the first
        // place; releasing holds cannot rescue it, and nothing here claims to.
        if (qty > capacity) return true;

        const ledger = [...bookings, winner];
        const losers = new Set(conflictingHolds(resource, ledger, winner, { now: NOW }).map((b) => String(b.id)));

        // Anything released must have been a *live* hold — never a signed
        // agreement, and never a row that was already dead.
        for (const booking of ledger) {
          if (!losers.has(String(booking.id))) continue;
          if (String(booking.status) !== 'hold') return false;
          if (!isHolding(booking, NOW)) return false;
        }

        // And once they are gone, every hold still standing on the winner's
        // days genuinely fits alongside it. A hold elsewhere on the calendar is
        // none of the winner's business, however oversized it is.
        const survivors = ledger.filter((b) => !losers.has(String(b.id)));
        for (const booking of survivors) {
          if (String(booking.id) === 'winner') continue;
          if (String(booking.status) !== 'hold' || !isHolding(booking, NOW)) continue;
          const its = {
            start: new Date(booking.start),
            end: booking.end == null ? null : new Date(booking.end)
          };
          if (!overlaps(its, { start: request.start, end: request.end }, resource.leadTimeHours ?? 0)) {
            continue;
          }
          const others = survivors.filter((b) => String(b.id) !== String(booking.id));
          const peak = peakBookedQuantity(others, its, {
            now: NOW,
            leadTimeHours: resource.leadTimeHours ?? 0
          });
          if (peak + Number(booking.quantity ?? 1) > capacity) return false;
        }
        return true;
      })
    );
  });
});

describe('capacityOf — properties', () => {
  it('exclusive is always exactly one unit', () => {
    fc.assert(
      fc.property(fc.integer({ min: -5, max: 50 }), (capacity) => {
        expect(capacityOf({ kindOf: 'rent', capacity })).toBe(1);
        return true;
      })
    );
  });

  it('a pool never reports a capacity below one', () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ min: -50, max: 50 }), fc.constant(null)), (capacity) => {
        return capacityOf({ kindOf: 'perUnit', capacity }) >= 1;
      })
    );
  });
});
