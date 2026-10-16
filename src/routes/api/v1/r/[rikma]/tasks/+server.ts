import type { RequestHandler } from './$types';
import {
  handleTaskCreatePost,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `POST /api/v1/r/{rikma}/tasks` — opening a task, at the rikma's own address
 * (PLAN_HEADLESS_PRODUCTS_API §5.8).
 *
 * Same body, same `tasks:create` scope, same consent rule as the in-app flow —
 * it is the same handler as `/api/v1/tasks`, which now carries a `Link` here.
 * What the address adds is the tenant: the key must belong to the rikma in the
 * path (`403 RIKMA_MISMATCH`), so a leaked key cannot propose work to a rikma
 * it was not minted for.
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }

  return handleTaskCreatePost({
    request,
    fetch,
    pathProjectId: resolved.projectId
  });
};

export const OPTIONS: RequestHandler = async () =>
  writePreflight('POST, OPTIONS');
