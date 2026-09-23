/**
 * Money inside a server-written sentence — a notification body, a Decision's
 * name, an email line (docs/PLAN_MULTI_CURRENCY.md C7).
 *
 * These strings are built per recipient language, so they cannot go through
 * `$t()` or `<Money>`. What they need is the same two facts every rendered
 * amount needs: which currency the number is in (the rikma's) and which
 * language it is being read in.
 *
 * Deliberately fail-soft: a notification is not worth failing a write over, so
 * an unreachable project reads as the legacy shekel — exactly what these
 * strings said before this file existed.
 */

import { formatMoney } from '$lib/money/format.js';
import { DEFAULT_CURRENCY, type CurrencyCode } from '$lib/money/currencies.js';
import { fetchRikmaCurrency } from './normalizeEntry.js';

export type MoneyText = ((amount: unknown, lang?: string | null) => string) & { currency: CurrencyCode };

export function moneyTextFor(currency: CurrencyCode): MoneyText {
  const fn = ((amount: unknown, lang: string | null = 'he') => {
    const n = amount == null || amount === '' ? NaN : Number(amount);
    return formatMoney(n, currency, lang ?? 'he');
  }) as MoneyText;
  fn.currency = currency;
  return fn;
}

/** One lookup per action run; the result formats every amount in that rikma's currency. */
export async function rikmaMoneyText(
  projectId: string | number | null | undefined,
  jwt: string,
  fetchFn: typeof fetch
): Promise<MoneyText> {
  if (projectId == null) return moneyTextFor(DEFAULT_CURRENCY);
  try {
    return moneyTextFor(await fetchRikmaCurrency(projectId, jwt, fetchFn));
  } catch {
    return moneyTextFor(DEFAULT_CURRENCY);
  }
}
