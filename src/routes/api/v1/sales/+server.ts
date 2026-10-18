import type { RequestHandler } from './$types';
import {
  handleSalesPost,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';

/**
 * POST /api/v1/sales — External Sales Reporting API (PLAN_EXTERNAL_SALES_API).
 *
 * **Deprecated** (PLAN_HEADLESS_PRODUCTS_API §5.8): the address without a
 * rikma in it was a default of the moment, not a decision. Every answer from
 * here carries `Deprecation`, `Sunset` and a `Link` to the caller's own
 * `/api/v1/r/<rikma>/sales`, and each request logs one `[api-legacy]` line —
 * which is what tells us when the route can be deleted.
 *
 * The flow itself lives in `$lib/server/apiPublic/writeApi.js`, shared verbatim
 * with the new address: the migration moves a URL, never a behaviour.
 */
export const POST: RequestHandler = async ({ request, fetch }) =>
  handleSalesPost({ request, fetch, legacy: true });

export const OPTIONS: RequestHandler = async () =>
  writePreflight('POST, OPTIONS');
