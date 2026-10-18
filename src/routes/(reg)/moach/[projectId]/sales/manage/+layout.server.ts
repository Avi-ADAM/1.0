import { loadShopOrders, loadShopSales } from '$lib/server/shop/moachShop.js';
import { shopOrdersKey } from '$lib/shop/keys.js';
import type { LayoutServerLoad } from './$types';

/**
 * "Manage sales" (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3 — S5). Members only: the
 * moach layout's load refuses everyone else before anything here runs, and
 * that matters — the orders carry the buyer's phone and address.
 *
 * The orders come with the first paint (the tab badge and the KPI strip need
 * them on every tab). The sales table is streamed: the KPI strip fills in when
 * it arrives, and the sales tab reads the same promise instead of asking again.
 */
export const load: LayoutServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  const projectId = params.projectId;
  depends(shopOrdersKey(projectId));

  return {
    shop: await loadShopOrders(projectId, fetch),
    sales: loadShopSales(projectId, fetch)
  };
};
