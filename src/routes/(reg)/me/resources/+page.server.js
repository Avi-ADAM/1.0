import { sendToSer } from '$lib/send/sendToSer.js';
import { bookingsFromLegacy, resourcesFromSps } from '$lib/resources/bookingsFromLegacy.js';

/**
 * /me/resources — the holder's resource calendar
 * (docs/PLAN_RESOURCE_CALENDAR.md §6.2).
 *
 * Occupancy is reconstructed server-side from the rows that already record it
 * (`Mashabetahalich` engines + `Rikmash` grant archives) so the page shows real
 * data before the `resource-booking` collection exists. `bookingsFromLegacy`
 * owns that merge; this file only fetches and hands it over.
 *
 * Both loads are non-fatal: an empty calendar is a worse page, not a broken
 * one, and the profile it is reached from must not 500 because one query did.
 */
export const load = async ({ locals, fetch, url }) => {
  const uid = locals.uid;

  let bookings = [];
  let resources = [];

  if (uid) {
    try {
      const res = await sendToSer({ uid: String(uid) }, '309myResourceOccupancy', 0, 0, false, fetch);
      bookings = bookingsFromLegacy(res?.data ?? {});
    } catch (e) {
      console.warn('[me/resources] occupancy load failed (non-fatal):', e);
    }

    try {
      const res = await sendToSer({ uid: String(uid) }, '308myResourcesViaUser', 0, 0, false, fetch);
      resources = resourcesFromSps(res?.data ?? {});
    } catch (e) {
      console.warn('[me/resources] resource list load failed (non-fatal):', e);
    }
  }

  // `?sp=<id>` opens straight into the single-resource view — the "see only
  // one specific resource" entry point the profile links to.
  const sp = url.searchParams.get('sp');

  return { uid, bookings, resources, focusSpId: sp || null };
};
