import type { RequestHandler } from './$types';
import { handleOrderGet } from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `GET /api/v1/r/{rikma}/orders/{ref}` — the order's status, lines and total,
 * for the storefront's server (scope `orders:read`). Never the buyer's
 * details: the storefront has them, and here they are for the rikma only.
 */
export const GET: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }
  return handleOrderGet({
    request,
    fetch,
    ref: params.ref,
    pathProjectId: resolved.projectId
  });
};
