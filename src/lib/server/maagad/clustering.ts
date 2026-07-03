/**
 * Demand-aggregation clustering — PLAN_SHARED_PURCHASE §5, PLAN_DISCOVERY_MAP.
 *
 * Pure, I/O-free logic so the "10 people want the same thing" detection is
 * unit-testable and calibratable offline. The `clusterRatsons` action wires
 * these decisions to Strapi (queries open wishes, creates maagadim + suggested
 * members).
 *
 * Two-stage per §5:
 *   1. Semantic similarity — a score in [0,1]. Here we use category overlap +
 *      name-token Jaccard as the initial signal; the production upgrade is
 *      Pinecone cosine on the wish embeddings, dropped into `similarity()`
 *      without touching the gates.
 *   2. Hard compatibility gates (§5.3) — NOT scored, mandatory: scope/geo,
 *      frequency, shared category. A pair must pass every gate to cluster.
 */

import { haversineKm } from '../geo/haversine.js';

export interface ClusterWish {
  id: string;
  name: string;
  isOnline: boolean;
  lat: number | null;
  lng: number | null;
  /** km */
  radius: number | null;
  frequency: string | null;
  categoryIds: string[];
  language?: string | null;
}

export interface ClusterOptions {
  /** Minimum semantic similarity to consider two wishes the same demand. */
  simThreshold?: number;
  /** Minimum cluster size to materialise a maagad (§5.4, default K=3). */
  minClusterSize?: number;
}

const DEFAULTS: Required<ClusterOptions> = {
  simThreshold: 0.34,
  minClusterSize: 3
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'to', 'and', 'or', 'with', 'my', 'i', 'we',
  'want', 'need', 'looking', 'שבוע', 'של', 'עם', 'אני', 'רוצה', 'מחפש', 'מחפשת',
  'צריך', 'צריכה', 'כל', 'את', 'לי'
]);

function tokenize(text: string): Set<string> {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Semantic similarity in [0,1]. Blends name-token Jaccard with category
 * overlap. Replace the body with Pinecone cosine when embeddings are wired —
 * callers and gates stay unchanged.
 */
export function similarity(a: ClusterWish, b: ClusterWish): number {
  const nameSim = jaccard(tokenize(a.name), tokenize(b.name));
  const catA = new Set(a.categoryIds);
  const catB = new Set(b.categoryIds);
  const catSim = jaccard(catA, catB);
  // Name carries most of the signal; shared category reinforces it.
  return 0.65 * nameSim + 0.35 * catSim;
}

/**
 * Hard gates (§5.3). Returns true only if the pair may legitimately share a
 * demand pool regardless of similarity score.
 */
export function isCompatible(a: ClusterWish, b: ClusterWish): boolean {
  // Frequency: a weekly basket is not the same demand as a one-time buy.
  const fa = a.frequency || 'one_time';
  const fb = b.frequency || 'one_time';
  if (fa !== fb) return false;

  // Category: at least one shared category is mandatory.
  const shareCategory = a.categoryIds.some((c) => b.categoryIds.includes(c));
  if (!shareCategory) return false;

  // Scope/geo:
  const bothOnline = a.isOnline && b.isOnline;
  if (bothOnline) {
    // Digital/remote demand ignores geo; only language must match (if known).
    if (a.language && b.language && a.language !== b.language) return false;
    return true;
  }
  // A physical wish cannot cluster with an online-only one.
  if (a.isOnline !== b.isOnline) return false;

  // Both physical → mutual-radius geo check (§5.3): distance must fit the
  // smaller declared radius so neither is dragged out of range.
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return false;
  const r = Math.min(a.radius || 0, b.radius || 0);
  if (r <= 0) return false;
  return haversineKm(a.lat, a.lng, b.lat, b.lng) <= r;
}

export interface Cluster {
  members: ClusterWish[];
  /** Centroid (null when the cluster is online/global). */
  lat: number | null;
  lng: number | null;
  /** Max member→centroid distance (km), for the pool's coverage radius. */
  radiusKm: number | null;
  online: boolean;
  /** Union of member category ids. */
  categoryIds: string[];
  frequency: string | null;
}

function centroidOf(members: ClusterWish[]): {
  lat: number | null;
  lng: number | null;
  radiusKm: number | null;
} {
  const located = members.filter((m) => m.lat != null && m.lng != null);
  if (located.length === 0) return { lat: null, lng: null, radiusKm: null };
  const lat = located.reduce((s, m) => s + (m.lat as number), 0) / located.length;
  const lng = located.reduce((s, m) => s + (m.lng as number), 0) / located.length;
  const radiusKm = located.reduce(
    (max, m) => Math.max(max, haversineKm(lat, lng, m.lat as number, m.lng as number)),
    0
  );
  return { lat, lng, radiusKm: Math.ceil(radiusKm) };
}

/**
 * Greedy single-link clustering: seed a cluster from an unassigned wish, then
 * absorb any wish that is both compatible (gates) and similar-enough to the
 * seed. Simple and deterministic; good enough at the scale the plan targets
 * (calibrate `simThreshold` on real data, §14.1).
 */
export function clusterWishes(
  wishes: ClusterWish[],
  options: ClusterOptions = {}
): Cluster[] {
  const { simThreshold, minClusterSize } = { ...DEFAULTS, ...options };
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const seed of wishes) {
    if (assigned.has(seed.id)) continue;
    const members = [seed];
    assigned.add(seed.id);

    for (const candidate of wishes) {
      if (assigned.has(candidate.id)) continue;
      if (!isCompatible(seed, candidate)) continue;
      if (similarity(seed, candidate) < simThreshold) continue;
      members.push(candidate);
      assigned.add(candidate.id);
    }

    if (members.length < minClusterSize) {
      // Not enough to be worth a pool — release the members for future runs.
      for (const m of members) assigned.delete(m.id);
      continue;
    }

    const online = members.every((m) => m.isOnline);
    const geo = centroidOf(members);
    const categoryIds = [...new Set(members.flatMap((m) => m.categoryIds))];
    clusters.push({
      members,
      lat: online ? null : geo.lat,
      lng: online ? null : geo.lng,
      radiusKm: online ? null : geo.radiusKm,
      online,
      categoryIds,
      frequency: seed.frequency || 'one_time'
    });
  }

  return clusters;
}
