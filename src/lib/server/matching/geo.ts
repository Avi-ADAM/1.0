/**
 * Location compatibility for match suggestions.
 *
 * Entities (open-mission / open-mashaabim) carry a single `new.location`
 * component; users carry a repeatable list of them. Rules:
 *
 *  - an entity that is online/hybrid, or has no coordinates, matches everyone;
 *  - a physical entity (onsite, or coordinates with no explicit mode) matches
 *    a user when ANY of the user's located points is within the combined
 *    radius (entity radius + user point radius, entity default 50km);
 *  - a user with no located points is NOT excluded — we'd rather show a
 *    suggestion than silently hide it from someone who never set a location.
 */

export interface GeoLocation {
  lat?: number | string | null;
  lng?: number | string | null;
  /** biginteger in Strapi → arrives as a string over GraphQL; km */
  radius?: number | string | null;
  location_mode?: 'online' | 'onsite' | 'hybrid' | 'unspecified' | string | null;
}

/** Default reach of a physical entity with coordinates but no radius. */
export const DEFAULT_ENTITY_RADIUS_KM = 50;

const EARTH_RADIUS_KM = 6371;

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function hasCoords(loc: GeoLocation | null | undefined): loc is GeoLocation {
  return !!loc && toNum(loc.lat) !== null && toNum(loc.lng) !== null;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Can this user plausibly serve/do this entity, location-wise?
 *
 * @param entityLoc - the open-mission / open-mashaabim `location` component
 * @param userLocs - the user's repeatable `location` components
 */
export function isLocationCompatible(
  entityLoc: GeoLocation | null | undefined,
  userLocs: GeoLocation[] | null | undefined
): boolean {
  // Online / hybrid / unlocated entity → anyone can do it.
  if (!entityLoc) return true;
  const mode = entityLoc.location_mode;
  if (mode === 'online' || mode === 'hybrid') return true;
  if (!hasCoords(entityLoc)) return true;

  // Physical entity. Users without any located point are kept (see header).
  const locatedPoints = (userLocs ?? []).filter(hasCoords);
  if (locatedPoints.length === 0) return true;

  const eLat = toNum(entityLoc.lat)!;
  const eLng = toNum(entityLoc.lng)!;
  const eRadius = toNum(entityLoc.radius) || DEFAULT_ENTITY_RADIUS_KM;

  return locatedPoints.some((p) => {
    const reach = eRadius + (toNum(p.radius) || 0);
    return haversineKm(eLat, eLng, toNum(p.lat)!, toNum(p.lng)!) <= reach;
  });
}
