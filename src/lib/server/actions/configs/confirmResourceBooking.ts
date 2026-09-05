/**
 * Action: confirm a hold, releasing the holds it collides with
 * (docs/PLAN_RESOURCE_CALENDAR.md §4, §9.3).
 *
 * This is the decision point the whole ledger exists for. Two rikmot can both
 * hold the same week — deliberately, because "first click wins" would be a
 * silent race rather than a decision. When the holder approves one, every other
 * *hold* that no longer fits is released with `cancelReason: 'conflict'`.
 *
 * Two things it will not do, both enforced in `conflictingHolds`:
 *   - it never cancels a `confirmed` or `active` booking. That is somebody
 *     else's signed agreement, and a collision there is a problem for people,
 *     not something a function resolves quietly;
 *   - a pool with room for both keeps both.
 *
 * The released side is not left with a bare "no": it gets the resource's free
 * windows, which is what a date counter-proposal is built from.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import {
  bookingsEnabled,
  confirmBookingAndRelease,
  loadSpLedger
} from '$lib/server/resources/bookingStore.js';
import { freeWindows } from '$lib/resources/availability.js';

const HORIZON_DAYS = 180;

const confirmResourceBookingHandler: ActionExecutionHandler = async (params, context) => {
  const { bookingId, spId } = params;

  if (!bookingsEnabled()) {
    return { data: { skipped: true, reason: 'RESOURCE_BOOKINGS=off' }, updateStrategy: { type: 'none' } };
  }

  const exec = execFromContext(context);
  const result = await confirmBookingAndRelease(exec, { bookingId, spId });

  // What the released claims can be offered instead.
  let windows: { start: string; end: string | null }[] = [];
  if (result.released.length > 0) {
    const { resource, bookings } = await loadSpLedger(exec, spId);
    const now = new Date();
    windows = freeWindows(
      resource,
      bookings,
      { start: now, end: new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000) },
      1
    ).map((w) => ({ start: w.start.toISOString(), end: w.end ? w.end.toISOString() : null }));
  }

  return {
    data: { ...result, freeWindows: windows },
    updateStrategy: { type: 'fullRefresh' }
  };
};

export const confirmResourceBookingConfig: ActionConfig = {
  key: 'confirmResourceBooking',
  description:
    'Confirm a resource hold. Overlapping holds that no longer fit are released with reason `conflict`, and the free windows they could move to are returned. Never touches a confirmed or active booking.',
  graphqlOperation: confirmResourceBookingHandler,

  paramSchema: {
    bookingId: { type: 'string', required: true, description: 'The hold being confirmed' },
    spId: { type: 'string', required: true, description: 'The resource it sits on' },
    projectId: { type: 'string', required: false, description: 'The rikma, when confirmed by a vote' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to confirm a resource booking' }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
