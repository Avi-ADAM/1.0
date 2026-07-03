import { sendToSer } from '$lib/send/sendToSer.js';
import { haversineKm } from '$lib/server/geo/haversine.js';
import {
  normalizeJoinableRatson,
  normalizeMaagadim
} from '$lib/server/map/normalizeMapItems.js';
import type { MapItem } from '$lib/map/discoveryTypes';
import type { PageServerLoad } from './$types';

/**
 * Supplier-facing demand discovery for one project — PLAN_DISCOVERY_MAP M3,
 * PLAN_SHARED_PURCHASE §6.1. Reuses the public map normalizers, then ranks
 * located demand (pools + joinable wishes) by distance to the project's own
 * service area so the supplier sees the nearest opportunities first.
 */
function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function nodesOf(result: PromiseSettledResult<any>, key: string): any[] {
  if (result.status !== 'fulfilled') return [];
  return result.value?.data?.[key]?.data ?? [];
}

export const load: PageServerLoad = async ({ params, fetch }) => {
  const projectId = params.projectId;

  const [projRes, wishesRes, maagadimRes] = await Promise.allSettled([
    sendToSer({ pid: projectId }, '234getProjectLocation', 0, 0, false, fetch),
    sendToSer({}, '220mapJoinableRatsons', 0, 0, false, fetch),
    sendToSer({}, '223mapMaagadim', 0, 0, false, fetch)
  ]);

  const projNode =
    projRes.status === 'fulfilled' ? (projRes.value as any)?.data?.project?.data : null;
  const loc = projNode?.attributes?.location ?? null;
  const projectCenter =
    loc && num(loc.lat) !== null && num(loc.lng) !== null
      ? { lat: num(loc.lat) as number, lng: num(loc.lng) as number, radius: num(loc.radius) }
      : null;

  const wishes = nodesOf(wishesRes, 'ratsons')
    .map(normalizeJoinableRatson)
    .filter((x): x is MapItem => x !== null);
  const [maagadim] = normalizeMaagadim(nodesOf(maagadimRes, 'maagads'));

  // Annotate each located item with distance to the project (when known) and
  // sort nearest-first. Online/global items have no distance — they sort last
  // but stay visible (a digital supplier can serve them).
  function withDistance(items: MapItem[]) {
    return items
      .map((it) => {
        const d =
          projectCenter && it.lat !== null && it.lng !== null
            ? haversineKm(projectCenter.lat, projectCenter.lng, it.lat, it.lng)
            : null;
        return { ...it, distanceKm: d === null ? null : Math.round(d * 10) / 10 };
      })
      .sort((a, b) => {
        if (a.distanceKm === null) return b.distanceKm === null ? 0 : 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }

  return {
    projectId,
    projectName: projNode?.attributes?.projectName ?? '',
    projectCenter,
    hasLocation: !!projectCenter,
    maagadim: withDistance(maagadim),
    wishes: withDistance(wishes)
  };
};
