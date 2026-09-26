/**
 * External offers for the concierge — the pipeline between a wish's gaps and
 * the "מהרשת" cards on /concierge/[id]
 * (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §3, §4.2, §4.4).
 *
 *   gaps → buildQueries → provider.search → normalizeResults → dedupe → cache
 *
 * Everything here is pure except `searchExternalOffers`, whose only I/O is the
 * injected provider.
 *
 * §3 is enforced in code, not by convention: `ExternalOffer` has no field for
 * page content, `normalizeResults` is the only way to make one, and it cuts
 * every field to its limit, strips markup and drops anything without a live
 * http(s) link. A future change that wants to show more has to change the
 * type — which is the review this file asks for.
 */

import { createHash } from 'node:crypto';
import { textRelevance } from './localMatch';
import type { NeedCoverage, NeedKind } from './coverage';
import type {
  ExternalProviderId,
  ExternalQuery,
  ExternalSearchProvider,
  RawExternalResult
} from './searchProviders/index';

export const LIMITS = {
  title: 120,
  snippet: 200,
  locationLabel: 60,
  need: 80,
  perNeed: 5,
  total: 15
} as const;

/** A pointer to an outside offer — metadata only, never content (§3.1). */
export interface ExternalOffer {
  /** hash(url) — stable across runs; what "not relevant" dismisses. */
  id: string;
  title: string;
  snippet: string | null;
  url: string;
  domain: string;
  price: number | null;
  currency: string | null;
  locationLabel: string | null;
  /** The plan row it answers. `name` guards against the plan being edited. */
  matchedNeed: { key: string; kind: NeedKind; name: string };
  score: number;
  provider: ExternalProviderId;
  fetchedAt: string;
}

/** `ratson.ai_meta.external` (§4.4). */
export interface ExternalCache {
  version: 1;
  fetchedAt: string;
  provider: ExternalProviderId | null;
  queries: { key: string; need: string; locationLabel: string | null }[];
  gaps: { key: string; coverage: 'weak' | 'uncovered' }[];
  offers: ExternalOffer[];
  dismissed: string[];
}

// ── Identity ───────────────────────────────────────────────────────────────

export function offerIdOf(url: string): string {
  return createHash('sha1').update(url.trim()).digest('hex').slice(0, 16);
}

/** `https://www.Shop.co.il/x` → `shop.co.il`; null when it is not http(s). */
export function domainOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.hostname.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

// ── Text hygiene ───────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' '
};

/** Markup out, entities decoded, whitespace collapsed. */
export function plainText(s: unknown): string {
  return String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut to `max` characters on a word boundary where there is one, with "…". */
export function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd() + '…';
}

const CURRENCY_SIGNS: Record<string, string> = { '₪': 'ILS', $: 'USD', '€': 'EUR', '£': 'GBP' };

/** A published price, or null. "₪350", "350 ש״ח", 350 → 350. */
export function parsePrice(v: unknown): { price: number | null; currency: string | null } {
  if (typeof v === 'number') return { price: Number.isFinite(v) && v > 0 ? v : null, currency: null };
  const s = String(v ?? '');
  const m = s.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!m) return { price: null, currency: null };
  const price = Number(m[0]);
  const sign = Object.keys(CURRENCY_SIGNS).find((k) => s.includes(k));
  const currency = sign
    ? CURRENCY_SIGNS[sign]
    : /ש["״']?ח|שקל|nis|ils/i.test(s)
      ? 'ILS'
      : null;
  return { price: Number.isFinite(price) && price > 0 ? price : null, currency };
}

// ── Privacy: what may leave the platform (§7) ──────────────────────────────

const STREET_WORDS =
  /(^|\s)(רחוב|רח['׳]?|שד['׳]|שדרות|דרך|סמטת|כיכר|street|st\.?|road|rd\.?|avenue|ave\.?|lane|blvd\.?|ул\.?|улица|calle|av\.?|شارع)(\s|$)/i;

/**
 * A place the wisher typed, cut to settlement level: "הרצל 12, חיפה, ישראל"
 * → "חיפה". Parts carrying a number or a street word are dropped, and so is a
 * trailing country, so no address and no point ever reaches a provider.
 */
