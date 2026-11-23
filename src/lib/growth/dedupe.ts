/**
 * Is this the same business? (docs/inprogress/PLAN_GROWTH_AGENT.md §3.3)
 *
 * A business is identified by any one of: its website's host, its phone, its
 * email, or its name together with its city. Two records sharing any key are
 * the same business — the second is not added, and a business that asked not
 * to be contacted keeps its keys so it is never imported again.
 *
 * Pure: the server hashes these keys before storing them.
 */

/** `https://www.Example.co.il/about?x` → `example.co.il`. */
export function hostKey(url: string | null | undefined): string | null {
  const raw = (url ?? '').trim();
  if (!raw) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    if (!host.includes('.')) return null;
    // A page on a shared host is a profile, not a business's own site.
    if (SHARED_HOSTS.has(host)) {
      const path = u.pathname.replace(/\/+$/, '').toLowerCase();
      return path ? `${host}${path}` : null;
    }
    return host;
  } catch {
    return null;
  }
}

/** Hosts where many businesses each have a page — the path is the identity. */
const SHARED_HOSTS = new Set([
  'facebook.com',
  'm.facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'wa.me',
  'linktr.ee',
  'sites.google.com',
  'business.site',
  'wixsite.com'
]);

/**
 * Digits only, with an Israeli leading 0 written as +972 — the platform's
 * home market — so `054-1234567` and `+972 54 123 4567` are one phone.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  let d = (phone ?? '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (/^0\d{8,9}$/.test(d)) d = `972${d.slice(1)}`;
  d = d.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15 ? d : null;
}

export function emailKey(email: string | null | undefined): string | null {
  const e = (email ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** Letters and digits of any script, lower-cased, single-spaced. */
export function normName(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/["'`׳״]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function nameCityKey(name: string | null | undefined, city: string | null | undefined): string | null {
  const n = normName(name);
  const c = normName(city);
  return n && c ? `${n}|${c}` : null;
}

/** Every identity key of a business, prefixed by kind so `host:` never meets `email:`. */
export function identityKeys(b: {
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  city?: string | null;
}): string[] {
  const keys: string[] = [];
  const h = hostKey(b.website);
  if (h) keys.push(`host:${h}`);
  const p = phoneKey(b.phone);
  if (p) keys.push(`phone:${p}`);
  const e = emailKey(b.email);
  if (e) keys.push(`email:${e}`);
  const nc = nameCityKey(b.name, b.city);
  if (nc) keys.push(`name:${nc}`);
  return keys;
}

/** Split a batch into the first of each business and the repeats inside it. */
export function dedupeBatch<T>(
  rows: T[],
  keysOf: (row: T) => string[],
  known: ReadonlySet<string> = new Set()
): { fresh: { row: T; keys: string[]; index: number }[]; repeats: { row: T; index: number; key: string; inBatch: boolean }[] } {
  const seen = new Set<string>();
  const fresh: { row: T; keys: string[]; index: number }[] = [];
  const repeats: { row: T; index: number; key: string; inBatch: boolean }[] = [];
  rows.forEach((row, index) => {
    const keys = keysOf(row);
    const hitKnown = keys.find((k) => known.has(k));
    if (hitKnown) {
      repeats.push({ row, index, key: hitKnown, inBatch: false });
      return;
    }
    const hitBatch = keys.find((k) => seen.has(k));
    if (hitBatch) {
      repeats.push({ row, index, key: hitBatch, inBatch: true });
      return;
    }
    keys.forEach((k) => seen.add(k));
    fresh.push({ row, keys, index });
  });
  return { fresh, repeats };
}
