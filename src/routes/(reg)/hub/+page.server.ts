import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export interface HubKpi {
  votes: number;
  urgent: number;
  suggestions: number;
  activePurchases: number;
  activeSales: number;
}

/**
 * One vote-awaiting item, ready for the hub ActionFeed. `type` is the lev
 * `ani` value of the item's card type, so the client can deep-link into the
 * matching quantum slice (`/lev?focus=<type>&project=<projectId>`).
 * `title` may be empty (e.g. decisions have no name) — the client falls back
 * to a localized type label.
 */
export interface HubFeedItem {
  id: string;
  type: string;
  title: string;
  projectId: string;
  projectName: string;
  urgent: boolean;
  deadline: string | null;
  createdAt: string | null;
}

export interface HubSummary {
  kpi: HubKpi;
  topFive: HubFeedItem[];
  username: string;
  profilePic?: string;
}

/**
 * Aggregate demand-map totals for the hub teaser
 * (PLAN_HUB_LEV_DEMAND_SYNC direction 3): how much live demand & supply sits
 * on /demand right now — wishes, pools, threshold offers, rikma missions and
 * resources, products. Counts only, no items — one tap opens the map.
 */
export interface HubDemandSummary {
  wishes: number;
  maagadim: number;
  offers: number;
  missions: number;
  resources: number;
  products: number;
  total: number;
}

const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

function isUrgent(deadlineStr?: string): boolean {
  if (!deadlineStr) return false;
  const t = new Date(deadlineStr).getTime();
  const now = Date.now();
  return t > now && t - now < URGENT_THRESHOLD_MS;
}

/**
 * Items that use ordered voting rounds (pendms, tosplits, sheirutpends).
 * orderon = max(negoCount, max vote order).
 * User still needs to vote when they have no vote with order === orderon.
 */
function needsOrderedVote(vots: any[], negoCount: number, uid: string): boolean {
  const maxVoteOrder = vots.reduce((max, v) => Math.max(max, v.order ?? 0), 0);
  const orderon = Math.max(negoCount, maxVoteOrder);
  return !vots.some(
    (v) => v.users_permissions_user?.data?.id === uid && (v.order ?? 0) === orderon
  );
}

/**
 * Items that use simple voting (finiapruvals, askms, maaps, decisions).
 * User still needs to vote when they have no vote entry at all.
 */
function needsSimpleVote(vots: any[], uid: string): boolean {
  return !vots.some((v) => v.users_permissions_user?.data?.id === uid);
}

