/**
 * Refresh Wish Matches — docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md
 *
 * Re-grounds a published wish in what the platform offers *now*, for where
 * the wish *is*:
 *
 *   1. Recompute the enrichment (people / free resources / products / library
 *      missions) with the wish's place — providers that cannot reach her are
 *      dropped, the rest ordered nearest first — and save it as the
 *      `ai_meta.enrichment` snapshot /concierge/[id] renders.
 *   2. With `rematch: true`, run `matchRatson` too, so products that answer a
 *      need are saved as proposals on their plan rows.
 *
 * Called by /concierge/[id]: on load when the saved snapshot was taken for a
 * different place (or before places were considered), and from the page's
 * "refresh matches" button (with rematch). Owner-only.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { enrichWish, placeKey } from '../../ai/enrichWish.js';
import type { WishExtraction } from '../../ai/extractWish.js';
import type { WishPlace } from '../../concierge/localMatch.js';
import { matchRatsonConfig } from './matchRatson.js';

/** The place a wish row describes, in the shape enrichWish filters by. */
export function wishPlaceOf(attrs: any): WishPlace {
  return {
    lat: attrs?.lat ?? null,
    lng: attrs?.lng ?? null,
    radius: attrs?.radius ?? null,
    isOnline: !!attrs?.isOnline
  };
}

/** The extraction a saved wish implies — its needs plus the AI's skills. */
export function extractionOf(attrs: any): WishExtraction {
  const aiMeta = attrs?.ai_meta && typeof attrs.ai_meta === 'object' ? attrs.ai_meta : {};
  const skills: string[] = Array.isArray(aiMeta.skills) ? aiMeta.skills : [];
  return {
    missions: (attrs?.extracted_missions ?? []).map((m: any) => ({
      name: String(m?.name ?? ''),
      imp: m?.importance === 'must' ? 'must' : 'nice'
    })),
    resources: (attrs?.extracted_resources ?? []).map((r: any) => ({
      name: String(r?.name ?? ''),
      imp: r?.importance === 'must' ? 'must' : 'nice'
    })),
    skills: skills.filter((s) => typeof s === 'string').map((name) => ({ name })),
    categories: Array.isArray(aiMeta.categories) ? aiMeta.categories : [],
    titleSuggestion: '',
    hints: []
  };
}

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const { ratsonId, rematch = false } = params as { ratsonId: string; rematch?: boolean };
  if (!ratsonId) throw new Error('ratsonId is required');

  const ratRes = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const node = ratRes?.data?.ratson?.data;
  if (!node) throw new Error(`Ratson ${ratsonId} not found`);
  const attrs = node.attributes ?? {};
  const owners = attrs.users_permissions_users?.data ?? [];
  if (!owners.some((o: any) => String(o.id) === String(context.userId))) {
    throw new Error('Only the ratson owner may refresh its matches');
  }

  const extraction = extractionOf(attrs);
  const place = wishPlaceOf(attrs);
  const enrichment = await enrichWish(extraction, context.fetch, { place });

  const aiMeta = attrs.ai_meta && typeof attrs.ai_meta === 'object' ? attrs.ai_meta : {};
  const snapshot = { ...enrichment, place: placeKey(place), computedAt: new Date().toISOString() };
  try {
    await strapi.execute(
      '100updateRatson',
      { id: ratsonId, ai_meta: { ...aiMeta, enrichment: snapshot } },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    // The fresh result is still returned; the next load simply recomputes.
    console.warn('[refreshWishMatches] snapshot persist failed (non-fatal):', err);
  }

  let proposalsCreated = 0;
  if (rematch) {
    const out: any = await (matchRatsonConfig.graphqlOperation as ActionExecutionHandler)(
      { ratsonId: String(ratsonId), mode: 'keyword' },
      context,
      util
    );
    proposalsCreated = Number(out?.proposalsCreated ?? 0);
  }

  return {
    success: true,
    ratsonId: String(ratsonId),
    enrichment: snapshot,
    proposalsCreated
  };
};

export const refreshWishMatchesConfig: ActionConfig = {
  key: 'refreshWishMatches',
  description:
    "Owner re-grounds a wish for its place: recomputes and saves the suggestions snapshot, optionally re-runs automatic matching.",
  graphqlOperation: handler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    rematch: { type: 'boolean', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to refresh matches' }],
  updateStrategy: { type: 'none' }
};
