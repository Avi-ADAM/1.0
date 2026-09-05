/**
 * Action: open a hold on a resource for a date range
 * (docs/PLAN_RESOURCE_CALENDAR.md §4).
 *
 * A hold takes capacity while a vote runs, so two rikmot cannot each be told
 * the projector is theirs. It expires on its own — nobody has to remember to
 * clean it up — and expiry is driven by the rikma's own `restime`, so a slow
 * weave gets a long hold and a fast one a short hold.
 *
 * The interesting part is what happens when the range does not fit. This does
 * **not** answer "no": it returns the windows that *do* fit, so the caller can
 * put a date counter-proposal on the table. A resource being busy is a
 * scheduling fact, not a rejection of the request.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import {
  bookingsEnabled,
  bookingsEnforced,
  checkSpAvailability,
  createBooking,
  loadSpLedger
} from '$lib/server/resources/bookingStore.js';
import { roundToGranularity } from '$lib/resources/availability.js';

const createResourceBookingHandler: ActionExecutionHandler = async (params, context) => {
  const { spId, start, end, quantity, projectId, sheirutId, openMashaabimId, holdExpiresAt, note } =
    params;

  if (!bookingsEnabled()) {
    // The ledger is not switched on yet; say so plainly rather than pretending
    // a booking was made.
    return { data: { skipped: true, reason: 'RESOURCE_BOOKINGS=off' }, updateStrategy: { type: 'none' } };
  }

  const exec = execFromContext(context);
  const { resource } = await loadSpLedger(exec, spId);

  const requested = roundToGranularity(
    { start: new Date(start), end: end ? new Date(end) : null },
    resource?.granularity
  );

  const availability = await checkSpAvailability(exec, spId, requested, Number(quantity) || 1);

  // `partial` and `taken` carry the free windows so the client can offer other
  // dates. Only `enforce` mode actually withholds the hold — in `shadow` the
  // row is still written, which is how the two answers get compared.
  const blocked = availability.kind === 'taken' || availability.kind === 'outOfWindow';
  if (blocked && bookingsEnforced()) {
    return {
      // `availability` already carries `nextFreeFrom` (taken) or the offer
      // window (outOfWindow) — everything the client needs to counter.
      data: { created: false, availability },
      updateStrategy: { type: 'none' }
    };
  }

  const bookingId = await createBooking(exec, {
    spId,
    ownerId: context.userId,
    start: requested.start,
    end: requested.end,
    quantity: Number(quantity) || 1,
    status: 'hold',
    holdExpiresAt: holdExpiresAt ?? null,
    source: sheirutId ? 'concierge' : projectId ? 'rikma' : 'personal',
    projectId: projectId ?? null,
    sheirutId: sheirutId ?? null,
    openMashaabimId: openMashaabimId ?? null,
    note: note ?? null
  });

  return {
    data: { created: bookingId != null, bookingId, availability },
    updateStrategy: { type: 'fullRefresh' }
  };
};

export const createResourceBookingConfig: ActionConfig = {
  key: 'createResourceBooking',
  description:
    'Open a hold on a resource (Sp) for a date range. Returns the availability answer, including the free windows when the range only partly fits — a partial fit is a counter-proposal, not a rejection.',
  graphqlOperation: createResourceBookingHandler,

  paramSchema: {
    spId: { type: 'string', required: true, description: 'The Sp being held' },
    start: { type: 'string', required: true, description: 'Range start (ISO)' },
    end: { type: 'string', required: false, description: 'Range end (ISO). Omit for open-ended' },
    quantity: { type: 'number', required: false, description: 'Units to hold (pools only)' },
    projectId: { type: 'string', required: false, description: 'The rikma receiving it' },
    sheirutId: { type: 'string', required: false, description: 'The concierge customer receiving it' },
    openMashaabimId: { type: 'string', required: false, description: 'The request this answers' },
    holdExpiresAt: { type: 'string', required: false, description: 'When the hold lapses (ISO)' },
    note: { type: 'string', required: false, description: 'Free note' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to hold a resource' }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
