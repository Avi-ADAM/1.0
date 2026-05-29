import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

type RatsonCard = {
  id: string;
  code: string;
  name: string;
  excerpt: string;
  status: string;
  fulfilled: boolean;
  fulfillmentScore: number | null;
  proposalsCount: number;
  missionsCount: number;
  resourcesCount: number;
  values: string[];
  categories: string[];
  startDate: string | null;
  finnishDate: string | null;
  totalBounti: number | null;
  createdAt: string | null;
  authorName?: string;
  authorAvatar?: string;
};

type PublicRatsonCard = RatsonCard & {
  lat: number | null;
  lng: number | null;
  subCategory: string | null;
};

function shortCode(id: string | number): string {
  const s = String(id).padStart(6, '0');
  return `R-${s.slice(-6)}`;
}

function excerpt(text: string | null, max = 180): string {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? trimmed.slice(0, max - 1) + '…' : trimmed;
}

function authorOf(usersData: any): { name: string; avatar: string } {
  const first = usersData?.[0]?.attributes;
  if (!first) return { name: 'משתמשת', avatar: 'מש' };
  const full = first.username || 'משתמשת';
  const parts = full.split(/\s+/);
  const avatar = (parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '');
  return { name: full, avatar: avatar.slice(0, 2) || 'מש' };
}

function mapRatsonCard(node: any): RatsonCard {
  const a = node.attributes || {};
  return {
    id: node.id,
    code: shortCode(node.id),
    name: a.name || '(ללא שם)',
    excerpt: excerpt(a.longDes || a.desc),
    status: a.status_ratson || (a.fulfilled ? 'fulfilled' : 'open'),
    fulfilled: !!a.fulfilled,
    fulfillmentScore: typeof a.fulfillment_score === 'number' ? a.fulfillment_score : null,
    proposalsCount: 0,
    missionsCount: a.missions?.data?.length ?? 0,
    resourcesCount: a.mashaabims?.data?.length ?? 0,
    values: (a.vallues?.data ?? []).map((v: any) => v.attributes?.valueName).filter(Boolean),
    categories: (a.categories?.data ?? []).map((c: any) => c.attributes?.name).filter(Boolean),
    startDate: a.startDate ?? null,
    finnishDate: a.finnishDate ?? null,
    totalBounti: typeof a.totalbounti === 'number' ? a.totalbounti : null,
    createdAt: a.createdAt ?? null,
  };
}

function mapPublicCard(node: any): PublicRatsonCard {
  const base = mapRatsonCard(node);
  const a = node.attributes || {};
  const { name, avatar } = authorOf(a.users_permissions_users?.data);
  return {
    ...base,
    lat: typeof a.lat === 'number' ? a.lat : null,
    lng: typeof a.lng === 'number' ? a.lng : null,
    subCategory: a.sub_category ?? null,
    authorName: name,
    authorAvatar: avatar,
  };
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const uid = (locals as any)?.uid;

  let mine: RatsonCard[] = [];
  let publicFeed: PublicRatsonCard[] = [];
  let queryOk = { mine: false, public: false };

  if (uid) {
    try {
      const res: any = await sendToSer({ uid }, '106listMyRatsons', 0, 0, false, fetch);
      const nodes = res?.data?.ratsons?.data ?? [];
      mine = nodes.map(mapRatsonCard);
      queryOk.mine = true;
    } catch (e) {
      console.error('[concierge] 106listMyRatsons failed', e);
    }
  }

  try {
    const res: any = await sendToSer({ limit: 24 }, '109listOpenRatsons', 0, 0, false, fetch);
    const nodes = res?.data?.ratsons?.data ?? [];
    publicFeed = nodes.map(mapPublicCard);
    queryOk.public = true;
  } catch (e) {
    console.error('[concierge] 109listOpenRatsons failed', e);
  }

  return { mine, publicFeed, queryOk, uid };
};
