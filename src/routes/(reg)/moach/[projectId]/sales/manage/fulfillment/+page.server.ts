import { loadFulfillmentSetup } from '$lib/server/fulfillment/setup.js';
import { readShippingConfig } from '$lib/server/shop/shippingConfig.js';
import { strapiClient } from '$lib/server/actions';
import { shopFulfillmentKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The rikma's order automation — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopFulfillmentKey(params.projectId));
  const run = (qid: string, vars: Record<string, unknown>) => strapiClient.execute(qid, vars, undefined, fetch);
  const [fulfillment, shipping] = await Promise.all([
    loadFulfillmentSetup(params.projectId, fetch),
    // The zones a rule can be narrowed to (PLAN_SHOP_SHIPPING) — none until it is set up.
    readShippingConfig(run, params.projectId).catch(() => null)
  ]);
  return {
    fulfillment,
    zones: (shipping?.config.zones ?? []).map((z) => ({ id: z.id, name: z.name }))
  };
};
