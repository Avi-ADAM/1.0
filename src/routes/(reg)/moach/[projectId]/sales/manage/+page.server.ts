import { redirect } from '@sveltejs/kit';
import { landingTab } from '$lib/shop/manageTabs';
import type { PageServerLoad } from './$types';

/**
 * `/sales/manage` is the way in, not a tab (PLAN_LEADS §4.0): it opens on the
 * first tab with something waiting. Links that mean the orders go to
 * `/sales/manage/orders` directly. The query string (`?f=toCollect` from an
 * older notification) travels along.
 */
export const load: PageServerLoad = async ({ parent, params, url }) => {
  const { shop, facts } = await parent();
  // `?f=` is an orders filter — an older link that meant the orders keeps meaning them.
  const tab = url.searchParams.has('f') ? 'orders' : landingTab(shop?.orders ?? [], facts ?? null);
  redirect(307, `/moach/${params.projectId}/sales/manage/${tab}${url.search}`);
};
