/**
 * `GET /api/fx` — today's reference rates for the browser
 * (docs/PLAN_MULTI_CURRENCY.md D-C6).
 *
 * Public on purpose: a guest reading a product page in dollars needs the rate
 * as much as a member does, and the table is the same published reference
 * data every provider gives away. The browser never talks to a provider
 * itself. `?codes=XAF,XOF` adds codes outside the supported list (a rikma that
 * counts in a currency the picker doesn't offer).
 */

import { json } from '@sveltejs/kit';
import { clientRates } from '$lib/server/fx/index.js';
import { normalizeCode } from '$lib/money/currencies.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const extra = (url.searchParams.get('codes') ?? '')
    .split(',')
    .map(normalizeCode)
    .filter((c): c is string => c !== null)
    .slice(0, 20);
  const table = await clientRates(extra);
  // Rates change once a day; an hour of browser/CDN caching costs nothing.
  if (table) setHeaders({ 'cache-control': 'public, max-age=3600' });
  return json({ table });
};