function processHubSummary(raw: any, uid: string): HubSummary {
  const userData = raw?.data?.usersPermissionsUser?.data;
  if (!userData) {
    return {
      kpi: { votes: 0, urgent: 0, suggestions: 0, activePurchases: 0, activeSales: 0 },
      topFive: [],
      username: ''
    };
  }

  const attrs = userData.attributes;
  let votes = 0;
  let urgent = 0;
  const feed: HubFeedItem[] = [];

  for (const project of attrs.projects_1s?.data ?? []) {
    const pa = project.attributes;
    const projectId = String(project.id);
    const projectName = pa.projectName ?? '';

    // Register one vote-awaiting item: bump the KPIs and add a feed candidate.
    const noteVote = (type: string, item: any, title: string) => {
      votes++;
      const deadline = item.attributes?.timegrama?.data?.attributes?.date ?? null;
      const isU = isUrgent(deadline);
      if (isU) urgent++;
      feed.push({
        id: String(item.id),
        type,
        title,
        projectId,
        projectName,
        urgent: isU,
        deadline,
        createdAt: item.attributes?.createdAt ?? null
      });
    };

    // pendms – ordered (negopendmissions count matters for orderon)
    for (const pend of pa.pendms?.data ?? []) {
      const a = pend.attributes;
      const negoCount = a.negopendmissions?.data?.length ?? 0;
      if (needsOrderedVote(a.users ?? [], negoCount, uid)) {
        noteVote('pends', pend, a.name ?? '');
      }
    }

    // finiapruvals – simple (no order)
    for (const fin of pa.finiapruvals?.data ?? []) {
      const a = fin.attributes;
      if (needsSimpleVote(a.vots ?? [], uid)) {
        noteVote('fiapp', fin, a.missname ?? '');
      }
    }

    // askms – simple (no order)
    for (const askm of pa.askms?.data ?? []) {
      const a = askm.attributes;
      if (needsSimpleVote(a.vots ?? [], uid)) {
        const title =
          a.open_mashaabim?.data?.attributes?.name ??
          a.pmash?.data?.attributes?.name ??
          a.sp?.data?.attributes?.name ??
          '';
        noteVote('askedm', askm, title);
      }
    }

    // maaps – simple (no order)
    for (const maap of pa.maaps?.data ?? []) {
      const a = maap.attributes;
      if (needsSimpleVote(a.vots ?? [], uid)) {
        noteVote('wegets', maap, a.name || (a.mashabetahalich?.data?.attributes?.name ?? ''));
      }
    }

    // decisions – simple (any vote counts); no name field → client shows a type label
    for (const dec of pa.decisions?.data ?? []) {
      if (needsSimpleVote(dec.attributes.vots ?? [], uid)) {
        noteVote('hachla', dec, '');
      }
    }

    // tosplits – ordered
    for (const ts of pa.tosplits?.data ?? []) {
      if (needsOrderedVote(ts.attributes.vots ?? [], 0, uid)) {
        noteVote('haluk', ts, ts.attributes.name ?? '');
      }
    }

    // sheirutpends – ordered, relational votes (Vote entity)
    for (const sp of pa.sheirutpends?.data ?? []) {
      const a = sp.attributes;
      const normalizedVots = (a.votes?.data ?? []).map((v: any) => ({
        order: v.attributes?.order,
        what: v.attributes?.what,
        users_permissions_user: v.attributes?.users_permissions_user
      }));
      if (needsOrderedVote(normalizedVots, 0, uid)) {
        noteVote('sheirutp', sp, a.sheirut?.data?.attributes?.name ?? '');
      }
    }
  }

  // Most pressing first: urgent, then nearest deadline, then longest-waiting.
  feed.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    const ac = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
    const bc = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
    return ac - bc;
  });

  // Active purchases (user as buyer – sheiruts directly on user)
  const activePurchases = (attrs.sheiruts?.data ?? []).filter((s: any) => {
    const sa = s.attributes;
    return !(sa.moneyTransfered && sa.productExepted);
  }).length;

  // Active sales (user as seller – sheiruts via projects_1s)
  let activeSales = 0;
  for (const project of attrs.projects_1s?.data ?? []) {
    activeSales += (project.attributes.sheiruts?.data ?? []).filter((s: any) => {
      const sa = s.attributes;
      return !(sa.moneyTransfered && sa.productExepted);
    }).length;
  }

  // suggestions proxy: active missions the user is working in
  const suggestions = attrs.mesimabetahaliches?.data?.length ?? 0;

  return {
    kpi: { votes, urgent, suggestions, activePurchases, activeSales },
    topFive: feed.slice(0, 5),
    username: attrs.username ?? '',
    profilePic: attrs.profilePic?.data?.attributes?.url
  };
}

function totalOf(result: PromiseSettledResult<any>, key: string): number {
  if (result.status !== 'fulfilled') return 0;
  const n = result.value?.data?.[key]?.meta?.pagination?.total;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

async function loadDemandSummary(
  fetch: typeof globalThis.fetch,
  svc: boolean
): Promise<HubDemandSummary> {
  // Two settled reads: 280 targets the maagad collections and degrades to
  // zeros on its own when they don't exist yet (same guard as qid 223).
  const [baseRes, maagadRes] = await Promise.allSettled([
    sendToSer({}, '279demandCounts', 0, 0, svc, fetch),
    sendToSer({}, '280maagadDemandCounts', 0, 0, svc, fetch)
  ]);

  const summary = {
    wishes: totalOf(baseRes, 'ratsons'),
    missions: totalOf(baseRes, 'openMissions'),
    resources: totalOf(baseRes, 'openMashaabims'),
    products: totalOf(baseRes, 'matanots'),
    maagadim: totalOf(maagadRes, 'maagads'),
    offers: totalOf(maagadRes, 'maagadOffers')
  };
  const total =
    summary.wishes +
    summary.missions +
    summary.resources +
    summary.products +
    summary.maagadim +
    summary.offers;
  return { ...summary, total };
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const uid = locals.uid ?? '';

  const summary: Promise<HubSummary> = (async () => {
    if (!uid) {
      return {
        kpi: { votes: 0, urgent: 0, suggestions: 0, activePurchases: 0, activeSales: 0 },
        topFive: [],
        username: ''
      };
    }

    const raw = await sendToSer({ idL: uid }, '85levHubSummary', 0, 0, false, fetch);
    return processHubSummary(raw, uid);
  })();

  const demand: Promise<HubDemandSummary> = loadDemandSummary(fetch, !uid);

  return { streamed: { summary, demand } };
};
