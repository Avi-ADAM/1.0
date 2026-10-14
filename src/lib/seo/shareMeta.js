/**
 * What a public page puts in its head so the link *unfurls* well — the
 * canonical address, the share-card image, and the structured data for the
 * two demand objects (PLAN_MARKETING_GLOBAL §4, §6.1).
 *
 * Addresses follow the one scheme the whole site agrees on (app.html's
 * hreflang table, the sitemap, hooks.server.js): Hebrew is the bare path, the
 * other languages are `?lang=` variants, and the host is always the public
 * one — never `page.url`, which would leak localhost, a preview host or the
 * Tauri origin into somebody's WhatsApp.
 */
import website from '$lib/config/website';

export const SITE = String(website.siteUrl).replace(/\/+$/, '');
export const LANGS = ['he', 'en', 'ar', 'ru', 'es'];

/** The language the *address* asked for — `?lang=` when valid, else Hebrew (the default). */
export function askedLang(url) {
  const l = url?.searchParams?.get('lang');
  return l && LANGS.includes(l) ? l : 'he';
}

/** `https://1lev1.com/maagad/12` or `…/maagad/12?lang=en`. */
export function canonicalFor(pathname, lang) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${SITE}${path}${lang && lang !== 'he' ? `?lang=${lang}` : ''}`;
}

/**
 * The share card for one object (`/api/og/<kind>/<id>.png`).
 *
 * `version` is anything that changes when the card should: the chat apps
 * cache a preview by image URL, so a pool that went from 7 to 10 signatures
 * must become a *new* URL or every old share keeps showing 7.
 *
 * @param {'maagad'|'wish'} kind
 * @param {string|number} id
 * @param {string} lang
 * @param {string|number} [version]
 */
export function ogImageFor(kind, id, lang, version) {
  const q = new URLSearchParams();
  if (lang && lang !== 'he') q.set('lang', lang);
  if (version !== undefined && version !== null && version !== '') q.set('v', String(version));
  const qs = q.toString();
  return `${SITE}/api/og/${kind}/${encodeURIComponent(String(id))}.png${qs ? `?${qs}` : ''}`;
}

/** One line, no markup, at most `max` characters — what a description tag can hold. */
export function oneLine(text, max = 200) {
  const s = String(text ?? '')
    .replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = [...s];
  return chars.length > max ? chars.slice(0, max - 1).join('') + '…' : s;
}

/**
 * schema.org for a demand pool: the pool is a `Demand`, each live threshold
 * offer an `Offer` with its price, deadline and the quantity it needs.
 *
 * Only what the page shows a guest: aggregate counts and the offers' terms.
 * Member identities never enter here (PLAN_SHARED_PURCHASE §2.6).
 *
 * @param {{ id: string, name: string, desc?: string, membersCount: number, createdAt?: string|null,
 *   categories?: string[], offers: Array<{ id: string, title: string, description?: string,
 *   unitPrice?: number|null, priceCurrent?: number|null, currency?: string|null, currencyCode?: string|null,
 *   min?: number|null, max?: number|null, deadline?: string|null, status: string, proposerName?: string|null }> }} m
 * @param {string} url canonical address of the page
 */
export function maagadJsonLd(m, url) {
  const live = m.offers.filter((o) => ['open', 'quorum_reached', 'activated'].includes(o.status));
  const offers = live.map((o) => {
    const price = o.priceCurrent ?? o.unitPrice ?? null;
    const currency = o.currencyCode ?? o.currency ?? null;
    /** @type {Record<string, unknown>} */
    const offer = {
      '@type': 'Offer',
      '@id': `${url}#offer-${o.id}`,
      name: o.title || m.name,
      url,
      availability: o.status === 'activated' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder'
    };
    if (o.description) offer.description = oneLine(o.description, 300);
    if (price != null && Number.isFinite(Number(price))) {
      offer.price = Number(price);
      if (currency && /^[A-Za-z]{3}$/.test(currency)) offer.priceCurrency = currency.toUpperCase();
    }
    if (o.deadline) offer.availabilityEnds = o.deadline;
    if (o.min || o.max) {
      /** @type {Record<string, unknown>} */
      const qty = { '@type': 'QuantitativeValue', unitText: 'participants' };
      if (o.min) qty.minValue = o.min;
      if (o.max) qty.maxValue = o.max;
      offer.eligibleQuantity = qty;
    }
    if (o.proposerName) offer.seller = { '@type': 'Organization', name: o.proposerName };
    return offer;
  });

  /** @type {Record<string, unknown>} */
  const demand = {
    '@type': 'Demand',
    '@id': `${url}#demand`,
    name: m.name,
    url,
    eligibleQuantity: { '@type': 'QuantitativeValue', value: m.membersCount, unitText: 'households' }
  };
  if (m.desc) demand.description = oneLine(m.desc, 300);
  if (m.createdAt) demand.availabilityStarts = m.createdAt;
  if (m.categories?.length) demand.category = m.categories.join(', ');

  return { '@context': 'https://schema.org', '@graph': [demand, ...offers] };
}

/**
 * schema.org for a public wish: a `Demand`, with the window it is wanted in
 * and the budget when one was named. The owner's name stays on the page: a
 * person is not a `seller`, and there is no better slot for them on a Demand.
 *
 * @param {{ id: string, name: string, longDes?: string, ownerName?: string, startDate?: string|null,
 *   finnishDate?: string|null, totalBounti?: number|null, locationHint?: string|null,
 *   categories?: string[] }} w
 * @param {string} url canonical address of the page
 */
export function wishJsonLd(w, url) {
  /** @type {Record<string, unknown>} */
  const demand = {
    '@context': 'https://schema.org',
    '@type': 'Demand',
    '@id': `${url}#demand`,
    name: w.name,
    url
  };
  if (w.longDes) demand.description = oneLine(w.longDes, 300);
  if (w.startDate) demand.availabilityStarts = w.startDate;
  if (w.finnishDate) demand.availabilityEnds = w.finnishDate;
  if (w.locationHint) demand.areaServed = w.locationHint;
  if (w.categories?.length) demand.category = w.categories.join(', ');
  if (w.totalBounti != null && Number.isFinite(Number(w.totalBounti))) {
    demand.priceSpecification = { '@type': 'PriceSpecification', price: Number(w.totalBounti) };
  }
  return demand;
}
