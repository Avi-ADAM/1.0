/**
 * Server entry point for exchange rates (docs/PLAN_MULTI_CURRENCY.md §4).
 * `serverRates()` is what loaders and actions call; the pieces behind it are
 * pure enough to test with fakes (`rates.ts`, `providers.ts`).
 */

import type { FxTable } from '$lib/money/convert.js';
import { SUPPORTED_CURRENCIES } from '$lib/money/currencies.js';
import { getRates, slimTable } from './rates.js';
import { strapiFxStore } from './strapiStore.js';

export { slimTable } from './rates.js';

/** Today's table, from memory / Strapi / the providers. Never throws. */
export async function serverRates(): Promise<FxTable | null> {
  try {
    // globalThis.fetch, not a load's `fetch`: this is a process-wide cache, and
    // hooks.server.js stamps the Strapi gate header on the global one.
    return await getRates({ fetchFn: globalThis.fetch, store: strapiFxStore(globalThis.fetch) });
  } catch (e) {
    console.warn('[fx] rates unavailable:', e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * The table the browser gets: the supported currencies plus any extra codes a
 * page needs.
 *
 * `maxWaitMs` is for the root layout: a warm process answers from memory in
 * microseconds, but the first request of a day on a cold instance may be
 * waiting on a provider, and no page should render seconds late for a rate.
 * Past the deadline it returns null and the browser asks `/api/fx` itself —
 * by which time the same in-flight fetch has usually landed.
 */
export async function clientRates(
  extra: Iterable<string> = [],
  opts: { maxWaitMs?: number } = {}
): Promise<FxTable | null> {
  const pending = serverRates();
  const t =
    opts.maxWaitMs == null
      ? await pending
      : await Promise.race([pending, new Promise<null>((r) => setTimeout(() => r(null), opts.maxWaitMs))]);
  return slimTable(t, new Set([...SUPPORTED_CURRENCIES, ...extra]));
}
