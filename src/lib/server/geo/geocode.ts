/**
 * Forward geocoding — a place name the writer typed ("Haifa", "רחוב הרצל 5,
 * תל אביב") to a point, for the concierge composer's location square.
 *
 * OpenStreetMap's Nominatim: free, no key, the same service LocationPicker
 * already reverse-geocodes with. Its usage policy is the constraint — at most
 * one request a second, an identifying User-Agent, and cache what you can —
 * so calls are serialised through one queue with a gap, and answers (misses
 * included) are kept in a bounded in-process cache.
 */

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = '1lev1.com concierge (https://1lev1.com)';
const MIN_GAP_MS = 1100;
const CACHE_MAX = 500;
const TIMEOUT_MS = 5000;

export interface GeoPoint {
  lat: number;
  lng: number;
  /** A short human label — "Haifa" rather than the full admin chain. */
  label: string;
}

const cache = new Map<string, GeoPoint | null>();
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

function remember(key: string, value: GeoPoint | null) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, value);
}

function shortLabel(hit: any, query: string): string {
  const a = hit?.address ?? {};
  const road = a.road || a.pedestrian;
  const city = a.city || a.town || a.village || a.municipality;
  const parts = [road && a.house_number ? `${road} ${a.house_number}` : road, city].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (typeof hit?.name === 'string' && hit.name) return hit.name;
  return query;
}

async function search(query: string, lang: string): Promise<GeoPoint | null> {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();

  const url =
    `${SEARCH_URL}?format=jsonv2&limit=1&addressdetails=1` +
    `&accept-language=${encodeURIComponent(lang)}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const hits = await res.json();
  const hit = Array.isArray(hits) ? hits[0] : null;
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label: shortLabel(hit, query) };
}

/** Resolve a place name, or null. Never throws — a miss just leaves the square empty. */
export async function geocodePlace(query: string, lang = 'he'): Promise<GeoPoint | null> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return null;
  const key = `${lang}|${q.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const run = queue.then(() => search(q, lang));
  queue = run.catch(() => undefined);
  try {
    const point = await run;
    remember(key, point);
    return point;
  } catch (err) {
    // Not cached: a timeout or a 429 says nothing about the place itself.
    console.warn('[geocode] failed for', q, err);
    return null;
  }
}
