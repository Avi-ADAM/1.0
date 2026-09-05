/**
 * Action: withdraw a resource booking (docs/PLAN_RESOURCE_CALENDAR.md §4).
 *
 * Withdrawing your own claim is not a rejection of anyone — it is the one
 * "no" the consent model has always allowed, because it is about your own
 * commitment. Cancelling frees the capacity immediately, which is why it also
 * refreshes the `panui` cache.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import {
  bookingsEnabled,
  setBookingStatus,
  syncPanui
} from '$lib/server/resources/bookingStore.js';

const cancelResourceBookingHandler: ActionExecutionHandler = async (params, context) => {
  const { bookingId, spId, reason } = params;

  if (!bookingsEnabled()) {
    return { data: { skipped: true, reason: 'RESOURCE_BOOKINGS=off' }, updateStrategy: { type: 'none' } };
  }

  const exec = execFromContext(context);
  await setBookingStatus(exec, bookingId, 'cancelled', reason === 'declined' ? 'declined' : 'withdrawn');
  if (spId) await syncPanui(exec, spId);

  return { data: { bookingId, cancelled: true }, updateStrategy: { type: 'fullRefresh' } };
};

export const cancelResourceBookingConfig: ActionConfig = {
  key: 'cancelResourceBooking',
  description: 'Withdraw a resource booking and free its capacity',
  graphqlOperation: cancelResourceBookingHandler,

  paramSchema: {
    bookingId: { type: 'string', required: true, description: 'The booking to cancel' },
    spId: { type: 'string', required: false, description: 'Its resource, so the panui cache can be refreshed' },
    reason: { type: 'string', required: false, description: '`withdrawn` (default) or `declined`' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to cancel a resource booking' }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
