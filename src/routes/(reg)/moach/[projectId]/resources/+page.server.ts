import { sendToSer } from '$lib/send/sendToSer.js';
import { bookingsFromLegacy } from '$lib/resources/bookingsFromLegacy.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's resource calendar (docs/PLAN_RESOURCE_CALENDAR.md §6.3).
 *
 * Two directions on one screen: what the rikma is holding and until when, and
 * what it has committed to supply outward to customers. Those have never been
 * shown together, which is how a rikma sells the same week twice.
 *
 * Membership is already enforced by the `[projectId]` layout; the qid carries
 * its own member guard as well, so a direct call to `/api/send` cannot read it
 * either.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  let bookings: ReturnType<typeof bookingsFromLegacy> = [];
  try {
    const res = (await sendToSer(
      { pid: projectId },
      '310projectResourceOccupancy',
      0,
      0,
      false,
      fetch
    )) as any;
    // `project` perspective: the rikma is the viewer, so each row names the
    // member supplying the resource rather than the rikma itself.
    bookings = bookingsFromLegacy(res?.data ?? {}, { perspective: 'project' });
  } catch (e) {
    // An empty calendar is a worse page, not a broken one.
    console.warn('[moach/resources] occupancy load failed (non-fatal):', e);
  }

  return { projectId, bookings };
};
