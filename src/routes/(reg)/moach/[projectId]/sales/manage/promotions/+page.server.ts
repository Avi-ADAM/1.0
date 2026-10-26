import { loadPromoSetup } from '$lib/server/promotions/manage.js';
import { shopPromotionsKey } from '$lib/shop/keys.js';
import type { PageServerLoad } from './$types';

/** The rikma's promotions and its envelope — members only (the moach layout checked). */
export const load: PageServerLoad = async ({ params, parent, depends }) => {
  await parent();
  depends(shopPromotionsKey(params.projectId));
  return { promo: await loadPromoSetup(params.projectId) };
};
