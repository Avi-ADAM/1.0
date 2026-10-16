import type { RequestHandler } from './$types';
import {
  handleTaskStatusGet,
  writePreflight
} from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `GET /api/v1/r/{rikma}/tasks/{externalId}` — the status pull, at the rikma's
 * own address (PLAN_HEADLESS_PRODUCTS_API §5.8).
 *
 * Read-only and identical to `/api/v1/tasks/{externalId}`; the path just makes
 * the tenant explicit, so an externalId belonging to another rikma is a 404
 * against *this* address rather than a 404 that depends on which key asked.
 */
export const GET: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }

  return handleTaskStatusGet({
    request,
    fetch,
    externalId: String(params.externalId ?? ''),
    pathProjectId: resolved.projectId
  });
};

export const OPTIONS: RequestHandler = async () =>
  writePreflight('GET, OPTIONS');
