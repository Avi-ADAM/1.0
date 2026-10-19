import type { RequestHandler } from './$types';
import { errorResponse, etagOf, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { publicShippingOf, SHIPPING_CORS, startShippingRoute } from '$lib/server/apiPublic/shippingRoutes.js';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';

/**
 * GET /api/v1/r/{rikma}/shipping — the rikma's delivery zones, prices and
 * pickup points (docs/inprogress/PLAN_SHOP_SHIPPING.md §4).
 *
 * What a storefront shows *before* it has an address: "free delivery over
 * ₪300", "pickup in the studio, Sun–Thu 10–18", the list of areas served.
 * The price of a particular cart to a particular address is
 * `POST …/shipping/quote` — never computed in the browser.
 *
 * `enabled: false` (or the columns not deployed yet) means the rikma has not
 * set shipping up: the storefront keeps each product's own delivery options.
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const start = await startShippingRoute({ params, url, request, fetch, suffix: '/shipping' });
  if (start.kind === 'response') return start.response;
  const { auth, run, projectId, rikma } = start;

  let shipping;
  try {
    shipping = await readShippingConfig(run, projectId);
  } catch (e) {
    console.error('[apiPublic] shipping config query failed:', e);
    return errorResponse(502, 'UPSTREAM_ERROR', 'The shipping settings could not be read right now');
  }
  const body = { rikma, shipping: publicShippingOf(shipping.config, shipping.currency) };
  const etag = etagOf({ p: `${rikma.canonicalPath}/shipping`, u: shipping.config.updatedAt, e: shipping.config.enabled });
  return respond({ request, auth, body, etag, extraHeaders: SHIPPING_CORS });
};

export const OPTIONS: RequestHandler = async () => {
  const res = preflightResponse();
  res.headers.set('Access-Control-Allow-Methods', SHIPPING_CORS['Access-Control-Allow-Methods']);
  return res;
};
