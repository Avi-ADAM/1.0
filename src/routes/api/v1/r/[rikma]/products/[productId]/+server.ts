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
import { projectFields, canSeeStatus } from '$lib/server/apiPublic/dto.js';
import {
  fetchProduct,
  fetchRikmaRef,
  refOf,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';

/**
 * GET /api/v1/r/{rikma}/products/{productId} — one product, inside one rikma.
 *
 * Two refusals are deliberate and different (§5.0):
 *   - a product that exists but belongs to **another** rikma is a `404`, never
 *     a 403: whether that id exists elsewhere is not this rikma's business;
 *   - a product this caller may not *see* (a draft or an archived product to
 *     an anonymous reader) is also a `404`, for the same reason —
 *     the id's existence is not public knowledge.
 *
 * The product id is validated before it reaches the resolver, because the
 * resolver builds a `Location` header out of the path on a 301 and a header is
 * an output sink.
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const productId = String(params.productId ?? '');
  if (!/^\d{1,12}$/.test(productId)) {
    return errorResponse(
      404,
      'PRODUCT_NOT_FOUND',
      'No such product in this rikma'
    );
  }

  const run = strapiRun(fetch);

  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(params.rikma, run, {
    search: url.search,
    suffix: `/products/${productId}`
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

  // `?fields=` is honoured on the detail route too: a client that renders a
  // card should not pay for the description it will not show.
  const requestedFields = (url.searchParams.get('fields') ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  if (requestedFields.some((f) => !/^[a-zA-Z]+(\.[a-zA-Z]+)?$/.test(f))) {
    return errorResponse(
      400,
      'VALIDATION',
      'fields must be a comma-separated list of field names'
    );
  }

  const product = await fetchProduct(run, {
    projectId: resolved.projectId,
    productId,
    rikma: refOf(rikmaRow)
  });
  if (!product || !canSeeStatus(access, product.status)) {
    return errorResponse(
      404,
      'PRODUCT_NOT_FOUND',
      'No such product in this rikma'
    );
  }

  const body = {
    data: requestedFields.length
      ? projectFields(product, requestedFields)
      : product
  };
  const etag = etagOf({
    p: `${resolved.projectId}/products/${productId}`,
    q: [...url.searchParams.entries()],
    v: product.updatedAt
  });

  return respond({ request, auth, body, etag });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
