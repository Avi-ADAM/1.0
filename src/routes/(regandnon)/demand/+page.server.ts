import { sendToSer } from '$lib/send/sendToSer.js';
import {
  normalizeJoinableRatson,
  normalizeMaagadim,
  normalizeOpenMashaabim,
  normalizeOpenMission,
  normalizeProduct
} from '$lib/server/map/normalizeMapItems.js';
import type { PageServerLoad } from './$types';

function nodesOf(result: PromiseSettledResult<any>, key: string): any[] {
  if (result.status !== 'fulfilled') return [];
  return result.value?.data?.[key]?.data ?? [];
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  // Public page: anonymous visitors have no JWT cookie, so — like the other
  // (regandnon) pages (e.g. availableMission) — anonymous reads go through the
  // service token (isSer = !isReg). This uses the internal-secret-authenticated
  // proxy, so these vetted read-only qids never depend on Strapi *Public* role
  // permissions. Logged-in users read with their own JWT (find permission).
  const isReg = !!(locals as any)?.uid;
  const svc = !isReg;

  // Five independent public reads; each degrades to an empty layer on its own.
  const [wishesRes, missionsRes, resourcesRes, maagadimRes, productsRes] =
    await Promise.allSettled([
      sendToSer({}, '220mapJoinableRatsons', 0, 0, svc, fetch),
      sendToSer({}, '221mapOpenMissions', 0, 0, svc, fetch),
      sendToSer({}, '222mapOpenMashaabims', 0, 0, svc, fetch),
      sendToSer({}, '223mapMaagadim', 0, 0, svc, fetch),
      sendToSer({}, '269mapProducts', 0, 0, svc, fetch)
    ]);

  const wishes = nodesOf(wishesRes, 'ratsons')
    .map(normalizeJoinableRatson)
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const missions = nodesOf(missionsRes, 'openMissions')
    .map(normalizeOpenMission)
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const resources = nodesOf(resourcesRes, 'openMashaabims')
    .map(normalizeOpenMashaabim)
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const [maagadim, offers] = normalizeMaagadim(nodesOf(maagadimRes, 'maagads'));
  const products = nodesOf(productsRes, 'matanots')
    .map(normalizeProduct)
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    isLoggedIn: !!(locals as any)?.uid,
    mapData: { wishes, maagadim, offers, missions, resources, products }
  };
};
