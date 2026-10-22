import { loadShopProducts } from '$lib/server/shop/moachShop.js';
import { loadResourceStock } from '$lib/server/fulfillment/stockView.js';
import { shopProductsKey, shopResourcesKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's products with their variants, and the shelves of its resources
 * (PLAN_SHOP_OPERATIONS A3) — members only (the moach layout checked).
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopProductsKey(params.projectId));
  depends(shopResourcesKey(params.projectId));
  const [catalog, resources] = await Promise.all([
    loadShopProducts(params.projectId, fetch),
    loadResourceStock(params.projectId, fetch)
  ]);
  return { catalog, resources };
};
