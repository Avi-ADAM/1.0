import type { RequestHandler } from './$types';
import { handleOrderCancel } from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `POST /api/v1/r/{rikma}/orders/{ref}/cancel` — a refund, reported by the
 * storefront's server (scope `orders:create`). The order's sales are reset by
 * their holder where nothing was split yet; the rest goes to the rikma to
 * settle (`cancelOrder`). Server-only, like the rest of `/orders`.
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }
  return handleOrderCancel({
    request,
    fetch,
    ref: params.ref,
    pathProjectId: resolved.projectId
  });
};
