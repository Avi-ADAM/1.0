import type { RequestHandler } from './$types';
import { etagOf, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { startShippingRoute } from '$lib/server/apiPublic/shippingRoutes.js';
import { cachedPromoPricing } from '$lib/server/promotions/pricing';
import { apiPromotionsOf } from '$lib/shop/promoPricing';

/**
 * GET /api/v1/r/{rikma}/promotions — the rikma's running and coming
 * promotions (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2), for a banner and
 * a "sale" page on its site.
 *
 * Same opening checks as the catalog (who asks, which rikma, key ↔ path).
 * Only what the rikma agreed to: proposals, paused and ended promotions are
 * nobody's business on a storefront. A promotion's own price is on each
 * product (`salePrice`); what a cart pays is `POST /cart/quote`.
 */
export const GET: RequestHandler = async ({ params, url, request, fetch }) => {
  const start = await startShippingRoute({ params, url, request, fetch, suffix: '/promotions' });
  if (start.kind === 'response') return start.response;
  const { auth, projectId, rikma } = start;

  const pricing = await cachedPromoPricing(projectId);
  const data = pricing ? apiPromotionsOf(pricing.rows, pricing.shelf) : [];
  return respond({
    request,
    auth,
    body: { rikma, data },
    etag: etagOf({ p: rikma.canonicalPath, v: data.map((d) => `${d.id}:${d.status}:${d.endsAt}:${d.remaining.units}:${d.remaining.orders}`) })
  });
};

export const OPTIONS: RequestHandler = async () => preflightResponse();
