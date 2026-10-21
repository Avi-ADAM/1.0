import { loadFulfillmentSetup } from '$lib/server/fulfillment/setup.js';
import { shopFulfillmentKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's order automation — members only (the moach layout checked).
 * The setup carries what a rule can name: zones, delivery methods and pickup
 * points (PLAN_SHOP_SHIPPING), categories, products and resources — each empty
 * until it exists.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopFulfillmentKey(params.projectId));
  return { fulfillment: await loadFulfillmentSetup(params.projectId, fetch) };
};
