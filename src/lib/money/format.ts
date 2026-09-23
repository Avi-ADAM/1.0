/**
 * Money as text, in the reader's language (docs/PLAN_MULTI_CURRENCY.md §1.3).
 *
 * `Intl.NumberFormat` owns the symbol, its side, the grouping and the digits
 * for every (locale, currency) pair, so nothing here knows that ₪ follows the
 * number in Hebrew and $ precedes it in English.
 */

import { minorDigits, type CurrencyCode } from './currencies.js';

/** The site's UI languages → an Intl locale. Arabic keeps Western digits, as the rest of the site does. */
const INTL_LOCALE: Record<string, string> = {
  he: 'he-IL',
  en: 'en-US',
  ar: 'ar-u-nu-latn',
  ru: 'ru-RU',
  es: 'es-ES'
};

export function intlLocale(lang: string | null | undefined): string {
  return INTL_LOCALE[lang ?? ''] ?? lang ?? 'he-IL';
}

export type FormatOpts = {
  /** Prefix `≈` — the number is a conversion, not what anyone wrote. */
  approx?: boolean;
  /**
   * `auto` (default): whole amounts without decimals (₪120, not ₪120.00),
   * anything else with the currency's own minor digits.
   * `full`: always the minor digits. `whole`: never.
   */
  fraction?: 'auto' | 'full' | 'whole';
  /** `compact` for tight cards: ₪12K. */
  notation?: 'standard' | 'compact';
};

const fmtCache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, currency: CurrencyCode, digits: number, notation: string): Intl.NumberFormat {
  const key = `${locale}|${currency}|${digits}|${notation}`;
  let f = fmtCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: notation === 'compact' ? 0 : digits,
        maximumFractionDigits: digits,
        notation: notation as 'standard' | 'compact'
      });
    } catch {
      // An unknown code (a local community currency from Matbea): Intl throws on
      // it, so fall back to a plain number and let the caller append the code.
      f = new Intl.NumberFormat(locale, { maximumFractionDigits: digits });
    }
    fmtCache.set(key, f);
  }
  return f;
}

/** Format an amount in a currency for a UI language. */
export function formatMoney(
  amount: number | null | undefined,
  currency: CurrencyCode,
  lang: string | null | undefined,
  opts: FormatOpts = {}
): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  const locale = intlLocale(lang);
  const minor = minorDigits(currency);
  const mode = opts.fraction ?? 'auto';
  const digits = mode === 'whole' ? 0 : mode === 'full' ? minor : Number.isInteger(amount) ? 0 : minor;
  const f = formatter(locale, currency, digits, opts.notation ?? 'standard');
  let s = f.format(amount);
  if (f.resolvedOptions().style !== 'currency') s = `${s} ${currency}`;
  return opts.approx ? `≈${s}` : s;
}

/** The currency's symbol alone, as the reader's language writes it (`₪`, `$`, `€`). */
export function currencySymbol(currency: CurrencyCode, lang: string | null | undefined): string {
  try {
    const parts = new Intl.NumberFormat(intlLocale(lang), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol'
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

/** The currency's name in the reader's language ("שקל חדש", "US Dollar"). */
export function currencyName(currency: CurrencyCode, lang: string | null | undefined): string {
  try {
    const dn = new Intl.DisplayNames([intlLocale(lang)], { type: 'currency' });
    return dn.of(currency) ?? currency;
  } catch {
    return currency;
  }
}
