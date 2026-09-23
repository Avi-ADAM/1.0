/**
 * Free, keyless reference-rate providers (docs/PLAN_MULTI_CURRENCY.md D-C4).
 *
 * All three publish once a day, which is all a "representative rate" needs —
 * nobody here trades on the minute. They are tried in order; each returns a
 * USD-based table or throws, and the caller moves on to the next.
 *
 *  1. open.er-api.com (ExchangeRate-API open access) — ~160 currencies incl.
 *     ILS, RUB, UAH, JOD, EGP. Terms ask for attribution, which the rate note
 *     under converted amounts carries.
 *  2. fawazahmed0/currency-api on jsDelivr — ~200 currencies, served from a CDN.
 *  3. Frankfurter (ECB reference rates) — ~30 currencies, no RUB, but the most
 *     conservative source and a different operator from the other two.
 */

import type { FxTable } from '$lib/money/convert.js';

export type FxProvider = {
  id: string;
  fetchTable: (fetchFn: typeof fetch) => Promise<FxTable>;
};

const TIMEOUT_MS = 6000;

async function getJson(fetchFn: typeof fetch, url: string): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchFn(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ISO-4217 as the runtime knows it. The CDN table mixes in crypto tokens, some
 * with three-letter tickers (`ADA`, `APE`); only real currencies may pass.
 */
const ISO: Set<string> | null = (() => {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('currency');
    return list?.length ? new Set(list) : null;
  } catch {
    return null;
  }
})();

/** Keep only ISO codes with positive finite rates; upper-case the keys. */
export function cleanRates(raw: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const code = k.toUpperCase();
    const n = typeof v === 'number' ? v : Number(v);
    if (!/^[A-Z]{3}$/.test(code) || (ISO && !ISO.has(code))) continue;
    if (Number.isFinite(n) && n > 0) out[code] = n;
  }
  out.USD = 1;
  return out;
}

function assertUsable(rates: Record<string, number>, id: string) {
  // A table without the shekel is useless to this platform however big it is.
  if (!(rates.ILS > 0) || Object.keys(rates).length < 10) {
    throw new Error(`${id}: implausible table (${Object.keys(rates).length} rates)`);
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const erApi: FxProvider = {
  id: 'open.er-api.com',
  async fetchTable(fetchFn) {
    const j = await getJson(fetchFn, 'https://open.er-api.com/v6/latest/USD');
    if (j?.result !== 'success') throw new Error('open.er-api.com: result ' + j?.result);
    const rates = cleanRates(j.rates);
    assertUsable(rates, this.id);
    const date = j.time_last_update_unix ? isoDay(new Date(j.time_last_update_unix * 1000)) : isoDay(new Date());
    return { base: 'USD', date, rates, source: this.id };
  }
};

export const fawazCdn: FxProvider = {
  id: 'fawazahmed0/currency-api',
  async fetchTable(fetchFn) {
    const j = await getJson(fetchFn, 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json');
    // The table mixes in crypto tokens with long names; cleanRates keeps 3-letter codes only.
    const rates = cleanRates(j?.usd ?? {});
    assertUsable(rates, this.id);
    return { base: 'USD', date: String(j?.date ?? isoDay(new Date())), rates, source: this.id };
  }
};

export const frankfurter: FxProvider = {
  id: 'frankfurter (ECB)',
  async fetchTable(fetchFn) {
    const j = await getJson(fetchFn, 'https://api.frankfurter.dev/v1/latest?base=USD');
    const rates = cleanRates(j?.rates ?? {});
    assertUsable(rates, this.id);
    return { base: 'USD', date: String(j?.date ?? isoDay(new Date())), rates, source: this.id };
  }
};

export const PROVIDERS: FxProvider[] = [erApi, fawazCdn, frankfurter];
