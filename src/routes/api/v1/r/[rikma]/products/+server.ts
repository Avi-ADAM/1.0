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
import { parseCatalogQuery } from '$lib/server/apiPublic/query.js';
import { projectFields } from '$lib/server/apiPublic/dto.js';
import { withPromotions } from '$lib/server/apiPublic/promoCatalog.js';
import {
  buildListBody,
  fetchProductPage,
  fetchRikmaRef,
  refOf,
  shopSchemaLive,
  strapiRun
} from '$lib/server/apiPublic/catalog.js';
import { isHiddenProject } from '$lib/server/discovery/hiddenProjects.js';
import { stockFlagsLive } from '$lib/server/shop/stockFlags.js';

/**
 * GET /api/v1/r/{rikma}/products — the rikma's catalog
 * (docs/tbd/PLAN_HEADLESS_PRODUCTS_API.md §5.2, §5.5).
 *
 * The order of the checks is the contract (§5.0, §5.1):
 *
 *   1. who is asking (anonymous / keyed) — a bad key never falls back to public;
 *   2. which rikma the path names — 301 for a different spelling or a former
 *      address, 404 for a slug nobody has (the *same* resolution the page uses);
 *   3. key ↔ path agreement — `403 RIKMA_MISMATCH`, both sides independent;
 *   4. does that rikma exist — 404;
 *   5. what the caller may see — published for anonymous, drafts only with
 *      `products:read:draft` (`hideFromDiscovery` does not hide from the shop);
 *   6. only then the query itself.
 *
 * A rikma hidden from the discovery surfaces (a QA rikma) answers 404 to the
 * anonymous catalog, exactly as `/gift` skips its products. A key still reads
 * it: the key belongs to a member, and QA needs the API too.
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const run = strapiRun(fetch);

  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const { auth } = authResult;

  const resolved = await resolveRikmaFromPath(params.rikma, run, {
    search: url.search,
    suffix: '/products'
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

  // What this deployment can answer (§5.2): with no shop schema, a price
  // filter reads `price` and `?hasVariants=true` is an honest empty list —
  // decided before the query, so no request ever depends on a column that is
  // not there yet.
  const caps = { shopSchema: await shopSchemaLive(run), stockFlags: await stockFlagsLive(run) };

  const parsed = parseCatalogQuery(url.searchParams, access, caps);
  if (parsed.ok === false)
    return errorResponse(parsed.status, parsed.code, parsed.message);
  const query = parsed.value;

  const rikma = refOf(rikmaRow);
  let page;
  try {
    page = await fetchProductPage(run, {
      projectId: resolved.projectId,
      rikma,
      access,
      query
    });
  } catch (e) {
    console.error('[apiPublic] products query failed:', e);
    return errorResponse(
      502,
      'UPSTREAM_ERROR',
      'The catalog could not be read right now',
      {
        'X-1lev1-Trace': traceOf(request)
      }
    );
  }

  const body = buildListBody({ rikma, page, query, search: url.searchParams });
  // The rikma's promotions — `salePrice` / `promotion` (PLAN_SHOP_PROMOTIONS §5.2),
  // before the sparse fieldset so it can be asked for.
  const promoted = await withPromotions(resolved.projectId, body.data);
  body.data = promoted.data;
  if (query.fields.length) {
    body.data = body.data.map((product) =>
      projectFields(product, query.fields)
    ) as typeof body.data;
  }

  // The ETag describes *this* answer: the rikma, the parameters, and the
  // versions of the rows in it. A row that changed under the same query changes
  // the tag; a different filter changes it too (§4.5).
  const etag = etagOf({
    p: rikma.canonicalPath,
    q: [...url.searchParams.entries()],
    v: page.data.map((p) => `${p.id}:${p.updatedAt ?? ''}`),
    promo: promoted.etagPart
  });

  // No `X-1lev1-Rikma-Canonical` on a 200: the client is already on the
  // canonical address, and the header exists to explain a 301 (§5.4).
  return respond({ request, auth, body, etag });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
