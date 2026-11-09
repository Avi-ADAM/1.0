import { error } from '@sveltejs/kit';
import { loadProductEditor } from '$lib/server/shop/productEditor.js';
import { loadBomPickers, NO_BOM_PICKERS } from '$lib/server/shop/bomPickers.js';
import { isCostPriced } from '$lib/shop/productEditor.js';
import { shopProductsKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/**
 * The seller's product editor (PLAN_SHOP_CUSTOMER_EXPERIENCE §7 S4, canvas
 * "DesktopProduct"). Members only — the moach layout checked before this runs.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, cookies, depends, locals }) => {
  await parent();
  depends(shopProductsKey(params.projectId));
  const editor = await loadProductEditor(params.projectId, params.productId, {
    jwt: cookies.get('jwt'),
    fetch
  });
  if (!editor.product && !editor.failed) error(404, 'Product not found');

  // Only a recipe that can change needs something to add to it. A failed read
  // leaves the pickers empty; the stored lines can still be edited.
  const editable = !!editor.product && !editor.product.recipeLocked && isCostPriced(editor.product);
  const pickers = editable
    ? await loadBomPickers(params.projectId, fetch).catch((e) => {
        console.warn('[product page] the recipe pickers were not read:', e);
        return NO_BOM_PICKERS;
      })
    : NO_BOM_PICKERS;
  return { editor, pickers, viewerId: String((locals as any).uid ?? '') };
};
