import type { RequestHandler } from './$types';
import {
  errorResponse,
  authenticateRead,
  assertTenant,
  etagOf,
  respond,
  preflightResponse
} from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { readRikmaExposure } from '$lib/server/apiPublic/exposure.js';
import {
  fetchCategories,
  fetchRikmaRef,
  refOf,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

/**
 * GET /api/v1/r/{rikma}/categories — the categories that have products here.
 *
 * "That have products **here**" is the whole point (§5.2): the platform's
 * category vocabulary is shared, and a shop filter that offers a category with
 * nothing behind it is a dead end. The counts are of the products *this caller*
 * may see, so a shop can render "סדנאות (12)" without a second request — and an
 * anonymous visitor is never told that a hidden product exists.
 *
 * No query parameters today: categories are the rikma's navigation, not a
 * search surface. A `?q=`/facet API is P1 (§4.10).
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const run = strapiRun(fetch);

  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(params.rikma, run, {
    search: url.search,
    suffix: '/categories'
  });
  if (resolved.kind === 'notFound')
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  if (resolved.kind === 'redirect') {
    return new Response(null, {
      status: 301,
      headers: {
        Location: resolved.location,
        ...(resolved.canonicalPath
          ? { 'X-1lev1-Rikma-Canonical': resolved.canonicalPath }
          : {})
      }
    });
  }

  const mismatch = assertTenant(auth, resolved.projectId);
  if (mismatch) return mismatch;

  const rikmaRow = await fetchRikmaRef(run, resolved.projectId);
  if (!rikmaRow) return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  if (auth.kind === 'anonymous' && isHiddenProject(rikmaRow.id)) {
    return errorResponse(404, 'RIKMA_NOT_FOUND', 'No such rikma');
  }

  const access =
    auth.kind === 'anonymous'
      ? {
          ...auth.access,
          exposed: await readRikmaExposure(resolved.projectId, run)
        }
      : auth.access;

  const data = await fetchCategories(run, {
    projectId: resolved.projectId,
    access
  });

  const body = { rikma: refOf(rikmaRow), data };
  const etag = etagOf({
    p: `${resolved.projectId}/categories`,
    c: data.map((c) => `${c.id}:${c.productsCount}`)
  });

  return respond({ request, auth, body, etag });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
