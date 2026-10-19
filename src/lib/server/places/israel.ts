import { placeKey, placeKeys } from '$lib/shop/shipping';

/**
 * Israel's localities and streets, from the CBS lists on data.gov.il
 * (docs/inprogress/PLAN_SHOP_SHIPPING.md §3).
 *
 * Two uses: a buyer's address is typed against real names (autocomplete), and
 * a city is resolved to its district (נפה) on the server, so a zone defined
 * as "נפת חיפה" covers every locality in it without anyone listing them.
 *
 * The localities list is ~1,300 rows and changes a few times a year: it is
 * fetched once and kept for a day per server instance. Streets are ~60k rows
 * and asked per city. When data.gov.il does not answer, everything here
 * degrades to "unknown" — a buyer can still type a city by hand, and a zone
 * by city name still matches it.
 */

const API = 'https://data.gov.il/api/3/action/datastore_search';
export const CITIES_RESOURCE = '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba';
export const STREETS_RESOURCE = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b';
const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 6000;

export interface Locality {
  code: string;
  name: string;
  nameEn: string | null;
  district: string | null;
}

const clean = (v: unknown): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : String(v ?? '').trim());

/** One row of the CBS list → a locality, or null for the placeholder rows. */
export function localityOf(r: Record<string, unknown>): Locality | null {
  const code = clean(r['סמל_ישוב']);
  const name = clean(r['שם_ישוב']);
  if (!code || code === '0' || !name || /^לא רשום$/.test(name)) return null;
  const en = clean(r['שם_ישוב_לועזי']);
  const district = clean(r['שם_נפה']);
  return {
    code,
    name,
    nameEn: en ? en.toLowerCase().replace(/(^|[\s-])\S/g, (s) => s.toUpperCase()) : null,
    district: district || null
  };
}

let cache: { at: number; ttl: number; list: Locality[] } | null = null;
let inflight: Promise<Locality[]> | null = null;

async function fetchJson(url: string, fetchFn: typeof fetch): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`data.gov.il ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Every locality, cached. Never throws — an empty list means "unknown right now". */
export async function localities(fetchFn: typeof fetch = fetch): Promise<Locality[]> {
  const now = Date.now();
  if (cache && now - cache.at < cache.ttl) return cache.list;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const body = await fetchJson(`${API}?resource_id=${CITIES_RESOURCE}&limit=5000`, fetchFn);
      const list = ((body?.result?.records ?? []) as Record<string, unknown>[])
        .map(localityOf)
        .filter((l): l is Locality => !!l)
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));
      cache = { at: Date.now(), ttl: list.length ? DAY_MS : RETRY_MS, list };
      return list;
    } catch (e) {
      console.warn('[places] localities could not be read — city search and districts are off for now:', String(e));
      cache = { at: Date.now(), ttl: RETRY_MS, list: cache?.list ?? [] };
      return cache.list;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Test seam. */
export function resetPlacesCache(): void {
  cache = null;
  inflight = null;
}

/** The district names (נפות), for the zone editor. */
export function districtsOf(list: Locality[]): string[] {
  return [...new Set(list.map((l) => l.district).filter((d): d is string => !!d))].sort((a, b) =>
    a.localeCompare(b, 'he')
  );
}

/** Localities whose name starts with the query first, then those that contain it. */
export function searchLocalities(list: Locality[], q: string, limit = 12): Locality[] {
  const key = placeKey(q);
  if (!key) return [];
  const starts: Locality[] = [];
  const has: Locality[] = [];
  for (const l of list) {
    const keys = [placeKey(l.name), placeKey(l.nameEn)];
    if (keys.some((k) => k.startsWith(key))) starts.push(l);
    else if (keys.some((k) => k.includes(key))) has.push(l);
    if (starts.length >= limit) break;
  }
  return [...starts, ...has].slice(0, limit);
}

/** The locality a typed name means — exact on the name or its part before " - ". */
export function findLocality(list: Locality[], name: string | null | undefined): Locality | null {
  const keys = placeKeys(name);
  if (!keys.length) return null;
  return list.find((l) => placeKeys(l.name).some((k) => keys.includes(k)) || keys.includes(placeKey(l.nameEn))) ?? null;
}

export async function districtOfCity(name: string | null | undefined, fetchFn: typeof fetch = fetch): Promise<string | null> {
  if (!name) return null;
  return findLocality(await localities(fetchFn), name)?.district ?? null;
}

const streetCache = new Map<string, { at: number; list: string[] }>();

/** Street names of one locality matching the query (by CBS locality code). */
export async function searchStreets(
  cityCode: string,
  q: string,
  fetchFn: typeof fetch = fetch,
  limit = 12
): Promise<string[]> {
  if (!/^\d{1,6}$/.test(cityCode)) return [];
  const now = Date.now();
  let entry = streetCache.get(cityCode);
  if (!entry || now - entry.at > DAY_MS) {
    try {
      const filters = encodeURIComponent(JSON.stringify({ 'סמל_ישוב': Number(cityCode) }));
      const body = await fetchJson(`${API}?resource_id=${STREETS_RESOURCE}&filters=${filters}&limit=5000`, fetchFn);
      const list = [
        ...new Set(((body?.result?.records ?? []) as Record<string, unknown>[]).map((r) => clean(r['שם_רחוב'])))
      ].filter(Boolean);
      entry = { at: now, list };
      if (streetCache.size > 300) streetCache.clear();
      streetCache.set(cityCode, entry);
    } catch (e) {
      console.warn('[places] streets could not be read:', String(e));
      return [];
    }
  }
  const key = placeKey(q);
  if (!key) return entry.list.slice(0, limit);
  const starts = entry.list.filter((s) => placeKey(s).startsWith(key));
  const has = entry.list.filter((s) => !placeKey(s).startsWith(key) && placeKey(s).includes(key));
  return [...starts, ...has].slice(0, limit);
}
