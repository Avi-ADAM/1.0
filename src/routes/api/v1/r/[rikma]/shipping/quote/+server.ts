import type { RequestHandler } from './$types';
import { errorResponse, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { quoteLinesOf, SHIPPING_CORS, startShippingRoute } from '$lib/server/apiPublic/shippingRoutes.js';
import { quoteForRikma } from '$lib/server/shop/shipping.js';

/**
 * POST /api/v1/r/{rikma}/shipping/quote — every way this cart can reach this
 * address, priced (docs/inprogress/PLAN_SHOP_SHIPPING.md §4).
 *
 * A storefront asks it on the cart page as the buyer types the city, and
 * again on its server right before the payment page — the second answer is
 * the one charged. The same function prices the order when it is reported,
 * so a fee that moved in between is written on the order, not lost.
 *
 * Body: `{ lines, address?: { country?, city?, zip? } }`. `unitPrice` is the
 * storefront's priced line (it decides a free-over threshold); the district is
 * resolved here from the city, never taken from the caller.
 */
export const POST: RequestHandler = async ({ params, url, request, fetch }) => {
  const start = await startShippingRoute({ params, url, request, fetch, suffix: '/shipping/quote' });
  if (start.kind === 'response') return start.response;
  const { auth, run, projectId, rikma } = start;

  const body = await request.json().catch(() => null);
  const parsed = quoteLinesOf(body?.lines);
  if (parsed.ok === false) return errorResponse(400, 'VALIDATION_FAILED', parsed.message);

  let result;
  try {
    result = await quoteForRikma(run, projectId, parsed.lines, body?.address, fetch);
  } catch (e) {
    console.error('[apiPublic] shipping quote failed:', e);
    return errorResponse(502, 'UPSTREAM_ERROR', 'The shipping price could not be computed right now');
  }
  return respond({
    request,
    auth,
    body: { rikma, configured: result.configured, currency: result.currency, ...(result.quote ?? {}) },
    etag: '',
    noStore: true,
    extraHeaders: SHIPPING_CORS
  });
};

export const OPTIONS: RequestHandler = async () => {
  const res = preflightResponse();
  res.headers.set('Access-Control-Allow-Methods', SHIPPING_CORS['Access-Control-Allow-Methods']);
  return res;
};
