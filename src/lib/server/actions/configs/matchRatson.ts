/**
 * Match Ratson (Wish) Action — PLAN_CONCIERGE §3.4 / §6,
 * docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md
 *
 * Runs after a wish is published (and on demand from /concierge/[id]):
 *   1. Load the Ratson — its extracted needs, AI category labels, values and
 *      location.
 *   2. Load candidate active matanots (with location + their rikma's values).
 *   3. Keep a candidate only when its name shares words with one of the needs
 *      (so the proposal has a plan row to live on) and, for a located wish,
 *      only when the product's service area reaches her.
 *   4. Score: w·text + w·categories + w·values + w·proximity, and create a
 *      `ratson_proposal` above THRESHOLD (kind='existing_matanot',
 *      auto_generated=true, status='suggested') carrying `covered_*` for its
 *      need — the row then offers "✓ אני בוחרת" (acceptRatsonProposal →
 *      Sheirutpend to the provider).
 *   5. Log a `ratson_match_job` and update `last_matched_at` +
 *      `fulfillment_score`.
 *
 * Why categories are compared by label: the composer stores the AI's category
 * labels in `ai_meta.categories`, never as Category relations, and matanot has
 * no `sub_category` — the old id-only formula could never reach its threshold.
 *
 * Out of scope here: vector embeddings (M6.5), AI semantic re-rank (M7+).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import {
  bestNeedFor,
  labelOverlap,
  productPlace,
  reachFor,
  wishHasPlace,
  type WishNeed,
  type WishPlace
} from '../../concierge/localMatch.js';

export const W = {
  text: 0.45,
  categories: 0.2,
  vallues: 0.15,
  proximity: 0.2
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

/**
 * 1 at the wish's door, 0.5 at the edge of the product's reach; a product with
 * no point (online, or never located) is possible but unproven — 0.3. A wish
 * with no place scores everyone 0, so proximity never decides alone.
 */
export function proximityScore(place: ReturnType<typeof productPlace>, wish: WishPlace): number {
  if (!wishHasPlace(wish)) return 0;
  const r = reachFor(place, wish);
  if (!r.ok) return 0;
  if (r.distanceKm === null) return 0.3;
  const reach = (Number(place?.radius) || 50) + (Number(wish.radius) || 0);
  return Math.max(0.5, 1 - (r.distanceKm / reach) * 0.5);
}

export interface ScoredCandidate {
  need: WishNeed;
  score: number;
  textScore: number;
  catScore: number;
  valScore: number;
  proxScore: number;
}

/** Pure scoring of one candidate product against a wish. null = not a match. */
export function scoreCandidate(
  cand: {
    name: string;
    place: ReturnType<typeof productPlace>;
    categoryIds: string[];
    categoryNames: string[];
    projectVallues: string[];
  },
  wish: {
    needs: WishNeed[];
    place: WishPlace;
    categoryIds: string[];
    categoryLabels: string[];
    vallues: string[];
  }
): ScoredCandidate | null {
  const best = bestNeedFor(wish.needs, cand.name);
  if (!best) return null;
  if (!reachFor(cand.place, wish.place).ok) return null;
  const textScore = best.score;
  const catScore = Math.max(
    jaccard(wish.categoryIds, cand.categoryIds),
    labelOverlap(wish.categoryLabels, cand.categoryNames)
  );
  const valScore = jaccard(wish.vallues, cand.projectVallues);
  const proxScore = proximityScore(cand.place, wish.place);
  const score =
    W.text * textScore + W.categories * catScore + W.vallues * valScore + W.proximity * proxScore;
  return { need: best.need, score, textScore, catScore, valScore, proxScore };
}

