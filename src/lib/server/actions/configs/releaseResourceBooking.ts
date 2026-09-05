/**
 * Action: the resource came back (docs/PLAN_RESOURCE_CALENDAR.md §4).
 *
 * This is the missing half of today's behaviour. `voteOnMaap` sets
 * `Sp.panui = false` when a resource goes out, and **nothing anywhere sets it
 * back** — `markResourceDone` closes the engine and leaves the flag alone. So a
 * projector lent once in 2024 is still invisible to every rikma today.
 *
 * Closing the live bookings and recomputing `panui` from the ledger is what
 * finally makes a returned resource available again.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { bookingsEnabled, releaseBookings } from '$lib/server/resources/bookingStore.js';

const releaseResourceBookingHandler: ActionExecutionHandler = async (params, context) => {
  const { spId, projectId } = params;

  if (!bookingsEnabled()) {
    return { data: { skipped: true, reason: 'RESOURCE_BOOKINGS=off' }, updateStrategy: { type: 'none' } };
  }

  const exec = execFromContext(context);
  const released = await releaseBookings(exec, { spId, projectId: projectId ?? null });

  return { data: { spId, released }, updateStrategy: { type: 'fullRefresh' } };
};

export const releaseResourceBookingConfig: ActionConfig = {
  key: 'releaseResourceBooking',
  description:
    'Mark a resource as returned: close its live bookings (optionally only one rikma’s) and recompute the panui cache so it can be offered again.',
  graphqlOperation: releaseResourceBookingHandler,

  paramSchema: {
    spId: { type: 'string', required: true, description: 'The resource coming back' },
    projectId: {
      type: 'string',
      required: false,
      description: 'Release only this rikma’s bookings. Omit to release every live one.'
    }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to release a resource' }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
