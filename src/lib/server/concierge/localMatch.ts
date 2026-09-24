/**
 * Local matching for the concierge — pure, no I/O.
 *
 * Two questions the concierge asks about every provider it considers
 * (docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md):
 *
 *   1. *Can they reach her?* A product's location is its service area (a
 *      grocery's delivery radius); a member's is where they work. A physical
 *      provider whose area does not touch the wish is dropped, the rest are
 *      ordered nearest first. Online / unlocated providers are kept, after the
 *      located ones — we would rather show a suggestion than hide it from
 *      someone who never set a location (same rule as matching/geo.ts).
 *   2. *Which need does it answer?* A product name is matched to the wish's
 *      extracted missions/resources by shared words, so an automatic proposal
 *      lands on the plan row it covers, where the wisher can act on it.
 */

import { DEFAULT_ENTITY_RADIUS_KM, haversineKm, type GeoLocation } from '../matching/geo';

export interface WishPlace {
  lat?: number | string | null;
  lng?: number | string | null;
  /** km; the wish's own search radius */
  radius?: number | string | null;
  isOnline?: boolean | null;
}

export interface Reach {
  /** false ⇒ a physical provider out of range: do not suggest. */
  ok: boolean;
  /** km, one decimal; null when either side has no point (or is online). */
  distanceKm: number | null;
}

export function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function located(c: any): boolean {
  return !!c && toNum(c.lat) !== null && toNum(c.lng) !== null;
}

/** A wish with no point (or an online one) has no place to be far from. */
export function wishHasPlace(wish: WishPlace | null | undefined): wish is WishPlace {
  return !!wish && !wish.isOnline && located(wish);
}

/**
 * Where a product (matanot) serves. Every current product flow writes the
 * `location` component; older rows carry flat lat/lng; a product with neither
 * inherits its hosting rikma's location (PLAN_LOCATION_MAPS §6 fallback).
 */
export function productPlace(a: any): GeoLocation | null {
  const own = a?.location;
  const ownMode = own?.location_mode ?? null;
  if (ownMode === 'online' || ownMode === 'hybrid') return { location_mode: ownMode };
  const candidates = [
    own,
    { lat: a?.lat, lng: a?.lng, radius: a?.radius },
    a?.projectcreates?.data?.[0]?.attributes?.location
  ];
  for (const c of candidates) {
    if (!located(c)) continue;
    return {
      lat: toNum(c.lat),
      lng: toNum(c.lng),
      radius: toNum(c.radius),
      location_mode: ownMode ?? c.location_mode ?? null
    };
  }
  return null;
}

/** A member's located points (the repeatable `location` component). */
export function personPlaces(userAttrs: any): GeoLocation[] {
  const loc = userAttrs?.location;
  const list: any[] = !loc ? [] : Array.isArray(loc) ? loc : [loc];
  return list.filter(located);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Can a provider whose service area is `place` reach the wish?
 * Reach = the provider's radius (default 50km) + the wish's radius.
 */
export function reachFor(place: GeoLocation | null | undefined, wish: WishPlace | null | undefined): Reach {
  if (!wishHasPlace(wish)) return { ok: true, distanceKm: null };
  if (!place || place.location_mode === 'online' || place.location_mode === 'hybrid' || !located(place)) {
    return { ok: true, distanceKm: null };
  }
  const d = haversineKm(toNum(wish.lat)!, toNum(wish.lng)!, toNum(place.lat)!, toNum(place.lng)!);
  const reach = (toNum(place.radius) || DEFAULT_ENTITY_RADIUS_KM) + (toNum(wish.radius) || 0);
  return { ok: d <= reach, distanceKm: round1(d) };
}

/**
 * Can a member reach the wish? The wish is the entity here, as in the Lev
 * engine: reach = the wish's radius (default 50km) + the member point's
 * radius. Any one point in range is enough; the nearest is reported.
 */
export function reachForPerson(places: GeoLocation[], wish: WishPlace | null | undefined): Reach {
  if (!wishHasPlace(wish) || places.length === 0) return { ok: true, distanceKm: null };
  const wLat = toNum(wish.lat)!;
  const wLng = toNum(wish.lng)!;
  const wRadius = toNum(wish.radius) || DEFAULT_ENTITY_RADIUS_KM;
  let best: number | null = null;
  let ok = false;
  for (const p of places) {
    const d = haversineKm(wLat, wLng, toNum(p.lat)!, toNum(p.lng)!);
    if (d <= wRadius + (toNum(p.radius) || 0)) ok = true;
    if (best === null || d < best) best = d;
  }
  return { ok, distanceKm: best === null ? null : round1(best) };
}

/** Nearest first; providers with no known distance keep their order, after. */
export function byDistance<T extends { distanceKm?: number | null }>(a: T, b: T): number {
  const da = a.distanceKm ?? null;
  const db = b.distanceKm ?? null;
  if (da === null && db === null) return 0;
  if (da === null) return 1;
  if (db === null) return -1;
  return da - db;
}

// ── Text relevance ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'עד', 'את', 'של', 'עם', 'על', 'או', 'גם', 'כל', 'לי', 'אני', 'זה', 'מה', 'אל', 'לכל',
  'the', 'and', 'for', 'with', 'from', 'to', 'of', 'a', 'an', 'my'
]);

/** Words worth matching on: 3+ letters, not a connective. */
export function significantTokens(s: string): string[] {
  return String(s || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

/** A Hebrew word without its one-letter prefix (ה ו ב ל מ ש כ): "לבית" → "בית". */
function stem(t: string): string {
  return t.length >= 4 && /^[הובלמשכ]/.test(t) ? t.slice(1) : t;
}

/**
 * Two words match when one contains the other, with or without a Hebrew
 * prefix letter — "הבית" / "לבית", "משלוחים" / "משלוח".
 */
function tokenMatch(a: string, b: string): boolean {
  for (const x of [a, stem(a)]) {
    for (const y of [b, stem(b)]) {
      if (x.length >= 3 && y.length >= 3 && (x.includes(y) || y.includes(x))) return true;
    }
  }
  return false;
}

/** Share of the need's words that appear in `text` (0..1). */
export function textRelevance(need: string, text: string): number {
  const needTokens = significantTokens(need);
  const textTokens = significantTokens(text);
  if (needTokens.length === 0 || textTokens.length === 0) return 0;
  const hit = needTokens.filter((n) => textTokens.some((t) => tokenMatch(n, t))).length;
  return hit / needTokens.length;
}

export interface WishNeed {
  name: string;
  isResource: boolean;
  /** Position in extracted_missions / extracted_resources (per kind). */
  idx: number;
}

/** The need a text answers best, or null when it shares no word with any. */
export function bestNeedFor(needs: WishNeed[], text: string): { need: WishNeed; score: number } | null {
  let best: { need: WishNeed; score: number } | null = null;
  for (const need of needs) {
    const score = textRelevance(need.name, text);
    if (score > 0 && (!best || score > best.score)) best = { need, score };
  }
  return best;
}

/** Share of the wish's category labels that relate to one of `names` (0..1). */
export function labelOverlap(labels: string[], names: string[]): number {
  const clean = labels.filter((l) => significantTokens(l).length > 0);
  if (clean.length === 0 || names.length === 0) return 0;
  const joined = names.join(' ');
  const hit = clean.filter((l) => textRelevance(l, joined) > 0).length;
  return hit / clean.length;
}
