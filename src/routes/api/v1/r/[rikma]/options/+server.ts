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
import {
  fetchOptions,
  fetchRikmaRef,
  refOf,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

/**
 * GET /api/v1/r/{rikma}/options — the rikma's option axes and their values,
 * each with the number of products a shopper would find behind it
 * (docs/tbd/PLAN_SHOP_CUSTOMER_EXPERIENCE.md §5.3).
 *
 * It exists so a storefront can render its filter bar — "מידה: S · M · L",
 * "צבע: אדום · כחול" — from one cached call, instead of pulling every product
 * and deriving the axes in the browser. The counts are what make it a filter
 * bar and not a list of words: a value with nothing behind it is dropped.
 *
 * The check order is the catalog's order, unchanged: who is asking (1), which
 * rikma (2), key ↔ path agreement (3), does the rikma exist (4), then the read
 * — visibility included, so an anonymous visitor never learns from a count
 * that a draft exists.
 *
 * No query parameters: the axes are a rikma's navigation, not a search
 * surface. Filtering *within* an axis is what `?option.<key>=<value>` on
 * `/products` is for.
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const run = strapiRun(fetch);

  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(params.rikma, run, {
    search: url.search,
    suffix: '/options'
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

  const rikma = refOf(rikmaRow);
  let options;
  try {
    options = await fetchOptions(run, {
      projectId: resolved.projectId,
      access: auth.access
    });
  } catch (e) {
    console.error('[apiPublic] options query failed:', e);
    return errorResponse(
      502,
      'UPSTREAM_ERROR',
      'The options could not be read right now'
    );
  }

  const body = { rikma, options };
  const etag = etagOf({
    p: `${rikma.canonicalPath}/options`,
    v: options.map((axis) =>
      [axis.key, ...axis.values.map((v) => `${v.value}:${v.products}`)].join(
        '|'
      )
    )
  });

  return respond({ request, auth, body, etag });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
