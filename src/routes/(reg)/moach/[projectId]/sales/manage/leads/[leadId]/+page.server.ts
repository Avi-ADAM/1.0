import { error } from '@sveltejs/kit';
import { loadLeadPage, loadLeadSettings } from '$lib/server/leads/pipelineLoad';
import { leadKey } from '$lib/leads/display';
import { loadShopProducts } from '$lib/server/shop/moachShop.js';
import type { PageServerLoad } from './$types';

/**
 * One lead (docs/inprogress/PLAN_LEADS.md §4.2) — the link its task carries.
 * Members only: `parent()` runs the moach layout's membership check before
 * the admin-token read, and a lead of another rikma reads as missing.
 */
export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
  await parent();
  depends(leadKey(params.leadId));
  let lead;
  try {
    lead = await loadLeadPage(params.projectId, params.leadId, fetch);
  } catch (e) {
    console.error('[leads] lead page read failed:', (e as any)?.getMessages?.() ?? e);
    error(503, 'LEADS_NOT_READY');
  }
  if (!lead) error(404, 'LEAD_NOT_FOUND');
  return {
    lead,
    leadSettings: await loadLeadSettings(params.projectId, fetch),
    // What an offer can be for (L4) — streamed: the page never waits for it.
    offerProducts: loadShopProducts(params.projectId, fetch)
      .then((r) =>
        (r.products ?? [])
          .filter((p) => p.status !== 'archived')
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, active: v.active }))
          }))
      )
      .catch(() => [])
  };
};
