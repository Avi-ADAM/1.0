import type { RequestHandler } from './$types';
import {
  handleSalesPost,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `POST /api/v1/r/{rikma}/sales` — reporting a sale, at the rikma's own address
 * (PLAN_HEADLESS_PRODUCTS_API §5.8).
 *
 * The body, the scopes, the statuses and the action behind them are **exactly**
 * what `/api/v1/sales` does — it is the same function, and the old address now
 * carries a `Link` here. Two things are new, and both are about the address:
 *
 *   1. the path names a rikma, and the key has to be that rikma's
 *      (`403 RIKMA_MISMATCH`) — a key minted for one shop cannot file sales in
 *      another by editing a URL;
 *   2. the address is resolved the way the read API resolves it, so a rikma
 *      that has both a slug and an id is one rikma here too.
 *
 * Writes are answered **in place**: no 301. A redirect on a POST may be
 * replayed as a GET, and an integration that thinks it reported a sale it never
 * reported is worse than a plain 404.
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }

  return handleSalesPost({ request, fetch, pathProjectId: resolved.projectId });
};

export const OPTIONS: RequestHandler = async () =>
  writePreflight('POST, OPTIONS');
