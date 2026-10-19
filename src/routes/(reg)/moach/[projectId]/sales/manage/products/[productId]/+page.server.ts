import { error } from '@sveltejs/kit';
import { loadProductEditor } from '$lib/server/shop/productEditor.js';
import { shopProductsKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/**
 * The seller's product editor (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4, canvas
 * "DesktopProduct"). Members only — the moach layout checked before this runs.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, cookies, depends }) => {
  await parent();
  depends(shopProductsKey(params.projectId));
  const editor = await loadProductEditor(params.projectId, params.productId, {
    jwt: cookies.get('jwt'),
    fetch
  });
  if (!editor.product && !editor.failed) error(404, 'Product not found');
  return { editor };
};
