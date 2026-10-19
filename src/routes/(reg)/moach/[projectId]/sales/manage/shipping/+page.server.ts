import { loadShippingSetup } from '$lib/server/shop/shippingSetup.js';
import { shopShippingKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The rikma's shipping settings — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(shopShippingKey(params.projectId));
  return { shipping: await loadShippingSetup(params.projectId, fetch) };
};
