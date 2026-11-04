import { loadManageFacts, loadShopOrders, loadShopSales } from '$lib/server/shop/moachShop.js';
import { loadPipeline } from '$lib/server/leads/pipelineLoad';
import { shopOrdersKey } from '$lib/shop/keys.js';
import type { LayoutServerLoad } from './$types';

/**
 * "Manage sales" (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3 — S5). Members only: the
 * moach layout's load refuses everyone else before anything here runs, and
 * that matters — the orders carry the buyer's phone and address.
 *
 * The orders come with the first paint (the tab badge and the KPI strip need
 * them on every tab), and with them the few facts that decide which tabs this
 * rikma needs (PLAN_LEADS §4.0). The sales table is streamed: the KPI strip
 * fills in when it arrives, and the sales tab reads the same promise instead
 * of asking again. The deals in progress (leads, concierge proposals —
 * PLAN_LEADS §4.1) stream the same way: the "needs attention" card and the
 * "in progress" tab read one promise.
 */
export const load: LayoutServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  const projectId = params.projectId;
  depends(shopOrdersKey(projectId));

  const shop = await loadShopOrders(projectId, fetch);
  return {
    shop,
    facts: await loadManageFacts(projectId, shop.orders.length, fetch),
    sales: loadShopSales(projectId, fetch),
    pipeline: loadPipeline(projectId, fetch)
  };
};
