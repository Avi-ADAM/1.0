import type { RequestHandler } from './$types';
import { handleLeadGet } from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `GET /api/v1/r/{rikma}/leads/{externalId}` — what became of a lead the site
 * sent (scope `leads:read`, docs/inprogress/PLAN_LEADS.md §5.3). Status only:
 * never the person, never the log, never who owns it.
 */
export const GET: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }
  return handleLeadGet({
    request,
    fetch,
    externalId: params.externalId,
    pathProjectId: resolved.projectId
  });
};
