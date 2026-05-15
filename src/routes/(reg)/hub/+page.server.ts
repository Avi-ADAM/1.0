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

  for (const project of attrs.projects_1s?.data ?? []) {
    const pa = project.attributes;

    // pendms – ordered (negopendmissions count matters for orderon)
    for (const pend of pa.pendms?.data ?? []) {
      const a = pend.attributes;
      const negoCount = a.negopendmissions?.data?.length ?? 0;
      const vots = a.users ?? [];
      if (needsOrderedVote(vots, negoCount, uid)) {
        votes++;
        if (isUrgent(a.timegrama?.data?.attributes?.date)) urgent++;
      }
    }

    // finiapruvals – simple (no order)
    for (const fin of pa.finiapruvals?.data ?? []) {
      const a = fin.attributes;
      if (needsSimpleVote(a.vots ?? [], uid)) {
        votes++;
        if (isUrgent(a.timegrama?.data?.attributes?.date)) urgent++;
      }
    }

    // askms – simple (no order)
    for (const askm of pa.askms?.data ?? []) {
      if (needsSimpleVote(askm.attributes.vots ?? [], uid)) votes++;
    }

    // maaps – simple (no order)
    for (const maap of pa.maaps?.data ?? []) {
      if (needsSimpleVote(maap.attributes.vots ?? [], uid)) votes++;
    }

    // decisions – simple (any vote counts)
    for (const dec of pa.decisions?.data ?? []) {
      if (needsSimpleVote(dec.attributes.vots ?? [], uid)) votes++;
    }

    // tosplits – ordered
    for (const ts of pa.tosplits?.data ?? []) {
      if (needsOrderedVote(ts.attributes.vots ?? [], 0, uid)) votes++;
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
        votes++;
        if (isUrgent(a.timegrama?.data?.attributes?.date)) urgent++;
      }
    }
  }

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
