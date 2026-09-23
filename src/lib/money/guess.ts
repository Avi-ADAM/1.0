/**
 * A first guess at a visitor's currency, before they have chosen one
 * (docs/PLAN_MULTI_CURRENCY.md D-C9).
 *
 * Only the *region* of an `Accept-Language` tag says anything about money —
 * `en-GB` is pounds, `en` alone is anywhere. A tag with no region falls
 * through to the next one, and a visitor whose browser names no region at all
 * gets the platform default (ILS): most `ru` and `ar` readers here live in
 * Israel, so guessing roubles or dinars from the language would be wrong more
 * often than right.
 */

import { DEFAULT_CURRENCY, type CurrencyCode } from './currencies.js';

const EURO = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];

const REGION_CURRENCY: Record<string, CurrencyCode> = {
  IL: 'ILS', PS: 'ILS',
  US: 'USD', PR: 'USD', EC: 'USD', SV: 'USD', PA: 'USD',
  GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', CH: 'CHF', LI: 'CHF',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
  RU: 'RUB', UA: 'UAH', BY: 'BYN', KZ: 'KZT', UZ: 'UZS', MD: 'MDL',
  TR: 'TRY', GE: 'GEL', AM: 'AMD', AZ: 'AZN',
  JO: 'JOD', EG: 'EGP', AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  LB: 'LBP', IQ: 'IQD', MA: 'MAD', TN: 'TND', DZ: 'DZD',
  ET: 'ETB', NG: 'NGN', KE: 'KES', ZA: 'ZAR',
  IN: 'INR', CN: 'CNY', JP: 'JPY', KR: 'KRW', HK: 'HKD', SG: 'SGD', TH: 'THB',
  PH: 'PHP', ID: 'IDR', MY: 'MYR', VN: 'VND',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU'
};
for (const r of EURO) REGION_CURRENCY[r] = 'EUR';

/** The currency of a BCP-47 tag's region (`he-IL` → ILS), or null when it has none we know. */
export function currencyForTag(tag: string): CurrencyCode | null {
  const parts = tag.trim().split(/[-_]/);
  for (const p of parts.slice(1)) {
    if (/^[A-Za-z]{2}$/.test(p)) return REGION_CURRENCY[p.toUpperCase()] ?? null;
  }
  return null;
}

/** Guess from a raw `Accept-Language` header, honouring its q-order. */
export function guessCurrency(acceptLanguage: string | null | undefined): CurrencyCode {
  if (!acceptLanguage) return DEFAULT_CURRENCY;
  const tags = acceptLanguage
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => /^q=([\d.]+)$/.exec(p.trim())).find(Boolean);
      return { tag, q: q ? Number(q[1]) : 1, i };
    })
    .filter((t) => t.tag && t.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of tags) {
    const c = currencyForTag(tag);
    if (c) return c;
  }
  return DEFAULT_CURRENCY;
}
