import { loadShopOrders } from '$lib/server/shop/moachShop.js';
import { bannerOf } from '$lib/shop/manage.js';
import { shopOrdersKey } from '$lib/shop/keys.js';
import { salePricesFor } from '$lib/server/promotions/pricing';
import { loadPipeline } from '$lib/server/leads/pipelineLoad';
import { buildPipeline, pipelineCounts } from '$lib/leads/pipeline';
import type { PageServerLoad } from './$types';

/**
 * The plain sales page stays about money (PLAN §7.3); it only gains one line
 * when site orders wait — "3 orders waiting to ship". Streamed, so the page
 * never waits for it, and it carries counts only: the buyers stay on the
 * manage screens.
 *
 * Today's sale prices (PLAN_SHOP_PROMOTIONS P5) stream the same way: reporting
 * a sale of a product on promotion starts from its promotion price.
 *
 * Enquiries that need an answer (PLAN_LEADS §4.4) stream as one more count —
 * the same "needs attention" rule the manage screen sorts by.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopOrdersKey(params.projectId));
  return {
    shopBanner: loadShopOrders(params.projectId, fetch)
      .then((r) => (r.ready && !r.failed ? bannerOf(r.orders) : null))
      .catch(() => null),
    salePrices: salePricesFor(params.projectId).catch(() => ({})),
    leadsBanner: loadPipeline(params.projectId, fetch)
      .then((p) => {
        if (!p.ready) return null;
        const n = pipelineCounts(buildPipeline({ ...p, orders: [] }, Date.now(), p.settings)).attention;
        return n > 0 ? { count: n } : null;
      })
      .catch(() => null)
  };
};
