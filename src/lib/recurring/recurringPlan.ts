/**
 * Recurring-resource rules — pure, no I/O.
 *
 * A recurring resource (server rent, apartment, stall…) is modelled as three
 * layers: the *request* (OpenMashaabim in a solo rikma, Pmash in a multi-member
 * one) carrying `recurring`/`cycleSize`, the *engine* (Mashabetahalich) naming
 * who is responsible and how often, and one *cycle* (Maap) per period.
 *
 * Two decisions were previously inlined in the create handler and impossible to
 * test: when the engine may be created, and where a cycle's window falls. Both
 * live here now, and `cycleWindow` is the single definition shared by resource
 * creation, askm acceptance and /api/monthi — three copies of this arithmetic
 * that had already drifted apart.
 */

/** `kindOf` values that can recur. Anything else is a one-off. */
const RECURRABLE = ['monthly', 'yearly'];

export type RecurringPlanInput = {
  /** The `recurring` flag as the creator set it. */
  recurring?: boolean | null;
  /** Resource pricing kind: total / monthly / yearly / perUnit / rent. */
  kindOf?: string | null;
  /** Multi-member rikma → the request is a Pmash and goes to a vote. */
  isPmash: boolean;
  /** The creator claimed the resource for themselves (they are the provider). */
  isAssigned?: boolean | null;
  /** Recurrence period in units of `kindOf`, e.g. every 2 months. */
  cycleSize?: unknown;
};

export type RecurringPlan = {
  /** Recurring at all? `recurring` alone is not enough — kindOf must allow it. */
  isRecurring: boolean;
  /** Cycle unit implied by `kindOf`. */
  unit: 'month' | 'year';
  /** Normalized recurrence period. Always a positive integer. */
  cycleEvery: number;
  /** Write `recurring`/`cycleSize` onto the created request record? */
  stampOnRecord: boolean;
  /**
   * When the Mashabetahalich engine may be built:
   *  - `'now'`        — the provider is already known (solo creator claimed it),
   *                     so the engine and cycle #1 are created immediately and
   *                     the request is born closed.
   *  - `'onApproval'` — nobody has taken it on yet. The request stays open for
   *                     the community to find and offer on; the engine is built
   *                     from the final agreed terms when an askm is approved.
   *  - `null`         — not a recurring resource; there is no engine.
   */
  engineOn: 'now' | 'onApproval' | null;
};

/**
 * Decide how a resource's recurrence should be materialized.
 *
 * The load-bearing rule is that an engine is only created up front when a
 * provider exists. Without one the resource is a standing *need*: archiving it
 * at birth (as the handler used to do unconditionally) hid it from the hub map,
 * the lev feed and /availiableResorce/[id], so nobody could ever offer to cover
 * it — while match-suggestion emails still went out pointing at the dead link.
 */
export function resolveRecurringPlan(input: RecurringPlanInput): RecurringPlan {
  const { recurring, kindOf, isPmash, isAssigned, cycleSize } = input;

  const isRecurring = Boolean(recurring) && RECURRABLE.includes(String(kindOf));
  const unit: 'month' | 'year' = kindOf === 'yearly' ? 'year' : 'month';

  return {
    isRecurring,
    unit,
    cycleEvery: isRecurring ? normalizeCycleSize(cycleSize) : 1,
    stampOnRecord: isRecurring,
    engineOn: !isRecurring ? null : !isPmash && Boolean(isAssigned) ? 'now' : 'onApproval'
  };
}

/** Coerce any stored/user-supplied cycleSize to a positive whole number. */
export function normalizeCycleSize(value: unknown): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export type CycleWindow = { cycleStart: Date; cycleEnd: Date };

/** A usable Date, or null. `new Date('nonsense')` is an object, not a date. */
function validDate(value: unknown): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
}

/**
 * The cycle window [start, end] containing `ref`, anchored to `anchor` and
 * stepping by `size` units.
 *
 * Anchoring matters: with `size > 1` the windows must stay aligned to the
 * resource's start date, otherwise cycle #1 (written at creation or acceptance)
 * lands on a different window than the ones /api/monthi opens later, and
 * monthi's `hasOpenCycleFor` check fails to recognize it as already open.
 *
 * `ref` before `anchor` clamps to the first window rather than running backwards.
 *
 * An unparseable anchor or ref (a malformed `sqadualed` coming back from Strapi
 * is enough) degrades to the plain calendar window around now. Propagating the
 * Invalid Date instead would throw a RangeError at the `.toISOString()` call
 * that serializes the cycle, taking down the whole acceptance flow.
 */
export function cycleWindow(
  unit: 'month' | 'year',
  anchor: Date,
  size: unknown = 1,
  ref: Date = new Date()
): CycleWindow {
  const step = normalizeCycleSize(size);
  const at = validDate(ref) ?? new Date();
  const from = validDate(anchor) ?? at;

  if (unit === 'year') {
    const since = at.getFullYear() - from.getFullYear();
    const idx = Math.max(0, Math.floor(since / step));
    const y = from.getFullYear() + idx * step;
    return {
      cycleStart: new Date(y, 0, 1),
      cycleEnd: new Date(y + step - 1, 11, 31, 23, 59, 59)
    };
  }

  const since =
    (at.getFullYear() - from.getFullYear()) * 12 + (at.getMonth() - from.getMonth());
  const idx = Math.max(0, Math.floor(since / step));
  const m = from.getMonth() + idx * step;
  return {
    cycleStart: new Date(from.getFullYear(), m, 1),
    cycleEnd: new Date(from.getFullYear(), m + step, 0, 23, 59, 59)
  };
}

/** `cycleWindow` as ISO strings, for GraphQL payloads. */
export function cycleWindowIso(
  unit: 'month' | 'year',
  anchor: Date,
  size: unknown = 1,
  ref: Date = new Date()
): { cycleStart: string; cycleEnd: string } {
  const { cycleStart, cycleEnd } = cycleWindow(unit, anchor, size, ref);
  return { cycleStart: cycleStart.toISOString(), cycleEnd: cycleEnd.toISOString() };
}
