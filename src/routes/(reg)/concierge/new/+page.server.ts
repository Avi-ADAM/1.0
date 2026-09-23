import { sendToSer } from '$lib/send/sendToSer.js';
import {
  clearConciergeIntent,
  isConciergeIntent,
  markCustomerTrack,
  REG_INTENT_COOKIE
} from '$lib/concierge/regIntent.js';
import type { PageServerLoad } from './$types';

/** What the composer needs to resume a saved draft — its own form fields. */
export type ServerWishDraft = {
  id: string;
  title: string;
  body: string;
  startDate: string | null;
  finnishDate: string | null;
  budgetAmount: number | null;
  whoCanOffer: boolean;
  whoCanSee: string;
  location: {
    location_mode: 'online' | 'onsite' | 'unspecified';
    isOnline: boolean;
    lat: number | null;
    lng: number | null;
    radius: number;
    location_hint: string;
  };
  extractedMissions: { name: string; imp: 'must' | 'nice' }[];
  extractedResources: { name: string; imp: 'must' | 'nice' }[];
  aiMeta: Record<string, any> | null;
};

/** Dates arrive as ISO; the composer's date inputs want `yyyy-mm-dd`. */
function dateInput(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * The owner's draft, or null for anything else — someone else's Ratson, one
 * already published, or a failed read all open an empty composer.
 */
async function loadDraft(
  id: string,
  uid: string,
  fetch: typeof globalThis.fetch
): Promise<ServerWishDraft | null> {
  try {
    const res: any = await sendToSer({ id }, '105queryRatsonWithProposals', 0, 0, false, fetch);
    const node = res?.data?.ratson?.data;
    const a = node?.attributes;
    if (!a || a.status_ratson !== 'draft') return null;
    const owners = a.users_permissions_users?.data ?? [];
    if (!owners.some((o: any) => String(o.id) === String(uid))) return null;

    const hasPoint = typeof a.lat === 'number' && typeof a.lng === 'number';
    return {
      id: String(node.id),
      title: a.name || '',
      body: a.longDes || '',
      startDate: dateInput(a.startDate),
      finnishDate: dateInput(a.finnishDate),
      budgetAmount: a.bounti && typeof a.totalbounti === 'number' ? a.totalbounti : null,
      whoCanOffer: !!a.allowJoin,
      whoCanSee: a.access_mode || 'personal',
      location: {
        location_mode: a.isOnline ? 'online' : hasPoint ? 'onsite' : 'unspecified',
        isOnline: !!a.isOnline,
        lat: hasPoint ? a.lat : null,
        lng: hasPoint ? a.lng : null,
        radius: typeof a.radius === 'number' ? a.radius : 15,
        location_hint: a.location_hint || ''
      },
      extractedMissions: (a.extracted_missions ?? []).map((m: any) => ({
        name: m?.name || '',
        imp: m?.importance === 'must' ? 'must' : 'nice'
      })),
      extractedResources: (a.extracted_resources ?? []).map((r: any) => ({
        name: r?.name || '',
        imp: r?.importance === 'must' ? 'must' : 'nice'
      })),
      aiMeta: a.ai_meta && typeof a.ai_meta === 'object' ? a.ai_meta : null
    };
  } catch (e) {
    console.error('[concierge/new] draft load failed', e);
    return null;
  }
}

/**
 * The composer. Two jobs beyond rendering it:
 *
 * - `?draft=<id>` resumes a saved draft (the owner's only).
 * - The end of the customer registration track (see regIntent.js): the intent
 *   cookie has done its job, so it goes, and the customer is remembered so a
 *   later sign-in lands on their concierge rather than the onboarding.
 *   `welcome` tells the composer this is the first visit after signing up —
 *   it greets them, and a wish they already pressed "send" on goes out.
 */
export const load: PageServerLoad = async ({ cookies, url, locals, fetch }) => {
  const arrivedFromSignup = isConciergeIntent(cookies.get(REG_INTENT_COOKIE));
  if (arrivedFromSignup) {
    clearConciergeIntent(cookies);
    markCustomerTrack(cookies, url);
  }

  const uid = (locals as any)?.uid;
  const draftId = url.searchParams.get('draft');
  const draft = draftId && uid ? await loadDraft(draftId, String(uid), fetch) : null;

  return {
    welcome: arrivedFromSignup || url.searchParams.get('welcome') === '1',
    draft
  };
};
