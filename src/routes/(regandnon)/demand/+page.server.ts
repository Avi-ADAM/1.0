import { loadDiscoveryMapData } from '$lib/server/map/loadMapData.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  // Public page: anonymous visitors have no JWT cookie, so — like the other
  // (regandnon) pages (e.g. availableMission) — anonymous reads go through the
  // service token (isSer = !isReg). This uses the internal-secret-authenticated
  // proxy, so these vetted read-only qids never depend on Strapi *Public* role
  // permissions. Logged-in users read with their own JWT (find permission).
  const isReg = !!(locals as any)?.uid;

  const mapData = await loadDiscoveryMapData(fetch, !isReg);

  return {
    isLoggedIn: isReg,
    mapData
  };
};
