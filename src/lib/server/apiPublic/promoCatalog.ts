/**
 * The catalog under the rikma's promotions (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §5.2).
 *
 * `price` stays the approved price; `salePrice` and `promotion` say what an
 * item / store promotion makes of it today, and `priceRange` reads the
 * discounted prices. Decorated after the catalog query and before `?fields`
 * projection, so a sparse fieldset can ask for `salePrice` like any field.
 *
 * Known limit: `sort=price` and the price filters run in the catalog query, on
 * the approved price. A promotion does not reorder the list.
 */
import type { ApiProduct } from './dto.js';
import { cachedPromoPricing } from '$lib/server/promotions/pricing';
import { decorateProduct, floorOfShelf, pricingPromotions } from '$lib/shop/promoPricing';

export async function withPromotions<T extends ApiProduct>(
  projectId: string,
  products: T[],
  now = new Date()
): Promise<{ data: T[]; etagPart: string }> {
  if (!products.length) return { data: products, etagPart: '' };
  const pricing = await cachedPromoPricing(projectId);
  const promos = pricing ? pricingPromotions(pricing.rows, pricing.shelf, { now }) : [];
  if (!pricing || !promos.length) return { data: products, etagPart: '' };
  const floorOf = floorOfShelf(pricing.shelf, pricing.policy);
  return {
    data: products.map((p) => decorateProduct(p, promos, now, floorOf) as T),
    // A promotion that starts or ends changes prices without changing a row.
    etagPart: promos.map((p) => `${p.id}:${p.endsAt ?? ''}`).join(',')
  };
}
