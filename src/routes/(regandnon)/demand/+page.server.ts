import { sendToSer } from '$lib/send/sendToSer.js';
import {
  normalizeJoinableRatson,
  normalizeMaagadim,
  normalizeOpenMashaabim,
  normalizeOpenMission
} from '$lib/server/map/normalizeMapItems.js';
import type { PageServerLoad } from './$types';

function nodesOf(result: PromiseSettledResult<any>, key: string): any[] {
  if (result.status !== 'fulfilled') return [];
  return result.value?.data?.[key]?.data ?? [];
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  // Four independent public reads; each degrades to an empty layer on its own.
  // 223mapMaagadim is *expected* to fail until the collections from
  // 1.0b/docs/SPEC_SHARED_PURCHASE_MAP.md exist in production.
  const [wishesRes, missionsRes, resourcesRes, maagadimRes] =
    await Promise.allSettled([
      sendToSer({}, '220mapJoinableRatsons', 0, 0, false, fetch),
      sendToSer({}, '221mapOpenMissions', 0, 0, false, fetch),
      sendToSer({}, '222mapOpenMashaabims', 0, 0, false, fetch),
      sendToSer({}, '223mapMaagadim', 0, 0, false, fetch)
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

  return {
    isLoggedIn: !!(locals as any)?.uid,
    mapData: { wishes, maagadim, offers, missions, resources }
  };
};
