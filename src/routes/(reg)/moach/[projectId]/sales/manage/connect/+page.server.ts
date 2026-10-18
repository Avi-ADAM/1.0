import { loadShopProducts } from '$lib/server/shop/moachShop.js';
import { shopProductsKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The product picker of the API panel — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopProductsKey(params.projectId));
  return { catalog: await loadShopProducts(params.projectId, fetch) };
};
