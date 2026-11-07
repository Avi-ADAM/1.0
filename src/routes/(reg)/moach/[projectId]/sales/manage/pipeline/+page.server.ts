import { loadShopProducts } from '$lib/server/shop/moachShop.js';
import type { PageServerLoad } from './$types';

/**
 * "In progress" — the leads and proposals come from the manage layout. This adds only
 * what a deal for a customer off the site can be for (PLAN_OFFSITE_CLIENT): the rikma's
 * products, streamed so the tab never waits for them. Members only — the moach layout
 * checks that before `parent()` returns.
 */
export const load: PageServerLoad = async ({ params, parent, fetch }) => {
  await parent();
  return {
    offsiteProducts: loadShopProducts(params.projectId, fetch)
      .then((r) =>
        (r.products ?? [])
          .filter((p) => p.status !== 'archived')
          .map((p) => ({ id: p.id, name: p.name, price: p.price }))
      )
      .catch(() => [] as Array<{ id: string; name: string; price: number | null }>)
  };
};
