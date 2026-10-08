/**
 * /deals/offers/[id] — one direct offer, as its provider manages it (PLAN_DIRECT_OFFER P3–P4).
 *
 * The current link is recomputed here from `offer_link_at` — it is a signature, not a
 * stored secret — so the provider can copy it again after a reload. Only the provider
 * who wrote the offer gets this page; anyone else gets a 404 (not a 403: an offer's
 * existence is the provider's business).
 */

import { error } from '@sveltejs/kit';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { offerView } from '$lib/offer/directOffer';
import { mintOfferKey } from '$lib/server/offer/offerKey';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = String(locals.uid);
  let res: any;
  try {
    res = await sendViaProxy(fetch as any, '433directOfferById', { id: params.id }, { isSer: true });
  } catch (e) {
    console.error('[deals/offers/[id]] could not read the offer:', e);
    throw error(503, 'Could not load the offer right now');
  }
  const view = offerView(res);
  if (!view || view.provider?.id !== uid) throw error(404, 'Not found');

  return {
    offer: view,
    linkPath: view.state === 'draft' && view.linkAt ? `/offer/${mintOfferKey(view.id, view.linkAt)}` : null
  };
};
