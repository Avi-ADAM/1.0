import type { RequestHandler } from './$types';
import {
  handleTaskStatusGet,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';

/**
 * GET /api/v1/tasks/{externalId} — status pull for the External Tasks API.
 *
 * **Deprecated** (PLAN_HEADLESS_PRODUCTS_API §5.8): replaced by
 * `GET /api/v1/r/{rikma}/tasks/{externalId}`. Legacy answers carry
 * `Deprecation`, `Sunset` and a `Link` to the caller's new address, and each
 * request logs one `[api-legacy]` line.
 */
export const GET: RequestHandler = async ({ request, params, fetch }) =>
  handleTaskStatusGet({
    request,
    fetch,
    externalId: String(params.externalId ?? ''),
    legacy: true
  });

export const OPTIONS: RequestHandler = async () =>
  writePreflight('GET, OPTIONS');
