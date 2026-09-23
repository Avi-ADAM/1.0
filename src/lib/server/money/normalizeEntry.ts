/**
 * "I write in my currency; the rikma counts in its own" — the write half of
 * docs/PLAN_MULTI_CURRENCY.md (D-C2, C5).
 *
 * An action that stores money takes an optional `entryCurrency` param beside
 * its amounts. Absent, or equal to the rikma's currency ⇒ nothing changes: the
 * amounts are stored as given and the row carries no entry fields, exactly as
 * every row did before multi-currency. Different ⇒ every amount of the row is
 * converted at today's rate into the rikma's currency, and the rate is frozen
 * on the row as `entryRate` next to `entryCurrency`, so the writer's own
 * figure can always be recovered and no balance moves with the market later.
 *
 * One rate for the whole row: a mission's `perhour` and its `price` were
 * typed in the same currency, on the same day.
 */

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { serverRates } from '$lib/server/fx/index.js';
import { normalizeCode, type CurrencyCode } from '$lib/money/currencies.js';
import { rateBetween, type FxTable } from '$lib/money/convert.js';
import { roundTo } from '$lib/money/currencies.js';
import { rikmaCurrency } from '$lib/money/resolve.js';

export type NormalizedEntry<K extends string> = {
  values: Record<K, number | null>;
  /** The rikma's currency — what `values` are in now. */
  currency: CurrencyCode;
  /** Set only when the writer used another currency. */
  entryCurrency: CurrencyCode | null;
  entryRate: number | null;
};

/** The rikma's accounting currency, read with the caller's own credentials. */
export async function fetchRikmaCurrency(
  projectId: string | number,
  jwt: string,
  fetchFn: typeof fetch
): Promise<CurrencyCode> {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: 'query RikmaCurrency($id: ID!) { project(id: $id) { data { attributes { currencyCode } } } }',
      variables: { id: String(projectId) }
    })
  });
  const json = await res.json();
  if (json?.errors?.length) throw new Error(json.errors[0].message);
  return rikmaCurrency(json?.data?.project?.data?.attributes);
}

/**
 * Pure core: convert a row's amounts from the writer's currency into the
 * rikma's. Throws when the rate is unknown — storing an unconverted number
 * under the rikma's currency would silently corrupt every sum it joins.
 */
export function convertEntry<K extends string>(
  amounts: Record<K, number | null | undefined>,
  entryCurrency: CurrencyCode | null,
  rikma: CurrencyCode,
  table: FxTable | null
): NormalizedEntry<K> {
  const values = {} as Record<K, number | null>;
  if (!entryCurrency || entryCurrency === rikma) {
    for (const k of Object.keys(amounts) as K[]) {
      const v = amounts[k];
      values[k] = v == null || !Number.isFinite(Number(v)) ? null : Number(v);
    }
    return { values, currency: rikma, entryCurrency: null, entryRate: null };
  }
  const r = rateBetween(entryCurrency, rikma, table);
  if (r === null) {
    throw new Error(`No exchange rate from ${entryCurrency} to ${rikma} right now — try again later or enter the amount in ${rikma}`);
  }
  const rate = Number(r.toPrecision(10));
  for (const k of Object.keys(amounts) as K[]) {
    const v = amounts[k];
    values[k] = v == null || !Number.isFinite(Number(v)) ? null : roundTo(Number(v) * rate, rikma);
  }
  return { values, currency: rikma, entryCurrency, entryRate: rate };
}

/**
 * The action-side entry point. Costs nothing on the legacy path: without an
 * `entryCurrency` param no project read and no rate lookup happen.
 */
export async function normalizeEntry<K extends string>(opts: {
  amounts: Record<K, number | null | undefined>;
  entryCurrency: unknown;
  projectId: string | number | null | undefined;
  jwt: string;
  fetchFn: typeof fetch;
  /** When the caller already knows it (saves a read). */
  rikmaCurrency?: CurrencyCode | null;
}): Promise<NormalizedEntry<K>> {
  const entry = normalizeCode(opts.entryCurrency);
  if (!entry) return convertEntry(opts.amounts, null, opts.rikmaCurrency ?? 'ILS', null);
  const rikma =
    normalizeCode(opts.rikmaCurrency) ??
    (opts.projectId != null ? await fetchRikmaCurrency(opts.projectId, opts.jwt, opts.fetchFn) : 'ILS');
  if (entry === rikma) return convertEntry(opts.amounts, null, rikma, null);
  return convertEntry(opts.amounts, entry, rikma, await serverRates());
}

/** Spread into a mutation's variables/data: nothing at all on the legacy path. */
export function entryFields(n: { entryCurrency: string | null; entryRate: number | null }) {
  return n.entryCurrency ? { entryCurrency: n.entryCurrency, entryRate: n.entryRate } : {};
}

/** The `paramSchema` entry every money-writing action shares. */
export const ENTRY_CURRENCY_PARAM = {
  type: 'string' as const,
  required: false,
  description: 'ISO-4217 code the amounts were typed in; converted to the rikma currency at today\'s rate (PLAN_MULTI_CURRENCY)'
};
