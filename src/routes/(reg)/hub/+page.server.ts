import { sendToSer } from '$lib/send/sendToSer.js';
import { emptyHubSummary, processHubSummary, type HubSummary } from '$lib/digest/hubSummary.js';
import type { DigestPayload } from '$lib/digest/compose.js';
import { composeFromReads, startDigestReads } from '$lib/server/digest/collect.js';
import type { PageServerLoad } from './$types';

// The vote calculation lives in $lib/digest/hubSummary.ts now — the daily
// digest reads the same function (PLAN_DAILY_DIGEST §1.1).
export type { HubFeedItem, HubKpi, HubSummary } from '$lib/digest/hubSummary.js';

/** What the page renders — the summary minus the digest-only fields. */
export type HubPageSummary = Omit<HubSummary, 'feed' | 'projectIds'>;

/**
 * The daily brief as the hub shows it: the same payload the morning digest is
 * composed from, read as the signed-in user. `failed` names the sections
 * whose read failed, so the page can say so instead of showing a zero.
 */
export interface HubBrief {
  payload: DigestPayload;
  failed: string[];
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

function toPageSummary({ feed: _feed, projectIds: _pids, ...rest }: HubSummary): HubPageSummary {
  return rest;
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const uid = locals.uid ?? '';
  const demand: Promise<HubDemandSummary> = loadDemandSummary(fetch, !uid);

  if (!uid) {
    return {
      streamed: {
        summary: Promise.resolve(toPageSummary(emptyHubSummary())),
        demand,
        brief: Promise.resolve(null as HubBrief | null)
      }
    };
  }

  // One 85 read feeds both the summary and the brief.
  const hubRaw = sendToSer({ idL: uid }, '85levHubSummary', 0, 0, false, fetch);
  const summary: Promise<HubPageSummary> = hubRaw.then((raw: any) =>
    toPageSummary(processHubSummary(raw, uid))
  );

  // The brief sits below the fold, so its three reads wait for the summary's
  // instead of racing it: the hub's own numbers never compete with the brief
  // for a connection to Strapi, and the peak fan-out stays where it was.
  const brief: Promise<HubBrief | null> = hubRaw
    .catch(() => null)
    .then(() => composeFromReads(uid, startDigestReads(uid, { fetch, door: 'session' }, hubRaw)))
    .then((c) => ({ payload: c.payload, failed: Object.keys(c.failed) }));

  return { streamed: { summary, demand, brief } };
};
