import { loadFulfillmentSetup } from '$lib/server/fulfillment/setup.js';
import { shopFulfillmentKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The rikma's order automation — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopFulfillmentKey(params.projectId));
  return { fulfillment: await loadFulfillmentSetup(params.projectId, fetch) };
};
