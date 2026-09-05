/**
 * Action: the holder blocks their own resource's dates
 * (docs/PLAN_RESOURCE_CALENDAR.md §2.1, §4).
 *
 * "The van is in the garage 15–17 April" is a **sovereign self-report**, the
 * same shape as `holderStatus: 'self'` on a sale: it is about the holder's own
 * state, nobody else's consent is involved, and it takes effect immediately.
 * That is why this is the one booking action with a `self` rule and no
 * counterparty — a blackout has no project, no customer, and nothing to vote on.
 *
 * It does still take capacity, so a rikma is never offered a van that is in
 * the garage.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import {
  bookingsEnabled,
  createBooking,
  loadSpLedger,
  syncPanui
} from '$lib/server/resources/bookingStore.js';
import { capacityOf, roundToGranularity } from '$lib/resources/availability.js';

const blockResourceDatesHandler: ActionExecutionHandler = async (params, context) => {
  const { spId, start, end, note } = params;

  if (!bookingsEnabled()) {
    return { data: { skipped: true, reason: 'RESOURCE_BOOKINGS=off' }, updateStrategy: { type: 'none' } };
  }

  const exec = execFromContext(context);
  const { resource, ownerId } = await loadSpLedger(exec, spId);

  // The `self` rule only proves `userId` is the caller. It says nothing about
  // whose resource `spId` is — so without this, anyone could block anyone
  // else's van out of every rikma.
  if (ownerId != null && String(ownerId) !== String(context.userId)) {
    throw new Error('Forbidden: you can only block dates on your own resource');
  }

  const range = roundToGranularity(
    { start: new Date(start), end: end ? new Date(end) : null },
    resource?.granularity
  );

  // A blackout takes the whole pool: a van in the garage is not "one of five
  // vans", it is the van. An `unlimited` resource has infinite capacity and
  // nothing to block, so it falls back to 1 rather than writing `Infinity`.
  // `confirmed` straight away — there is no one to wait for.
  const capacity = capacityOf(resource);
  const bookingId = await createBooking(exec, {
    spId,
    ownerId: context.userId,
    start: range.start,
    end: range.end,
    quantity: Number.isFinite(capacity) ? capacity : 1,
    status: 'confirmed',
    source: 'blackout',
    note: note ?? null
  });

  await syncPanui(exec, spId);

  return { data: { bookingId, blocked: true }, updateStrategy: { type: 'fullRefresh' } };
};

export const blockResourceDatesConfig: ActionConfig = {
  key: 'blockResourceDates',
  description:
    "Block a resource's dates for the holder themselves (maintenance, a trip). A sovereign self-report: effective immediately, no counterparty, no consent.",
  graphqlOperation: blockResourceDatesHandler,

  paramSchema: {
    spId: { type: 'string', required: true, description: 'The resource to block' },
    userId: { type: 'string', required: true, description: 'The holder — must be the caller' },
    start: { type: 'string', required: true, description: 'Block start (ISO)' },
    end: { type: 'string', required: false, description: 'Block end (ISO). Omit for open-ended' },
    note: { type: 'string', required: false, description: 'Why, for the holder’s own reference' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to block resource dates' },
    {
      // Only the holder blocks their own resource. Without this, one member
      // could quietly make another member's resource unavailable to every rikma.
      type: 'self',
      config: { userIdParam: 'userId' },
      errorMessage: 'You can only block dates on your own resource'
    }
  ],

  updateStrategy: { type: 'fullRefresh' }
};
