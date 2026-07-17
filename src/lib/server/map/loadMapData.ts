/**
 * Shared server-side loader for the discovery-map layers
 * (PLAN_DISCOVERY_MAP §3, PLAN_HUB_LEV_DEMAND_SYNC).
 *
 * Used by the public /demand page, the /api/map-data endpoint that feeds the
 * lev-page demand panel, and anything else that needs the normalized layers.
 * All privacy rules (coordinate rounding, aggregate counts, no identities)
 * are enforced by the normalizers before data leaves the server.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import {
  normalizeJoinableRatson,
  normalizeMaagadim,
  normalizeOpenMashaabim,
  normalizeOpenMission,
  normalizeProduct
} from './normalizeMapItems.js';
import type { MapItem } from '$lib/map/discoveryTypes';

export interface DiscoveryMapData {
  wishes: MapItem[];
  maagadim: MapItem[];
  offers: MapItem[];
  missions: MapItem[];
  resources: MapItem[];
  products: MapItem[];
}

function nodesOf(result: PromiseSettledResult<any>, key: string): any[] {
  if (result.status !== 'fulfilled') return [];
  return result.value?.data?.[key]?.data ?? [];
}

/**
 * Five independent public reads; each degrades to an empty layer on its own
 * (the maagad collections may not exist in every deployment — same guard as
 * the original /demand load).
 *
 * @param svc read with the service token (anonymous visitors) instead of the
 *            caller's JWT — see the note in /demand/+page.server.ts.
 */
export async function loadDiscoveryMapData(
  fetch: typeof globalThis.fetch,
  svc: boolean
): Promise<DiscoveryMapData> {
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
    .filter((x): x is MapItem => x !== null);
  const missions = nodesOf(missionsRes, 'openMissions')
    .map(normalizeOpenMission)
    .filter((x): x is MapItem => x !== null);
  const resources = nodesOf(resourcesRes, 'openMashaabims')
    .map(normalizeOpenMashaabim)
    .filter((x): x is MapItem => x !== null);
  const [maagadim, offers] = normalizeMaagadim(nodesOf(maagadimRes, 'maagads'));
  const products = nodesOf(productsRes, 'matanots')
    .map(normalizeProduct)
    .filter((x): x is MapItem => x !== null);

  return { wishes, maagadim, offers, missions, resources, products };
}
