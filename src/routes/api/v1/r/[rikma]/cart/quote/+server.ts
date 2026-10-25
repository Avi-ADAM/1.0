import type { RequestHandler } from './$types';
import { errorResponse, preflightResponse, respond } from '$lib/server/apiPublic/http.js';
import { quoteLinesOf, SHIPPING_CORS, startShippingRoute } from '$lib/server/apiPublic/shippingRoutes.js';
import { quoteForRikma } from '$lib/server/shop/shipping.js';
import { loadPromoPricing, promoAdminExec } from '$lib/server/promotions/pricing';
import { floorOfShelf, pricingPromotions, resolveCartLines } from '$lib/shop/promoPricing';
import { priceCart } from '$lib/shop/promotions';

/**
 * POST /api/v1/r/{rikma}/cart/quote — what this cart costs, promotions and
 * shipping included (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2).
 *
 * **1lev1 prices, the storefront asks** — the principle of PLAN_SHOP_SHIPPING,
 * so there are never two engines that drift. The list prices are read from
 * the rikma's own rows; a `unitPrice` the caller sends is ignored. A
 * storefront asks on the cart page and again right before payment; that
 * second answer is what it charges, and each line's `promotionId` goes back
 * on `POST /orders`, so a buyer who started paying a moment before the end
 * keeps the price (§5.3).
 *
 * Body: `{ lines: [{ productId, variantId?, quantity, lineId? }], address?: { country?, city?, zip? } }`.
 * Refusals are `POST /orders`' own: 404 PRODUCT_NOT_FOUND / VARIANT_NOT_FOUND,
 * 409 NOT_CHECKOUTABLE / VARIANT_REQUIRED, with the line's index.
 */
export const POST: RequestHandler = async ({ params, url, request, fetch }) => {
  const start = await startShippingRoute({ params, url, request, fetch, suffix: '/cart/quote' });
  if (start.kind === 'response') return start.response;
  const { auth, run, projectId, rikma } = start;

  const body = await request.json().catch(() => null);
  const parsed = quoteLinesOf(body?.lines);
  if (parsed.ok === false) return errorResponse(400, 'VALIDATION_FAILED', parsed.message);
  const lineIds: Array<string | null> = (Array.isArray(body?.lines) ? body.lines : []).map((l: any) =>
    typeof l?.lineId === 'string' && l.lineId.length <= 64 ? l.lineId : null
  );

  const now = new Date();
  let pricing;
  try {
    pricing = await loadPromoPricing(promoAdminExec(), projectId, { shelf: 'always' });
  } catch (e) {
    console.error('[apiPublic] cart quote: catalog read failed:', e);
    return errorResponse(502, 'UPSTREAM_ERROR', 'The cart could not be priced right now');
  }
  const cart = resolveCartLines(
    parsed.lines.map((l, i) => ({ lineId: lineIds[i] ?? String(i), productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
    pricing.shelf
  );
  if (cart.ok === false) return errorResponse(cart.status, cart.code, cart.message);

  const priced = priceCart(cart.lines, pricingPromotions(pricing.rows, pricing.shelf, { now }), {
    now,
    floorOf: floorOfShelf(pricing.shelf, pricing.policy)
  });

  // Shipping on the discounted lines — a free-over threshold reads what the buyer pays.
  let shipping;
  try {
    shipping = await quoteForRikma(
      run,
      projectId,
      priced.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, unitPrice: l.lineTotal / l.quantity })),
      body?.address,
      fetch
    );
  } catch (e) {
    console.error('[apiPublic] cart quote: shipping failed:', e);
    shipping = null;
  }

  return respond({
    request,
    auth,
    body: {
      rikma,
      currency: shipping?.currency ?? pricing.currencyCode,
      pricedAt: now.toISOString(),
      lines: priced.lines.map((l) => ({
        lineId: l.lineId ?? null,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        listPrice: l.listPrice,
        unitPrice: Math.round(l.unitPrice * 10000) / 10000,
        lineTotal: l.lineTotal,
        discount: l.discount,
        // Send this back on POST /orders, line by line.
        promotionId: l.promotionId ?? l.thresholdPromotionId,
        promotionIds: l.promotionIds
      })),
      listTotal: Math.round(priced.lines.reduce((s, l) => s + l.listPrice * l.quantity, 0) * 100) / 100,
      subtotal: priced.subtotal,
      thresholdDiscount: priced.thresholdDiscount,
      total: priced.total,
      applied: priced.applied,
      hints: priced.hints,
      shipping: shipping ? { configured: shipping.configured, ...(shipping.quote ?? {}) } : null
    },
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
