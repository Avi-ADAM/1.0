import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import {
  genericCard,
  maagadCard,
  pickOffer,
  wishCard,
  type MaagadCardData,
  type OgNode,
  type WishCardData
} from '$lib/server/og/cards.js';
import { ogLang } from '$lib/server/og/labels.js';
import { renderCardPng } from '$lib/server/og/render.js';

/**
 * GET /api/og/maagad/<id>.png · GET /api/og/wish/<id>.png  (?lang=he|en|ar|ru|es)
 *
 * The share card behind a public demand page's `og:image` — see
 * PLAN_MARKETING_GLOBAL §4 (loops 1 and 4) and `$lib/server/og/cards.ts`.
 *
 * Public and anonymous, like /api/badge: WhatsApp, Telegram, Facebook, X and
 * Slack fetch it with no cookie. It shows only what the page itself shows a
 * guest — aggregate counts, the offer's figures, the wish's title — and reads
 * with the service token the way the pages do for anonymous visitors. A wish
 * that is private or still a draft, or an id that does not exist, gets the
 * brand card: a 200 so the unfurl is still branded, nothing about the object.
 *
 * The pages put a version token in the image URL (signatures, members, offers)
 * so a changed pool is a new URL and the chat apps' own caches do not keep
 * showing "7 of 10" after the tenth signature.
 */
export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const m = /^(\d{1,12})\.png$/.exec(params.file);
  const kind = params.kind;
  if (!m || (kind !== 'maagad' && kind !== 'wish')) throw error(404, 'Not found');
  const id = m[1];
  const lang = ogLang(url.searchParams.get('lang'));

  let tree: OgNode | null = null;
  try {
    if (kind === 'maagad') {
      const d = await loadMaagad(id, fetch);
      if (d) tree = maagadCard(d, lang);
    } else {
      const d = await loadWish(id, fetch);
      if (d) tree = wishCard(d, lang);
    }
  } catch (e) {
    console.error('[og] load failed', kind, id, e);
  }
  const found = !!tree;
  if (!tree) tree = genericCard(lang, kind);

  const png = await renderCardPng(tree);
  // A fresh Uint8Array over an ArrayBuffer: Node's Buffer is typed over
  // ArrayBufferLike, which the Fetch BodyInit type does not accept.
  const body = new Uint8Array(png);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(png.length),
      // The URL carries a version token, so a long shared-cache life is safe;
      // the fallback stays short so a pool that appears is picked up quickly.
      'Cache-Control': found
        ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
        : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};

/* ----------------------------------------------------------------------- */

const ACTIVE_MEMBER = new Set(['interested', 'signed', 'active']);

async function loadMaagad(id: string, fetch: typeof globalThis.fetch): Promise<MaagadCardData | null> {
  const res: any = await sendToSer({ id }, '229queryMaagadFull', 0, 0, true, fetch);
  const node = res?.data?.maagad?.data;
  if (!node) return null;
  const a = node.attributes ?? {};

  const offers = (a.offers?.data ?? []).map((o: any) => {
    const oa = o.attributes ?? {};
    const departure = !!oa.matanot?.data?.id;
    return {
      title: oa.title ?? oa.matanot?.data?.attributes?.name ?? '',
      signedCount: Number(oa.signed_count ?? 0),
      min: oa.min_participants ?? null,
      max: oa.max_participants ?? null,
      deadline: oa.sign_deadline ?? null,
      status: oa.status_offer ?? 'open',
      // A departure's price moves with the group (PLAN_POOL_PRODUCT §4); a
      // plain threshold offer has a fixed unit price.
      price: departure ? (oa.price_current ?? null) : (oa.unit_price ?? null),
      currency: departure
        ? (oa.proposer_project?.data?.attributes?.currencyCode ?? null)
        : (oa.currency?.data?.attributes?.name ?? null),
      recurrence: oa.recurrence ?? null
    };
  });

  return {
    id: String(node.id),
    name: a.name ?? '',
    desc: a.canonical_desc ?? '',
    membersCount: (a.members?.data ?? []).filter((m: any) => ACTIVE_MEMBER.has(m?.attributes?.status_member)).length,
    scope: a.scope ?? 'local',
    frequency: a.frequency ?? null,
    status: a.status_maagad ?? 'forming',
    categories: (a.categories?.data ?? []).map((c: any) => c?.attributes?.name).filter(Boolean),
    offersCount: offers.length,
    best: pickOffer(offers)
  };
}

async function loadWish(id: string, fetch: typeof globalThis.fetch): Promise<WishCardData | null> {
  const res: any = await sendToSer({ id }, '105queryRatsonWithProposals', 0, 0, true, fetch);
  const node = res?.data?.ratson?.data;
  if (!node) return null;
  const a = node.attributes ?? {};
  // Same gate as /wish/[id]: a draft is not a wish yet, `personal` is private.
  if (a.status_ratson === 'draft' || a.access_mode === 'personal') return null;

  const owner = a.users_permissions_users?.data?.[0];
  const ownerName = owner?.attributes?.username ?? owner?.username ?? '';

  return {
    id: String(node.id),
    name: a.name ?? '',
    longDes: a.longDes || a.desc || '',
    ownerName: String(ownerName),
    proposalsCount: (res?.data?.ratsonProposals?.data ?? []).length,
    startDate: a.startDate ?? null,
    locationHint: a.location_hint ?? null,
    totalBounti: typeof a.totalbounti === 'number' ? a.totalbounti : null,
    fulfilled: !!a.fulfilled || a.status_ratson === 'fulfilled',
    missionsCount: (a.extracted_missions ?? []).length,
    resourcesCount: (a.extracted_resources ?? []).length,
    values: (a.vallues?.data ?? []).map((v: any) => v?.attributes?.valueName).filter(Boolean),
    categories: (a.categories?.data ?? []).map((c: any) => c?.attributes?.name).filter(Boolean)
  };
}