export function coarseLocationLabel(hint: string | null | undefined): string | null {
  const parts = plainText(hint)
    .split(/[,،\n]/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2 && !/\d/.test(p) && !STREET_WORDS.test(p) && !/@/.test(p));
  if (parts.length === 0) return null;
  const COUNTRIES = /^(ישראל|israel|израиль|إسرائيل|israel)$/i;
  const settlements = parts.length > 1 ? parts.filter((p) => !COUNTRIES.test(p)) : parts;
  const pick = settlements[0] ?? parts[0];
  return clip(pick, 40);
}

/** Emails, phone numbers and links out of a need name — it is all we send. */
export function scrubNeed(name: string): string {
  return clip(
    plainText(name)
      .replace(/\S+@\S+/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\+?\d[\d\s-]{6,}\d/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    LIMITS.need
  );
}

export interface WishGeo {
  locationHint?: string | null;
  isOnline?: boolean | null;
}

/**
 * One query per gap, and the only door out (§7): the need, a coarse place
 * label and the language. Never the wish text, the wisher, the budget or a
 * coordinate — `ExternalQuery` has no field for them.
 */
export function buildQueries(gaps: NeedCoverage[], geo: WishGeo, language: string | null): ExternalQuery[] {
  const locationLabel = geo.isOnline ? null : coarseLocationLabel(geo.locationHint);
  const lang = /^(he|en|ru|ar|es)$/.test(String(language ?? '')) ? String(language) : 'he';
  const out: ExternalQuery[] = [];
  for (const g of gaps) {
    const need = scrubNeed(g.name);
    if (need.length < 2) continue;
    out.push({ key: g.key, need, locationLabel, language: lang, kind: g.kind });
  }
  return out;
}

// ── Normalisation (§3.1 in code) ───────────────────────────────────────────

export interface NormalizeOptions {
  provider: ExternalProviderId;
  need: { key: string; kind: NeedKind; name: string };
  blocklist?: string[];
  now?: Date;
}

function blocked(domain: string, blocklist: string[]): boolean {
  return blocklist.some((b) => domain === b || domain.endsWith(`.${b}`));
}

/**
 * Provider results → offers. Drops anything without an http(s) link or on the
 * blocklist, keeps one card per domain, cuts every field to its limit. Scored
 * by how much of the need the title and snippet mention, which is also the
 * order they are shown in.
 */
export function normalizeResults(raw: RawExternalResult[], opts: NormalizeOptions): ExternalOffer[] {
  const blocklist = opts.blocklist ?? [];
  const fetchedAt = (opts.now ?? new Date()).toISOString();
  const byDomain = new Map<string, ExternalOffer>();
  for (const r of Array.isArray(raw) ? raw : []) {
    const url = typeof r?.url === 'string' ? r.url.trim() : '';
    const domain = url ? domainOf(url) : null;
    if (!domain || blocked(domain, blocklist) || byDomain.has(domain)) continue;
    const title = clip(plainText(r.title) || domain, LIMITS.title);
    const snippetText = plainText(r.snippet);
    const snippet = snippetText ? clip(snippetText, LIMITS.snippet) : null;
    const parsed = parsePrice(r.price);
    const currencyRaw = plainText(r.currency).toUpperCase();
    const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : parsed.currency;
    const loc = plainText(r.locationLabel);
    const score =
      Math.round(
        Math.max(
          textRelevance(opts.need.name, `${title} ${snippet ?? ''}`),
          textRelevance(opts.need.name, domain.replace(/[.-]/g, ' ')) * 0.5
        ) * 100
      ) / 100;
    byDomain.set(domain, {
      id: offerIdOf(url),
      title,
      snippet,
      url,
      domain,
      price: parsed.price,
      currency: parsed.price === null ? null : currency,
      locationLabel: loc ? clip(loc, LIMITS.locationLabel) : null,
      matchedNeed: { ...opts.need },
      score,
      provider: opts.provider,
      fetchedAt
    });
  }
  return [...byDomain.values()].sort((a, b) => b.score - a.score);
}

/**
 * Outside offers never double an inside one (§4.2): a card whose title names a
 * rikma or product the wish was already offered is dropped. Then caps — per
 * need and in total — and one card per id across the whole run.
 */
export function dedupeAgainstInternal(
  offers: ExternalOffer[],
  internalNames: string[],
  perNeed: number = LIMITS.perNeed,
  total: number = LIMITS.total
): ExternalOffer[] {
  const names = internalNames.map((n) => plainText(n)).filter((n) => n.length >= 3);
  const seen = new Set<string>();
  const perKey = new Map<string, number>();
  const out: ExternalOffer[] = [];
  for (const o of offers) {
    if (seen.has(o.id)) continue;
    if (names.some((n) => textRelevance(n, o.title) >= 0.8)) continue;
    const count = perKey.get(o.matchedNeed.key) ?? 0;
    if (count >= perNeed) continue;
    seen.add(o.id);
    perKey.set(o.matchedNeed.key, count + 1);
    out.push(o);
    if (out.length >= total) break;
  }
  return out;
}

// ── The run ────────────────────────────────────────────────────────────────

export interface SearchRun {
  queries: ExternalQuery[];
  offers: ExternalOffer[];
  /** Needs whose search failed — a run with some failures still saves the rest. */
  failed: string[];
}

/** One search per gap, in parallel; a failed need degrades to no cards. */
export async function searchExternalOffers(input: {
  gaps: NeedCoverage[];
  geo: WishGeo;
  language: string | null;
  provider: ExternalSearchProvider;
  internalNames?: string[];
  blocklist?: string[];
  now?: Date;
}): Promise<SearchRun> {
  const queries = buildQueries(input.gaps, input.geo, input.language);
  const byKey = new Map(input.gaps.map((g) => [g.key, g]));
  const failed: string[] = [];
  const perQuery = await Promise.all(
    queries.map(async (q) => {
      const gap = byKey.get(q.key)!;
      try {
        const raw = await input.provider.search(q);
        return normalizeResults(raw, {
          provider: input.provider.id,
          need: { key: q.key, kind: gap.kind, name: gap.name },
          blocklist: input.blocklist,
          now: input.now
        });
      } catch (err) {
        console.warn(`[externalOffers] ${input.provider.id} search failed for ${q.key}:`, err);
        failed.push(q.key);
        return [];
      }
    })
  );
  const offers = dedupeAgainstInternal(perQuery.flat(), input.internalNames ?? []);
  return { queries, offers, failed };
}

// ── The cache ──────────────────────────────────────────────────────────────

/** A saved run, if the value is one — ai_meta is free JSON. */
export function readCache(v: unknown): ExternalCache | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Partial<ExternalCache>;
  if (c.version !== 1 || typeof c.fetchedAt !== 'string' || !Array.isArray(c.offers)) return null;
  return {
    version: 1,
    fetchedAt: c.fetchedAt,
    provider: (c.provider ?? null) as ExternalProviderId | null,
    queries: Array.isArray(c.queries) ? c.queries : [],
    gaps: Array.isArray(c.gaps) ? c.gaps : [],
    offers: c.offers,
    dismissed: Array.isArray(c.dismissed) ? c.dismissed.map(String) : []
  };
}

export function ageHours(cache: Pick<ExternalCache, 'fetchedAt'>, now: Date = new Date()): number {
  const t = Date.parse(cache.fetchedAt);
  return Number.isFinite(t) ? (now.getTime() - t) / 3_600_000 : Infinity;
}

/**
 * What the page may show from a saved run: nothing once it is older than the
 * TTL (stale prices, dead links), never a dismissed card, and never a card
 * whose row has since been renamed or removed.
 */
export function visibleOffers(
  cache: ExternalCache | null,
  rows: { key: string; name: string }[],
  ttlHours: number,
  now: Date = new Date()
): ExternalOffer[] {
  if (!cache || ageHours(cache, now) > ttlHours) return [];
  const names = new Map(rows.map((r) => [r.key, r.name.trim().toLowerCase()]));
  const dismissed = new Set(cache.dismissed);
  return cache.offers.filter(
    (o) =>
      !dismissed.has(o.id) &&
      names.get(o.matchedNeed?.key) === String(o.matchedNeed?.name ?? '').trim().toLowerCase()
  );
}
