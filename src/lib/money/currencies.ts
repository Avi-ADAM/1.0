/**
 * The currencies a member can write in and read in (docs/PLAN_MULTI_CURRENCY.md D-C1).
 *
 * A currency is its ISO-4217 code and nothing else — the symbol and the name
 * come from `Intl` in the reader's own language, so there is no table of
 * "₪ / $ / €" to keep in sync with five locales.
 *
 * The list is what the picker offers, not what the converter accepts: any code
 * the rates table knows converts. It is ordered by how likely a member of this
 * platform is to want it — the first rows are the ones the picker shows before
 * anyone types.
 */

export type CurrencyCode = string;

/** The rikma currency when nothing says otherwise: null = legacy = ILS (D-C2). */
export const DEFAULT_CURRENCY: CurrencyCode = 'ILS';

export const COMMON_CURRENCIES: readonly CurrencyCode[] = [
  'ILS', 'USD', 'EUR', 'GBP', 'RUB', 'UAH', 'JOD', 'EGP', 'AED'
];

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  ...COMMON_CURRENCIES,
  'CAD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
  'TRY', 'GEL', 'AMD', 'AZN', 'KZT', 'BYN', 'UZS', 'MDL',
  'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'LBP', 'IQD', 'MAD', 'TND', 'DZD',
  'ETB', 'NGN', 'KES', 'ZAR',
  'INR', 'CNY', 'JPY', 'KRW', 'HKD', 'SGD', 'THB', 'PHP', 'IDR', 'MYR', 'VND',
  'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU'
];

const CODE_RE = /^[A-Z]{3}$/;

/** A well-formed ISO-4217 code (shape only — `XYZ` passes, the rates table decides if it converts). */
export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === 'string' && CODE_RE.test(v);
}

/** Upper-case and validate; anything else is null. `'usd'` → `'USD'`, `''` → null. */
export function normalizeCode(v: unknown): CurrencyCode | null {
  if (typeof v !== 'string') return null;
  const c = v.trim().toUpperCase();
  return isCurrencyCode(c) ? c : null;
}

const digitsCache = new Map<string, number>();

/**
 * How many fraction digits the currency is counted in (JPY 0, ILS 2, KWD 3).
 * Read from `Intl`, which carries ISO-4217's minor-unit table; 2 when unknown.
 */
export function minorDigits(code: CurrencyCode): number {
  const hit = digitsCache.get(code);
  if (hit !== undefined) return hit;
  let d = 2;
  try {
    d = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  } catch {
    d = 2;
  }
  digitsCache.set(code, d);
  return d;
}

/** Round to the currency's own minor unit — never to a fixed 2. */
export function roundTo(amount: number, code: CurrencyCode): number {
  const f = 10 ** minorDigits(code);
  return Math.round((amount + Number.EPSILON) * f) / f;
}
