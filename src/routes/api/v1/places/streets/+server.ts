import type { RequestHandler } from './$types';
import { authenticateRead, errorResponse, etagOf, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { searchStreets } from '$lib/server/places/israel.js';

/**
 * GET /api/v1/places/streets?city=<CBS code>[&q=] — the streets of one
 * locality (docs/inprogress/PLAN_SHOP_SHIPPING.md §3). Without `q`, all of
 * them (a storefront completes in the browser); with `q`, the top matches.
 */
export const GET: RequestHandler = async ({ url, request, fetch }) => {
  const authResult = await authenticateRead(request, fetch);
  if (authResult.kind === 'deny') return authResult.response;
  const city = url.searchParams.get('city') ?? '';
  if (!/^\d{1,6}$/.test(city)) return errorResponse(400, 'VALIDATION_FAILED', 'city must be a CBS locality code');
  const q = (url.searchParams.get('q') ?? '').slice(0, 60);
  const streets = await searchStreets(city, q, fetch, q ? 15 : 5000);
  return respond({
    request,
    auth: authResult.auth,
    body: { city, streets },
    etag: etagOf({ p: 'places/streets', city, q, n: streets.length })
  });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
