import type { RequestHandler } from './$types';
import { handleOrderPost } from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `POST /api/v1/r/{rikma}/orders` — a paid order, reported by the storefront's
 * **server** after its payment provider confirmed the charge
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §3.3, §5.4).
 *
 * Answered in place, never redirected (a replayed POST is a second order), and
 * with no `OPTIONS`/CORS on purpose: this is not an endpoint a web page calls.
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }
  return handleOrderPost({ request, fetch, pathProjectId: resolved.projectId });
};
