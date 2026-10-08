/**
 * /deals/offers — the direct offers I wrote (PLAN_DIRECT_OFFER P3).
 * Auth is the /deals layout's; the list is read on the service token, filtered to the
 * signed-in provider by the id from the session.
 */

import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import type { PageServerLoad } from './$types';

export type OfferListItem = {
  id: string;
  name: string;
  state: 'draft' | 'claimed' | 'closed';
  recipientHint: string;
  customerName: string | null;
  createdAt: string | null;
  claimedAt: string | null;
  linkIssued: boolean;
};

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const uid = String(locals.uid);
  let offers: OfferListItem[] = [];
  let loadOk = true;
  try {
    const res: any = await sendViaProxy(fetch as any, '435myDirectOffers', { uid }, { isSer: true });
    offers = (res?.ratsons?.data ?? []).map((n: any) => {
      const a = n.attributes ?? {};
      const status = a.status_ratson ?? 'draft';
      const closed = a.fulfilled === true || ['fulfilled', 'cancelled', 'expired'].includes(status);
      return {
        id: String(n.id),
        name: String(a.name ?? ''),
        state: closed ? 'closed' : a.claimed_at ? 'claimed' : 'draft',
        recipientHint: String(a.offer_recipient_hint ?? ''),
        customerName: a.users_permissions_users?.data?.[0]?.attributes?.username ?? null,
        createdAt: a.createdAt ?? null,
        claimedAt: a.claimed_at ?? null,
        linkIssued: !!a.offer_link_at
      } satisfies OfferListItem;
    });
  } catch (e) {
    console.warn('[deals/offers] could not read the offers:', e);
    loadOk = false;
  }
  return { offers, loadOk };
};
