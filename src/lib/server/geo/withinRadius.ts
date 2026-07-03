import { haversineKm } from './haversine.js';

/**
 * Is point B inside point A's service radius (km)?
 * `radiusKm` null/0 → treated as "no declared range" and rejected,
 * so callers must apply their own fallback before calling.
 */
export function withinRadius(
  lat: number,
  lng: number,
  radiusKm: number | null | undefined,
  otherLat: number,
  otherLng: number
): boolean {
  if (!radiusKm || radiusKm <= 0) return false;
  return haversineKm(lat, lng, otherLat, otherLng) <= radiusKm;
}

/**
 * Mutual-range check used for clustering / supplier↔maagad matching
 * (PLAN_SHARED_PURCHASE §5.3): the distance must fit the *smaller* of the
 * two declared radii, so neither side is dragged beyond its own range.
 */
export function withinMutualRadius(
  aLat: number,
  aLng: number,
  aRadiusKm: number | null | undefined,
  bLat: number,
  bLng: number,
  bRadiusKm: number | null | undefined
): boolean {
  const r = Math.min(aRadiusKm || 0, bRadiusKm || 0);
  if (r <= 0) return false;
  return haversineKm(aLat, aLng, bLat, bLng) <= r;
}
