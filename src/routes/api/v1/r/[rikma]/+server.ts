import type { RequestHandler } from './$types';
import {
  errorResponse,
  authenticateRead,
  assertTenant,
  etagOf,
  respond,
  preflightResponse,
  traceOf
} from '$lib/server/apiPublic/http.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';
import { defaultListStatuses } from '$lib/server/apiPublic/dto.js';
import {
  buildRikmaBody,
  fetchRikmaProfile,
  fetchRikmaRef,
  fetchVisibleProductCount,
  refOf,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

/**
 * GET /api/v1/r/{rikma} — the shop's front door (§5.2).
 *
 * What an external site needs before it asks for products: the rikma's name,
 * its public address, where it is, what it sells in (`currency`), and the look
 * (`look`) so a landing page can be built in the rikma's own colours. The
 * product count is of the rows *this caller* may see, so it matches what the
 * list endpoint will actually return.
 *
 * `look` lives here and not in every product row: it is identical for the whole
 * catalog and would multiply the payload for nothing (§5.3).
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const run = strapiRun(fetch);

  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(params.rikma, run, {
    search: url.search
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

  const { access } = auth;

  let attrs: Record<string, any> | null = null;
  let productsCount: number | null = null;
  try {
    [attrs, productsCount] = await Promise.all([
      fetchRikmaProfile(run, resolved.projectId),
      fetchVisibleProductCount(run, {
        projectId: resolved.projectId,
        rikma: refOf(rikmaRow),
        access,
        statuses: defaultListStatuses(access)
      }).catch((e) => {
        // A count is a nicety, not the page: an unreadable count must not take
        // the profile down with it.
        console.warn(
          '[apiPublic] productsCount failed:',
          e?.getMessages?.() ?? e
        );
        return null;
      })
    ]);
  } catch (e) {
    console.error('[apiPublic] rikma profile query failed:', e);
    return errorResponse(
      502,
      'UPSTREAM_ERROR',
      'The rikma could not be read right now',
      {
        'X-1lev1-Trace': traceOf(request)
      }
    );
  }

  const body = buildRikmaBody({
    attrs,
    rikma: rikmaRow,
    productsCount,
    look: null
  });
  const etag = etagOf({
    p: rikmaRow.id,
    s: rikmaRow.slug,
    c: productsCount,
    u: attrs?.updatedAt ?? null
  });

  return respond({ request, auth, body, etag });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
