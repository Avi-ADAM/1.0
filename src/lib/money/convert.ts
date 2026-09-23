/**
 * Conversion between currencies, and the "written in mine, counted in the
 * rikma's" normalization (docs/PLAN_MULTI_CURRENCY.md §1, D-C2/D-C3).
 *
 * Pure: every function takes the rates table as an argument. The server gets
 * it from `$lib/server/fx/rates`, the browser from the root layout.
 */

import { roundTo, type CurrencyCode } from './currencies.js';

/**
 * One day of reference rates: `rates[code]` = units of `code` per 1 `base`.
 * `base` is always USD — conversions between two other currencies go through
 * it as a cross rate, which is exactly what every free provider publishes.
 */
export type FxTable = {
  base: CurrencyCode;
  /** YYYY-MM-DD, the day the provider published these rates. */
  date: string;
  rates: Record<CurrencyCode, number>;
  source?: string;
};

/** Units of `to` per 1 unit of `from`, or null when either side is unknown. */
export function rateBetween(from: CurrencyCode, to: CurrencyCode, table: FxTable | null | undefined): number | null {
  if (from === to) return 1;
  if (!table?.rates) return null;
  const rf = from === table.base ? 1 : table.rates[from];
  const rt = to === table.base ? 1 : table.rates[to];
  if (!(rf > 0) || !(rt > 0)) return null;
  return rt / rf;
}

/**
 * Convert an amount. Null when the table can't price one of the currencies —
 * the caller shows the original instead of inventing a number (O-C2).
 * Not rounded: rounding is for storage and display, not for intermediate math.
 */
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  table: FxTable | null | undefined
): number | null {
  if (!Number.isFinite(amount)) return null;
  const r = rateBetween(from, to, table);
  return r === null ? null : amount * r;
}

/** What a writer typed. */
export type Entry = { amount: number; currency: CurrencyCode };

/** What is stored on the row (D-C2). `entryCurrency`/`entryRate` are null when written in the rikma's own currency. */
export type StoredAmount = {
  amount: number;
  entryCurrency: CurrencyCode | null;
  entryRate: number | null;
};

/** Significant digits kept on a stored rate — plenty for any amount a rikma records, and a stable decimal in Postgres. */
const RATE_SIG = 10;

/**
 * Normalize an entry into the rikma's currency, freezing today's rate on the
 * row. Throws when the rate is unknown: silently storing an unconverted number
 * under the rikma's currency would corrupt every balance it is summed into.
 */
export function toRikma(entry: Entry, rikmaCurrency: CurrencyCode, table: FxTable | null | undefined): StoredAmount {
  if (entry.currency === rikmaCurrency) {
    return { amount: roundTo(entry.amount, rikmaCurrency), entryCurrency: null, entryRate: null };
  }
  const r = rateBetween(entry.currency, rikmaCurrency, table);
  if (r === null) throw new Error(`toRikma: no rate ${entry.currency}→${rikmaCurrency}`);
  const rate = Number(r.toPrecision(RATE_SIG));
  return {
    amount: roundTo(entry.amount * rate, rikmaCurrency),
    entryCurrency: entry.currency,
    entryRate: rate
  };
}

/**
 * The amount as its writer typed it, recovered from a stored row. Null when the
 * row was written in the rikma's currency (there is no "other" original).
 * Reads a second money field of the same row too: `perhour` and `price` on one
 * mission share one `entryRate`.
 */
export function entryOriginal(
  amount: number | null | undefined,
  row: { entryCurrency?: string | null; entryRate?: number | string | null } | null | undefined
): Entry | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const cur = row?.entryCurrency;
  // A Strapi decimal can arrive as a string over REST; GraphQL sends a Float.
  const rate = row?.entryRate == null ? NaN : Number(row.entryRate);
  if (!cur || !(rate > 0)) return null;
  return { amount: roundTo(amount / rate, cur), currency: cur };
}
