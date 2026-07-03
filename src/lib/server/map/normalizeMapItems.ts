/**
 * Server-side normalizers for the public discovery map (PLAN_DISCOVERY_MAP §3).
 * Everything the client receives goes through here, so privacy rules
 * (coordinate rounding, no identities, aggregate counts only) are enforced
 * in one place — never in the browser.
 */

import { roundCoord } from '../geo/roundCoord.js';
import type { MapItem } from '$lib/map/discoveryTypes';

type StrapiNode = { id: string | number; attributes?: Record<string, any> | null };

type LocationComponent = {
  lat?: number | null;
  lng?: number | null;
  radius?: number | string | null;
  location_hint?: string | null;
  location_mode?: string | null;
} | null;

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function hasPoint(lat: number | null, lng: number | null): boolean {
  return lat !== null && lng !== null && !(lat === 0 && lng === 0);
}

/**
 * PLAN_LOCATION_MAPS §6 fallback chain: own location → project location →
 * source-wish location. Returns the first entry with a usable point.
 */
function resolveLocation(
  ...candidates: Array<LocationComponent | { lat?: unknown; lng?: unknown; radius?: unknown; location_hint?: unknown } | null | undefined>
): { lat: number | null; lng: number | null; radius: number | null; hint: string | null } {
  for (const c of candidates) {
    if (!c) continue;
    const lat = num((c as any).lat);
    const lng = num((c as any).lng);
    if (hasPoint(lat, lng)) {
      return {
        lat,
        lng,
        radius: num((c as any).radius),
        hint: ((c as any).location_hint as string) ?? null
      };
    }
  }
  return { lat: null, lng: null, radius: null, hint: null };
}

/** Joinable wishes — consumer lens (QID 207). */
export function normalizeJoinableRatson(node: StrapiNode): MapItem | null {
  const a = node?.attributes;
  if (!a) return null;
  const isOnline = !!a.isOnline;
  const lat = num(a.lat);
  const lng = num(a.lng);
  const located = hasPoint(lat, lng);
  if (!located && !isOnline) return null;
  const joinersCount = a.ratson_shares?.data?.length ?? 0;
  return {
    id: String(node.id),
    kind: 'wish',
    // Privacy: a wish point is a person's point — snap it to the ~1km grid.
    lat: located ? roundCoord(lat as number) : null,
    lng: located ? roundCoord(lng as number) : null,
    radius: num(a.radius),
    title: a.name || '',
    hint: a.location_hint ?? null,
    isOnline,
    concierge: false,
    href: `/wish/${node.id}`,
    meta: {
      joinKind: a.joinKind ?? null,
      frequency: a.frequency ?? null,
      joinersCount,
      minJoiners: num(a.minJoiners),
      maxJoiners: num(a.maxJoiners),
      joinDeadline: a.joinDeadline ?? null,
      categories: (a.categories?.data ?? [])
        .map((c: any) => c?.attributes?.name)
        .filter(Boolean)
    }
  };
}

/** Open missions from rikmot / concierge — supplier lens (QID 208). */
export function normalizeOpenMission(node: StrapiNode): MapItem | null {
  const a = node?.attributes;
  if (!a) return null;
  const ratson = a.ratson?.data?.attributes ?? null;
  const project = a.project?.data ?? null;
  const loc = resolveLocation(a.location, project?.attributes?.location, ratson);
  const isOnline =
    a.location?.location_mode === 'online' || !!a.isglobal || (!!ratson?.isOnline && loc.lat === null);
  if (loc.lat === null && !isOnline) return null;
  return {
    id: String(node.id),
    kind: 'mission',
    lat: loc.lat,
    lng: loc.lng,
    radius: loc.radius,
    title: a.name || '',
    hint: loc.hint,
    isOnline,
    concierge: !!a.ratson?.data || a.source === 'concierge',
    href: `/availableMission/${node.id}`,
    meta: {
      projectName: project?.attributes?.projectName ?? null,
      hours: num(a.noofhours),
      perhour: num(a.perhour),
      skills: (a.skills?.data ?? [])
        .map((s: any) => s?.attributes?.skillName)
        .filter(Boolean)
    }
  };
}

/** Requested resources from rikmot / concierge — supplier lens (QID 209). */
export function normalizeOpenMashaabim(node: StrapiNode): MapItem | null {
  const a = node?.attributes;
  if (!a) return null;
  const ratson = a.ratson?.data?.attributes ?? null;
  const project = a.project?.data ?? null;
  const loc = resolveLocation(a.location, project?.attributes?.location, ratson);
  const isOnline =
    a.location?.location_mode === 'online' || (!!ratson?.isOnline && loc.lat === null);
  if (loc.lat === null && !isOnline) return null;
  return {
    id: String(node.id),
    kind: 'resource',
    lat: loc.lat,
    lng: loc.lng,
    radius: loc.radius,
    title: a.name || '',
    hint: loc.hint,
    isOnline,
    concierge: !!a.ratson?.data || a.source === 'concierge',
    href: `/availiableResorce/${node.id}`,
    meta: {
      projectName: project?.attributes?.projectName ?? null,
      kindOf: a.kindOf ?? null
    }
  };
}

/**
 * Demand pools + their open threshold offers (QID 210) — both lenses.
 * Returns [maagadItems, offerItems]. Aggregate counts only; the centroid is
 * already an aggregate but is rounded anyway (sparse-area privacy, §14.5).
 */
export function normalizeMaagadim(nodes: StrapiNode[]): [MapItem[], MapItem[]] {
  const maagadim: MapItem[] = [];
  const offers: MapItem[] = [];
  for (const node of nodes ?? []) {
    const a = node?.attributes;
    if (!a) continue;
    const isOnline = a.scope === 'global';
    const lat = num(a.lat);
    const lng = num(a.lng);
    const located = hasPoint(lat, lng);
    if (!located && !isOnline) continue;
    const membersCount = a.members?.data?.length ?? 0;
    const base = {
      lat: located ? roundCoord(lat as number) : null,
      lng: located ? roundCoord(lng as number) : null,
      radius: num(a.radius),
      hint: null,
      isOnline,
      concierge: false
    };
    maagadim.push({
      id: String(node.id),
      kind: 'maagad',
      title: a.name || '',
      href: `/maagad/${node.id}`,
      meta: {
        desc: a.canonical_desc ?? null,
        status: a.status_maagad ?? null,
        frequency: a.frequency ?? null,
        membersCount,
        viabilityHint: num(a.viability_hint),
        openOffers: a.offers?.data?.length ?? 0
      },
      ...base
    });
    for (const o of a.offers?.data ?? []) {
      const oa = o?.attributes;
      if (!oa) continue;
      offers.push({
        id: `${node.id}-${o.id}`,
        kind: 'offer',
        title: oa.title || a.name || '',
        // The offer lives on its pool page until a dedicated share page (M4).
        href: `/maagad/${node.id}`,
        meta: {
          unitPrice: num(oa.unit_price),
          signed: num(oa.signed_count) ?? 0,
          min: num(oa.min_participants),
          max: num(oa.max_participants),
          deadline: oa.sign_deadline ?? null
        },
        ...base
      });
    }
  }
  return [maagadim, offers];
}