type CandidateMatanot = {
  id: string;
  name: string;
  price: number | null;
  estimatedPrice: number | null;
  pricingMode: string | null;
  place: ReturnType<typeof productPlace>;
  categoryIds: string[];
  categoryNames: string[];
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

  // Only the wisher runs matching on her own wish — it writes proposals onto it.
  const owners = ratAttrs.users_permissions_users?.data ?? [];
  if (!owners.some((o: any) => String(o.id) === String(context.userId))) {
    throw new Error('Only the ratson owner may run matching on it');
  }

  const aiMeta = ratAttrs.ai_meta && typeof ratAttrs.ai_meta === 'object' ? ratAttrs.ai_meta : {};
  const wishFacts = {
    needs: [
      ...(ratAttrs.extracted_missions ?? []).map((m: any, idx: number) => ({
        name: String(m?.name ?? ''),
        isResource: false,
        idx
      })),
      ...(ratAttrs.extracted_resources ?? []).map((r: any, idx: number) => ({
        name: String(r?.name ?? ''),
        isResource: true,
        idx
      }))
    ].filter((n: WishNeed) => n.name.trim().length > 0),
    place: {
      lat: ratAttrs.lat ?? null,
      lng: ratAttrs.lng ?? null,
      radius: ratAttrs.radius ?? null,
      isOnline: !!ratAttrs.isOnline
    } as WishPlace,
    categoryIds: (ratAttrs.categories?.data ?? []).map((c: any) => String(c.id)),
    categoryLabels: [
      ...(Array.isArray(aiMeta.categories) ? aiMeta.categories : []),
      ...(ratAttrs.categories?.data ?? []).map((c: any) => c?.attributes?.name)
    ].filter((l: unknown): l is string => typeof l === 'string' && l.trim().length > 0),
    vallues: (ratAttrs.vallues?.data ?? []).map((v: any) => String(v.id))
  };

  // Index existing proposals by matanot id so we don't duplicate — including
  // ones she dismissed: a declined product is not offered again.
  const existingByMatanot = new Map<string, string>();
  const propsNodes = ratRes?.data?.ratsonProposals?.data ?? [];
  for (const p of propsNodes) {
    const mId = p?.attributes?.matanot?.data?.id;
    if (mId) existingByMatanot.set(String(mId), String(p.id));
  }

  // ── 2. Load candidate matanots ───────────────────────────────────────────
  let candidates: CandidateMatanot[] = [];
  if (wishFacts.needs.length > 0) {
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
          price: typeof a.price === 'number' ? a.price : null,
          estimatedPrice: typeof a.estimatedPrice === 'number' ? a.estimatedPrice : null,
          pricingMode: a.pricingMode ?? null,
          place: productPlace(a),
          categoryIds: (a.categories?.data ?? []).map((c: any) => String(c.id)),
          categoryNames: (a.categories?.data ?? [])
            .map((c: any) => c?.attributes?.name)
            .filter((x: unknown): x is string => typeof x === 'string'),
          projectId: proj?.id ? String(proj.id) : null,
          projectVallues: (proj?.attributes?.vallues?.data ?? []).map((v: any) => String(v.id))
        };
      });
    } catch (err) {
      console.warn('[matchRatson] candidate fetch failed:', err);
    }
  }

  // ── 3. Score ─────────────────────────────────────────────────────────────
  const scored = candidates
    .filter((c) => c.projectId && !existingByMatanot.has(c.id))
    .map((c) => {
      const s = scoreCandidate(c, wishFacts);
      return s ? { ...c, ...s } : null;
    })
    .filter((c): c is CandidateMatanot & ScoredCandidate => !!c && c.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // ── 4. Create proposals ──────────────────────────────────────────────────
  const createdProposalIds: string[] = [];
  for (const cand of scored) {
    try {
      // Priced by quote: no number to propose — the shop names it on the request.
      const totalPrice =
        cand.pricingMode === 'quote' ? null : (cand.estimatedPrice ?? cand.price ?? 0);
      const proposalVars: Record<string, unknown> = {
        ratson: ratsonId,
        kind: 'existing_matanot',
        status_proposal: 'suggested',
        matanot: cand.id,
        project: cand.projectId,
        total_price: totalPrice,
        match_score: cand.score,
        auto_generated: true,
        // The plan row this product answers — /concierge/[id] renders the
        // proposal there, with the accept/dismiss buttons.
        covered_missions: cand.need.isResource
          ? []
          : [{ extracted_mission_idx: String(cand.need.idx), hours: null, price: totalPrice }],
        covered_resources: cand.need.isResource
          ? [{ extracted_resource_idx: String(cand.need.idx), quantity: null, price: totalPrice }]
          : [],
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
    'Run keyword matching for a Ratson - scores existing matanots and creates ratson_proposal rows',
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
