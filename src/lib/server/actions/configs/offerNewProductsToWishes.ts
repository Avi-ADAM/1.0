/**
 * A new supplier's products → the open wishes they answer
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.6.5, M9).
 *
 * Run by materializeRikmaBlueprint right after a rikma import created its
 * products, as the importing member. The products are re-read through a query
 * that filters by the member's rikma, so only its own active products can be
 * offered; the wishes are read with the service token and never returned — the
 * supplier learns nothing about them. What a match produces is exactly what a
 * wish's own matching run produces (matchRatson): a `suggested`, auto-generated
 * proposal on the plan row it answers, which the wisher accepts or sets aside.
 * The wisher is notified; nobody else is.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { autoProposalVars, candidateOf, THRESHOLD, wishFactsOf } from './matchRatson.js';
import { pickWishOffers, type OpenWish } from '../../concierge/newProductWishes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId ?? '');
  const ids = (Array.isArray(params.matanotIds) ? params.matanotIds : []).map(String).filter((id) => /^\d+$/.test(id)).slice(0, 50);
  const none = { data: { proposalsCreated: 0, wishes: 0 }, recipientIds: [] as string[], updateStrategy: { type: 'none' as const } };
  if (!projectId || !ids.length) return none;

  // Service token for both reads (serviceAdmin-only qids); the project filter
  // in 377 is what limits this to the caller's own rikma.
  const prodRes = await strapi.execute('377matanotsForWishOffer', { ids, pid: projectId }, undefined, context.fetch);
  const products = (prodRes?.data?.matanots?.data ?? []).map(candidateOf);
  if (!products.length) return none;

  const wishRes = await strapi.execute('376listOpenWishesForMatching', { limit: 150 }, undefined, context.fetch);
  const wishes: OpenWish[] = (wishRes?.data?.ratsons?.data ?? []).map((n: any) => ({
    id: String(n.id),
    ownerIds: (n.attributes?.users_permissions_users?.data ?? []).map((u: any) => String(u.id)),
    facts: wishFactsOf(n.attributes ?? {})
  }));

  const offers = pickWishOffers(products, wishes, { supplierId: String(context.userId), threshold: THRESHOLD });
  const now = new Date().toISOString();
  const touched = new Set<string>();
  const recipients = new Set<string>();
  let created = 0;

  for (const offer of offers) {
    try {
      const r = await strapi.execute('101createRatsonProposal', autoProposalVars(offer.ratsonId, offer.cand, now), undefined, context.fetch);
      if (!r?.data?.createRatsonProposal?.data?.id) continue;
      created++;
      touched.add(offer.ratsonId);
      offer.ownerIds.forEach((id) => recipients.add(id));
    } catch (err) {
      console.warn('[offerNewProductsToWishes] proposal failed', offer.ratsonId, offer.cand.id, err);
    }
  }

  // Same status step matchRatson takes when it finds something.
  for (const ratsonId of touched) {
    try {
      await strapi.execute('100updateRatson', { id: ratsonId, status_ratson: 'matching', last_matched_at: now }, undefined, context.fetch);
    } catch (err) {
      console.warn('[offerNewProductsToWishes] ratson status not updated', ratsonId, err);
    }
  }

  return {
    data: { proposalsCreated: created, wishes: touched.size },
    recipientIds: [...recipients],
    updateStrategy: { type: 'none' as const }
  };
};

export const offerNewProductsToWishesConfig: ActionConfig = {
  key: 'offerNewProductsToWishes',
  description:
    "Offer a rikma's newly created products to the open wishes they answer (suggested proposals + a note to each wisher). Run after a rikma import.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    matanotIds: { type: 'array', required: true, description: "Ids of the rikma's products just created" }
  },
  access: ['user'],
  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only a member of the rikma can offer its products'
    }
  ],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'recipientIds' }
    },
    templates: {
      title: {
        he: 'נמצא ספק חדש למשאלה שלך',
        en: 'A new supplier for your wish',
        ar: 'مزوّد جديد لأمنيتك'
      },
      body: {
        he: 'עסק שהצטרף עכשיו ל-1lev1 מציע משהו שמתאים למשאלה שלך. היכנסו לקונסיירז׳ כדי לראות.',
        en: 'A business that just joined 1lev1 offers something that fits your wish. Open Concierge to see it.',
        ar: 'نشاط تجاري انضم للتو إلى 1lev1 يقدّم ما يناسب أمنيتك. افتح Concierge لتراه.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', type: 'ratsonProposal', url: '/concierge' }
  },
  updateStrategy: { type: 'none' }
};
