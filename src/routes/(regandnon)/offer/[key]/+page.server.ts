/**
 * /offer/<key> — the link a provider sends with a direct offer.
 * docs/inprogress/PLAN_DIRECT_OFFER.md §5.1, P4.
 *
 * The link opens a *view*: who offers, what, when, for how much, and what happens next.
 * Taking it needs an account (a guest is sent through the short concierge signup and
 * comes back here, `REG_NEXT_COOKIE`), and is an explicit click — never automatic.
 *
 * Nothing is read before the signature is checked, and a bad, old or revoked link reads
 * the same as a wish that does not exist: a guess learns nothing. The recipient's name
 * and the email lock are the provider's, and never reach this page.
 */

import { fail, redirect } from '@sveltejs/kit';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { actionViaProxy } from '$lib/server/actionViaProxy.js';
import { offerView } from '$lib/offer/directOffer';
import { checkOfferKey, offerKeyId } from '$lib/server/offer/offerKey';
import type { Actions, PageServerLoad } from './$types';

type Shown = {
  name: string;
  longDes: string;
  startDate: string | null;
  finnishDate: string | null;
  isOnline: boolean;
  locationHint: string | null;
  provider: { id: string; name: string; pic: string | null } | null;
  projectName: string | null;
  lines: { kind: 'mission' | 'resource'; name: string; amount: number | null; price: number | null }[];
  total: number;
};

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const uid = locals.uid ? String(locals.uid) : null;
  const key = String(params.key ?? '');
  const id = offerKeyId(key);
  if (!id) return { state: 'invalid' as const, key, signedIn: !!uid };

  let res: any = null;
  try {
    res = await sendViaProxy(fetch as any, '433directOfferById', { id }, { isSer: true });
  } catch (e) {
    console.warn('[offer/[key]] could not read the offer:', e);
    return { state: 'unavailable' as const, key, signedIn: !!uid };
  }
  const view = offerView(res);
  if (!view) return { state: 'invalid' as const, key, signedIn: !!uid };

  // The one who took it goes straight to her wish; anyone else learns only that it is taken.
  if (view.state === 'claimed' && uid && view.ownerIds.includes(uid)) throw redirect(303, `/concierge/${id}`);

  const check = checkOfferKey(key, { id, offer_link_at: view.linkAt, offer_expires_at: view.expiresAt });
  if (check === 'invalid') return { state: 'invalid' as const, key, signedIn: !!uid };
  if (check === 'expired') return { state: 'expired' as const, key, signedIn: !!uid, providerName: view.provider?.name ?? '' };
  if (view.state !== 'draft') return { state: view.state === 'claimed' ? ('taken' as const) : ('closed' as const), key, signedIn: !!uid };

  const offer: Shown = {
    name: view.name,
    longDes: view.longDes,
    startDate: view.startDate,
    finnishDate: view.finnishDate,
    isOnline: view.isOnline,
    locationHint: view.locationHint,
    provider: view.provider,
    projectName: view.projectName,
    lines: view.lines.map(({ kind, name, amount, price }) => ({ kind, name, amount, price })),
    total: view.total
  };
  return {
    state: 'open' as const,
    key,
    signedIn: !!uid,
    own: !!uid && view.provider?.id === uid,
    emailLocked: view.emailLocked,
    offer
  };
};

export const actions: Actions = {
  claim: async ({ params, locals, fetch }) => {
    if (!locals.uid) return fail(401, { code: 'SIGN_IN' });
    const out = await actionViaProxy(fetch as any, 'claimDirectOffer', { key: String(params.key ?? '') });
    if (!out?.success) return fail(400, { code: out?.error?.code ?? 'FAILED' });
    throw redirect(303, out.data?.path ?? '/concierge');
  }
};
