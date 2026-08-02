/**
 * Property-Based Tests for the recurring-resource plan.
 *
 * The example tests pin down the cases we reasoned about; these pin down the
 * invariants that must hold for *every* input — in particular that a resource
 * nobody has agreed to provide yet can never be closed off at creation.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveRecurringPlan, normalizeCycleSize, cycleWindow } from './recurringPlan.js';

const kindOfArb = fc.constantFrom('total', 'monthly', 'yearly', 'perUnit', 'rent');
const cycleSizeArb = fc.oneof(
  fc.integer({ min: -5, max: 60 }),
  fc.constantFrom(null, undefined, '', 'abc', NaN, 2.7)
);

const inputArb = fc.record({
  recurring: fc.boolean(),
  kindOf: kindOfArb,
  isPmash: fc.boolean(),
  isAssigned: fc.boolean(),
  cycleSize: cycleSizeArb
});

describe('resolveRecurringPlan — properties', () => {
  it('only ever builds an engine up front for a claimed solo resource', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const plan = resolveRecurringPlan(input);
        if (plan.engineOn !== 'now') return true;
        return plan.isRecurring && !input.isPmash && input.isAssigned === true;
      })
    );
  });

  /**
   * The regression guard. An unclaimed recurring resource is a standing need:
   * it must be left open for the community, so its engine waits for approval.
   */
  it('leaves every unclaimed recurring resource waiting for approval', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const plan = resolveRecurringPlan({ ...input, isAssigned: false });
        return !plan.isRecurring || plan.engineOn === 'onApproval';
      })
    );
  });

  it('never builds an engine up front in a multi-member rikma', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        return resolveRecurringPlan({ ...input, isPmash: true }).engineOn !== 'now';
      })
    );
  });

  it('ties stamping and the engine to isRecurring, together', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const plan = resolveRecurringPlan(input);
        return plan.isRecurring
          ? plan.stampOnRecord && plan.engineOn !== null
          : !plan.stampOnRecord && plan.engineOn === null;
      })
    );
  });

  it('always yields a usable period, whatever cycleSize arrives as', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const { cycleEvery } = resolveRecurringPlan(input);
        return Number.isInteger(cycleEvery) && cycleEvery >= 1;
      })
    );
  });

  it('is a pure function of its input', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        expect(resolveRecurringPlan(input)).toEqual(resolveRecurringPlan(input));
      })
    );
  });
});

const unitArb = fc.constantFrom<'month' | 'year'>('month', 'year');
// Kept away from the epoch edges so month arithmetic stays in ordinary ranges.
// fc.date() can yield an Invalid Date, which is exactly what a malformed
// `sqadualed` from Strapi looks like — kept in its own arbitrary so the
// alignment properties can assume a real anchor while robustness is proven
// separately.
const anyDateArb = fc.date({ min: new Date(2000, 0, 1), max: new Date(2060, 11, 31) });
const dateArb = anyDateArb.filter((d) => !Number.isNaN(d.getTime()));

describe('cycleWindow — properties', () => {
  it('produces a non-empty, ordered window', () => {
    fc.assert(
      fc.property(unitArb, dateArb, cycleSizeArb, dateArb, (unit, anchor, size, ref) => {
        const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, size, ref);
        return cycleStart.getTime() < cycleEnd.getTime();
      })
    );
  });

  /**
   * Serializing a cycle calls .toISOString(), which throws a RangeError on an
   * Invalid Date. Unparseable stored dates must therefore degrade, never
   * propagate — otherwise one bad record breaks askm acceptance outright.
   */
  it('yields a serializable window even for unparseable dates', () => {
    fc.assert(
      fc.property(unitArb, anyDateArb, cycleSizeArb, anyDateArb, (unit, anchor, size, ref) => {
        const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, size, ref);
        expect(() => cycleStart.toISOString()).not.toThrow();
        expect(() => cycleEnd.toISOString()).not.toThrow();
        return cycleStart.getTime() < cycleEnd.getTime();
      })
    );
  });

  it('contains ref whenever ref is at or after the anchor', () => {
    fc.assert(
      fc.property(unitArb, dateArb, cycleSizeArb, dateArb, (unit, anchor, size, ref) => {
        fc.pre(ref.getTime() >= anchor.getTime());
        const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, size, ref);
        return ref.getTime() >= cycleStart.getTime() && ref.getTime() <= cycleEnd.getTime();
      })
    );
  });

  /**
   * Alignment is what keeps cycle #1 — written at creation or at acceptance —
   * on the same window /api/monthi computes later. Without it monthi's
   * hasOpenCycleFor would miss it and open a duplicate cycle.
   */
  it('starts a whole number of periods away from the anchor', () => {
    fc.assert(
      fc.property(unitArb, dateArb, cycleSizeArb, dateArb, (unit, anchor, size, ref) => {
        const step = normalizeCycleSize(size);
        const { cycleStart } = cycleWindow(unit, anchor, size, ref);
        const delta =
          unit === 'year'
            ? cycleStart.getFullYear() - anchor.getFullYear()
            : (cycleStart.getFullYear() - anchor.getFullYear()) * 12 +
              (cycleStart.getMonth() - anchor.getMonth());
        return delta >= 0 && delta % step === 0;
      })
    );
  });

  it('is stable for any ref inside the window it returns', () => {
    fc.assert(
      fc.property(unitArb, dateArb, cycleSizeArb, dateArb, (unit, anchor, size, ref) => {
        fc.pre(ref.getTime() >= anchor.getTime());
        const first = cycleWindow(unit, anchor, size, ref);
        // Re-deriving from any moment inside the window must not move it.
        const again = cycleWindow(unit, anchor, size, first.cycleEnd);
        expect(again).toEqual(first);
      })
    );
  });

  it('leaves no gap or overlap between consecutive windows', () => {
    fc.assert(
      fc.property(unitArb, dateArb, cycleSizeArb, (unit, anchor, size) => {
        const step = normalizeCycleSize(size);
        const first = cycleWindow(unit, anchor, size, anchor);
        // One millisecond past the end belongs to the next window, which must
        // begin exactly one period after this one.
        const next = cycleWindow(unit, anchor, size, new Date(first.cycleEnd.getTime() + 1000));
        const delta =
          unit === 'year'
            ? next.cycleStart.getFullYear() - first.cycleStart.getFullYear()
            : (next.cycleStart.getFullYear() - first.cycleStart.getFullYear()) * 12 +
              (next.cycleStart.getMonth() - first.cycleStart.getMonth());
        return delta === step;
      })
    );
  });
});
