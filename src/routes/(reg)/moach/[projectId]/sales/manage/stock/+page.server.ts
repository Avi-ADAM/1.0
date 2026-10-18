import { loadShopProducts } from '$lib/server/shop/moachShop.js';
import { shopProductsKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The rikma's products with their variants — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopProductsKey(params.projectId));
  return { catalog: await loadShopProducts(params.projectId, fetch) };
};
