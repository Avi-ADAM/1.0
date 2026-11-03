import type { RequestHandler } from './$types';
import { handleLeadPost } from '$lib/server/apiPublic/writeApi.js';
import { errorResponse } from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { strapiRun } from '$lib/server/apiPublic/catalog.js';

/**
 * `POST /api/v1/r/{rikma}/leads` — someone left their details on the rikma's
 * site, and the site's **server** passes them on with the consent they gave
 * (docs/inprogress/PLAN_LEADS.md §5.1). Scope `leads:create`.
 *
 * Answered in place, never redirected (a replayed POST is a second lead), and
 * with no `OPTIONS`/CORS: a browser form gets its own public scope (§5.2, L5).
 */
export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const resolved = await resolveRikmaFromPath(params.rikma, strapiRun(fetch), {
    move: false
  });
  if (resolved.kind !== 'ok') {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }
  return handleLeadPost({ request, fetch, pathProjectId: resolved.projectId });
};
