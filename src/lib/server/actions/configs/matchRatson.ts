/**
 * Match Ratson (Wish) Action — PLAN_CONCIERGE §3.4 / §6
 *
 * MVP keyword matching (M3):
 *   1. Load the Ratson (categories, vallues, sub_category, lat/lng, language).
 *   2. Load candidate active matanots (with their project's vallues).
 *   3. Score each candidate by a weighted blend:
 *        w1·jaccard(ratson.vallues,  project.vallues)
 *      + w2·jaccard(ratson.categories, matanot.categories)
 *      + w3·(ratson.sub_category == matanot.sub_category ? 1 : 0)
 *      + w4·distanceProxScore(ratson lat/lng, matanot lat/lng, ratson.radius)
 *   4. Filter by THRESHOLD and create a `ratson_proposal` per candidate
 *      (kind='existing_matanot', auto_generated=true, status='suggested').
 *   5. Log a `ratson_match_job` and update the Ratson's
 *      `last_matched_at` + best `fulfillment_score`.
 *
 * Out of scope here: vector embeddings (M6.5), AI semantic re-rank (M7+).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const W = {
  vallues: 0.35,
  categories: 0.35,
  subCategory: 0.15,
  proximity: 0.15
} as const;

const THRESHOLD = 0.25;
const TOP_K = 12;

function jaccard(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const A = new Set(a.map((x) => String(x)));
  const B = new Set(b.map((x) => String(x)));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function haversineKm(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function proximityScore(
  ratsonLat: number | null,
  ratsonLng: number | null,
  ratsonRadiusKm: number | null,
  candLat: number | null,
  candLng: number | null
): number {
  const dist = haversineKm(ratsonLat, ratsonLng, candLat, candLng);
  if (dist == null) return 0;
  const radius = ratsonRadiusKm && ratsonRadiusKm > 0 ? ratsonRadiusKm : 50;
  if (dist <= 0) return 1;
  if (dist >= radius * 2) return 0;
  return Math.max(0, 1 - dist / (radius * 2));
}

type CandidateMatanot = {
  id: string;
  name: string;
  sub_category: string | null;
  price: number | null;
  estimatedPrice: number | null;
  lat: number | null;
  lng: number | null;
  categories: string[];
  projectId: string | null;
  projectVallues: string[];
};

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { ratsonId, mode = 'keyword', topK = TOP_K, threshold = THRESHOLD, limit = 200 } =
    params as {
      ratsonId: string;
      mode?: 'keyword' | 'vector' | 'ai_full';
      topK?: number;
      threshold?: number;
      limit?: number;
    };

  if (!ratsonId) throw new Error('ratsonId is required');

  const startedAt = new Date().toISOString();

  // ── 1. Load ratson ───────────────────────────────────────────────────────
  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const ratNode = ratRes?.data?.ratson?.data;
  if (!ratNode) {
    throw new Error('Ratson not found');
  }
  const ratAttrs = ratNode.attributes ?? {};
  const ratsonVallues: string[] = (ratAttrs.vallues?.data ?? []).map((v: any) => String(v.id));
  const ratsonCategories: string[] = (ratAttrs.categories?.data ?? []).map((c: any) =>
    String(c.id)
  );
  const ratsonSubCat: string | null = ratAttrs.sub_category ?? null;
  const ratsonLat: number | null = typeof ratAttrs.lat === 'number' ? ratAttrs.lat : null;
  const ratsonLng: number | null = typeof ratAttrs.lng === 'number' ? ratAttrs.lng : null;
  const ratsonRadius: number | null =
    typeof ratAttrs.radius === 'number' ? ratAttrs.radius : null;

  // Index existing proposals by matanot id so we don't duplicate.
  const existingByMatanot = new Map<string, string>();
  const propsNodes = ratRes?.data?.ratsonProposals?.data ?? [];
  for (const p of propsNodes) {
    const mId = p?.attributes?.matanot?.data?.id;
    if (mId) existingByMatanot.set(String(mId), String(p.id));
  }

  // ── 2. Load candidate matanots ───────────────────────────────────────────
  let candidates: CandidateMatanot[] = [];
  try {
    const candRes = await strapi.execute(
      '110listCandidateMatanots',
      { limit },
      context.jwt,
      context.fetch
    );
    const nodes = candRes?.data?.matanots?.data ?? [];
    candidates = nodes.map((n: any) => {
      const a = n.attributes ?? {};
      const proj = a.projectcreates?.data?.[0];
      return {
        id: String(n.id),
        name: a.name ?? '',
        sub_category: a.sub_category ?? null,
        price: typeof a.price === 'number' ? a.price : null,
        estimatedPrice: typeof a.estimatedPrice === 'number' ? a.estimatedPrice : null,
        lat: typeof a.lat === 'number' ? a.lat : null,
        lng: typeof a.lng === 'number' ? a.lng : null,
        categories: (a.categories?.data ?? []).map((c: any) => String(c.id)),
        projectId: proj?.id ? String(proj.id) : null,
        projectVallues: (proj?.attributes?.vallues?.data ?? []).map((v: any) => String(v.id))
      };
    });
  } catch (err) {
    console.warn('[matchRatson] candidate fetch failed:', err);
  }

  // ── 3. Score ─────────────────────────────────────────────────────────────
  const scored = candidates
    .map((c) => {
      const valScore = jaccard(ratsonVallues, c.projectVallues);
      const catScore = jaccard(ratsonCategories, c.categories);
      const subScore = ratsonSubCat && c.sub_category && ratsonSubCat === c.sub_category ? 1 : 0;
      const proxScore = proximityScore(ratsonLat, ratsonLng, ratsonRadius, c.lat, c.lng);
      const score =
        W.vallues * valScore +
        W.categories * catScore +
        W.subCategory * subScore +
        W.proximity * proxScore;
      return { ...c, score, valScore, catScore, subScore, proxScore };
    })
    .filter((c) => c.score >= threshold && !existingByMatanot.has(c.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // ── 4. Create proposals ──────────────────────────────────────────────────
  const createdProposalIds: string[] = [];
  for (const cand of scored) {
    try {
      const totalPrice = cand.estimatedPrice ?? cand.price ?? 0;
      const proposalVars: Record<string, unknown> = {
        ratson: ratsonId,
        kind: 'existing_matanot',
        status_proposal: 'suggested',
        matanot: cand.id,
        project: cand.projectId,
        total_price: totalPrice,
        match_score: cand.score,
        auto_generated: true,
        publishedAt: startedAt
      };
      const r = await strapi.execute(
        '101createRatsonProposal',
        proposalVars,
        context.jwt,
        context.fetch
      );
      const id = r?.data?.createRatsonProposal?.data?.id;
      if (id) createdProposalIds.push(String(id));
    } catch (err) {
      console.warn('[matchRatson] proposal create failed for matanot', cand.id, err);
    }
  }

  const finishedAt = new Date().toISOString();
  const topScore = scored[0]?.score ?? 0;

  // ── 5. Log the job ───────────────────────────────────────────────────────
  let matchJobId: string | null = null;
  try {
    const jobRes = await strapi.execute(
      '108createRatsonMatchJob',
      {
        ratson: ratsonId,
        mode,
        started_at: startedAt,
        finished_at: finishedAt,
        proposals_created: createdProposalIds.length,
        error: null,
        publishedAt: finishedAt
      },
      context.jwt,
      context.fetch
    );
    matchJobId = jobRes?.data?.createRatsonMatchJob?.data?.id
      ? String(jobRes.data.createRatsonMatchJob.data.id)
      : null;
  } catch (err) {
    console.warn('[matchRatson] match-job log failed:', err);
  }

  // ── 6. Update ratson stats ───────────────────────────────────────────────
  try {
    const newStatus = createdProposalIds.length > 0 ? 'matching' : (ratAttrs.status_ratson || 'open');
    await strapi.execute(
      '100updateRatson',
      {
        id: ratsonId,
        last_matched_at: finishedAt,
        fulfillment_score: topScore,
        status_ratson: newStatus
      },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    console.warn('[matchRatson] ratson stats update failed:', err);
  }

  return {
    success: true,
    ratsonId: String(ratsonId),
    mode,
    candidatesConsidered: candidates.length,
    proposalsCreated: createdProposalIds.length,
    proposalIds: createdProposalIds,
    topScore,
    matchJobId,
    startedAt,
    finishedAt
  };
};

export const matchRatsonConfig: ActionConfig = {
  key: 'matchRatson',
  description:
    'Run keyword matching for a Ratson — scores existing matanots and creates ratson_proposal rows',
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    mode: { type: 'string', required: false },
    topK: { type: 'number', required: false },
    threshold: { type: 'number', required: false },
    limit: { type: 'number', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to run matching' }]
};
