import { json } from '@sveltejs/kit';
import { loadDiscoveryMapData } from '$lib/server/map/loadMapData.js';
import type { RequestHandler } from './$types';

/**
 * Normalized discovery-map layers as JSON (PLAN_HUB_LEV_DEMAND_SYNC).
 *
 * Feeds the lev-page demand panel (and any future in-app map embed) without
 * a full navigation to /demand. Returns exactly what the /demand SSR load
 * returns — the same public, privacy-normalized MapItems — so nothing new is
 * exposed: anonymous callers read through the service token like the public
 * page does.
 */
export const GET: RequestHandler = async ({ locals, fetch }) => {
  const isReg = !!(locals as any)?.uid;
  const mapData = await loadDiscoveryMapData(fetch, !isReg);
  return json(
    { mapData },
    // Aggregate public data — a short shared cache keeps repeated panel opens
    // (and hub/lev navigations) from re-fanning five Strapi queries each time.
    { headers: { 'cache-control': 'public, max-age=60' } }
  );
};
