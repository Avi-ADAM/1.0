import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export interface HubKpi {
  votes: number;
  urgent: number;
  suggestions: number;
  activePurchases: number;
  activeSales: number;
}

export interface HubSummary {
  kpi: HubKpi;
  topFive: any[];
  username: string;
  profilePic?: string;
}

const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

function userHasVoted(vots: any[], uid: string): boolean {
  if (!Array.isArray(vots)) return false;
  return vots.some(
    (v) => v?.users_permissions_user?.data?.id === uid && v?.what != null
  );
}

function isUrgent(deadlineStr?: string): boolean {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr).getTime();
  return deadline - Date.now() < URGENT_THRESHOLD_MS && deadline > Date.now();
}

function processHubSummary(raw: any, uid: string): HubSummary {
  const userData = raw?.data?.usersPermissionsUser?.data;
  if (!userData) {
    return { kpi: { votes: 0, urgent: 0, suggestions: 0, activePurchases: 0, activeSales: 0 }, topFive: [], username: '' };
  }

  const attrs = userData.attributes;
  let votes = 0;
  let urgent = 0;

  // asks
  for (const ask of attrs.asks?.data ?? []) {
    const a = ask.attributes;
    if (!userHasVoted(a.vots, uid)) {
      votes++;
      if (isUrgent(a.timegrama?.data?.attributes?.date)) urgent++;
    }
  }

  // askms
  for (const askm of attrs.askms?.data ?? []) {
    const a = askm.attributes;
    if (!userHasVoted(a.vots, uid)) {
      votes++;
      if (isUrgent(a.timegrama?.data?.attributes?.date)) urgent++;
    }
  }

  // project-level items
  for (const project of attrs.projects_1s?.data ?? []) {
    const pa = project.attributes;

    // decisions
    for (const dec of pa.decisions?.data ?? []) {
      const da = dec.attributes;
      if (!userHasVoted(da.vots, uid)) {
        votes++;
        if (isUrgent(da.timegrama?.data?.attributes?.date)) urgent++;
      }
    }

    // tosplits (halukas)
    for (const ts of pa.tosplits?.data ?? []) {
      if (!userHasVoted(ts.attributes.vots, uid)) votes++;
    }

    // sheirutpends – votes are relational (Vote entity)
    for (const sp of pa.sheirutpends?.data ?? []) {
      const spAttrs = sp.attributes;
      const spVots = (spAttrs.votes?.data ?? []).map((v: any) => ({
        what: v.attributes.what,
        users_permissions_user: v.attributes.users_permissions_user
      }));
      if (!userHasVoted(spVots, uid)) {
        votes++;
        if (isUrgent(spAttrs.timegrama?.data?.attributes?.date)) urgent++;
      }
    }
  }

  // Active purchases (user as buyer)
  const activePurchases = (attrs.sheiruts?.data ?? []).filter((s: any) => {
    const sa = s.attributes;
    return !(sa.moneyTransfered && sa.productExepted);
  }).length;

  // Active sales (user as seller, through projects_1s)
  let activeSales = 0;
  for (const project of attrs.projects_1s?.data ?? []) {
    activeSales += (project.attributes.sheiruts?.data ?? []).filter((s: any) => {
      const sa = s.attributes;
      return !(sa.moneyTransfered && sa.productExepted);
    }).length;
  }

  // suggestions: active missions count (simplified – full match needs skills, done client-side)
  const suggestions = attrs.mesimabetahaliches?.data?.length ?? 0;

  return {
    kpi: { votes, urgent, suggestions, activePurchases, activeSales },
    topFive: [],
    username: attrs.username ?? '',
    profilePic: attrs.profilePic?.data?.attributes?.url
  };
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

  return { streamed: { summary } };
};
