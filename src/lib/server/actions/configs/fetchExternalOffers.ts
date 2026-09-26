/**
 * Fetch External Offers — docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §4.3
 *
 * Completes a wish from the web, but only where the platform has nothing:
 *
 *   1. Detect the gaps — plan rows no proposal, member, product or free
 *      resource answers (`coverage.ts`). Covered rows are never searched.
 *   2. Search the web for each (musts first, capped), through the configured
 *      provider. Only the need, a settlement-level place and the language
 *      leave the platform.
 *   3. Normalise to pointer-only cards, drop duplicates of internal providers,
 *      and save the run as `ratson.ai_meta.external` — /concierge/[id] shows
 *      it from there without searching again until it is `force`d or stale.
 *
 * Owner-only. Off unless `CONCIERGE_EXTERNAL=on`. Every "no" is a status, not
 * an error, so the page can say why in the wisher's language:
 *   disabled · no_gaps · no_provider · cached · too_soon · quota · error · ok
 *
 * `dismissExternalOffer` removes one card ("not relevant / broken link") from
 * the saved run; a dismissed card never returns on a later run of this wish.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { selectGaps, detectGaps } from '../../concierge/coverage.js';
import {
  ageHours,
  readCache,
  searchExternalOffers,
  visibleOffers,
  type ExternalCache
} from '../../concierge/externalOffers.js';
import {
  internalNamesOf,
  needsOf,
  proposalsFromRaw
} from '../../concierge/externalView.js';
import { resolveExternalProvider } from '../../concierge/searchProviders/index.js';
import { geminiGroundingProvider } from '../../concierge/searchProviders/gemini.js';
import { externalConfig } from '../../concierge/externalConfig.js';
import { RateLimiter } from '../../translation/rateLimit.js';
import { wishPlaceOf } from './refreshWishMatches.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A forced re-run ("search again") may not come sooner than this. */
export const FORCE_COOLDOWN_MIN = 10;

// In-process, like the other limiters: one API container today. The per-wish
// debounce lives in ai_meta and holds across restarts; these bound spend.
const perUser = new RateLimiter();
const platform = new RateLimiter({ maxKeys: 10 });

async function loadOwnedWish(strapi: any, ratsonId: string, context: any) {
  const res = await strapi.execute(
    '105queryRatsonWithProposals',
    { id: ratsonId },
    context.jwt,
    context.fetch
  );
  const node = res?.data?.ratson?.data;
  if (!node) throw new Error(`Ratson ${ratsonId} not found`);
  const attrs = node.attributes ?? {};
  const owners = attrs.users_permissions_users?.data ?? [];
  if (!owners.some((o: any) => String(o.id) === String(context.userId))) {
    throw new Error('Only the wish owner may search the web for it');
  }
  const aiMeta = attrs.ai_meta && typeof attrs.ai_meta === 'object' ? attrs.ai_meta : {};
  return { res, attrs, aiMeta };
}

function rowsOf(attrs: any) {
  return needsOf(attrs.extracted_missions, attrs.extracted_resources).map((n) => ({
    key: `${n.kind === 'mission' ? 'm' : 'r'}:${n.idx}`,
    name: n.name
  }));
}

const fetchHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { ratsonId, force = false } = params as { ratsonId: string; force?: boolean };
  if (!ratsonId) throw new Error('ratsonId is required');

  const cfg = externalConfig();
  if (!cfg.enabled) return { success: true, status: 'disabled', offers: [] };

  const { res, attrs, aiMeta } = await loadOwnedWish(strapi, ratsonId, context);
  const now = new Date();
  const prev = readCache(aiMeta.external);
  const rows = rowsOf(attrs);
  const shown = () => visibleOffers(prev, rows, cfg.ttlHours, now);

  // ── Debounce (persistent, per wish) ──────────────────────────────────────
  if (prev) {
    const age = ageHours(prev, now);
    if (!force && age <= cfg.ttlHours) {
      return { success: true, status: 'cached', offers: shown(), fetchedAt: prev.fetchedAt };
    }
    if (force && age * 60 < FORCE_COOLDOWN_MIN) {
      return { success: true, status: 'too_soon', offers: shown(), fetchedAt: prev.fetchedAt };
    }
  }

  // ── Gaps ─────────────────────────────────────────────────────────────────
  const place = wishPlaceOf(attrs);
  const enrichment = aiMeta.enrichment && typeof aiMeta.enrichment === 'object' ? aiMeta.enrichment : {};
  const proposalNodes = res?.data?.ratsonProposals?.data ?? [];
  const coverages = detectGaps(
    needsOf(attrs.extracted_missions, attrs.extracted_resources),
    enrichment,
    proposalsFromRaw(proposalNodes),
    place
  );
  const gaps = selectGaps(coverages, cfg.maxNeeds);
  if (gaps.length === 0) return { success: true, status: 'no_gaps', offers: [] };

  const provider = resolveExternalProvider(
    [geminiGroundingProvider({ apiKey: cfg.geminiApiKey, model: cfg.geminiModel })],
    cfg.provider
  );
  if (!provider) return { success: true, status: 'no_provider', offers: [] };

  // ── Quotas (per wisher, then the platform's daily ceiling) ───────────────
  if (!perUser.take(`u:${context.userId}`, cfg.dailyPerUser, DAY).ok) {
    return { success: true, status: 'quota', offers: shown(), fetchedAt: prev?.fetchedAt ?? null };
  }
  if (!platform.take('all', cfg.dailyGlobal, DAY).ok) {
    return { success: true, status: 'quota', offers: shown(), fetchedAt: prev?.fetchedAt ?? null };
  }

  // ── Search ───────────────────────────────────────────────────────────────
  const proposalNames = proposalNodes
    .map((p: any) => p?.attributes?.project?.data?.attributes?.projectName)
    .filter((n: unknown): n is string => typeof n === 'string');
  const run = await searchExternalOffers({
    gaps,
    geo: { locationHint: attrs.location_hint ?? null, isOnline: !!attrs.isOnline },
    language: attrs.language ?? null,
    provider,
    internalNames: internalNamesOf(enrichment, proposalNames),
    blocklist: cfg.blocklist,
    now
  });

  // Every search failed: keep what was saved rather than overwrite it with nothing.
  if (run.queries.length > 0 && run.failed.length === run.queries.length) {
    return { success: true, status: 'error', offers: shown(), fetchedAt: prev?.fetchedAt ?? null };
  }

  const dismissed = prev?.dismissed ?? [];
  const cache: ExternalCache = {
    version: 1,
    fetchedAt: now.toISOString(),
    provider: provider.id,
    queries: run.queries.map((q) => ({ key: q.key, need: q.need, locationLabel: q.locationLabel })),
    gaps: gaps.map((g) => ({ key: g.key, coverage: g.coverage as 'weak' | 'uncovered' })),
    offers: run.offers.filter((o) => !dismissed.includes(o.id)),
    dismissed
  };

  try {
    await strapi.execute(
      '100updateRatson',
      { id: ratsonId, ai_meta: { ...aiMeta, external: cache } },
      context.jwt,
      context.fetch
    );
  } catch (err) {
    // The fresh result is still returned; the next load simply has no cache.
    console.warn('[fetchExternalOffers] cache persist failed (non-fatal):', err);
  }

  // No ratson-match-job row yet: its `mode` enum has no 'external' value
  // (plan §4.4 — a Strapi change). The run is recorded in ai_meta instead.
  return {
    success: true,
    status: 'ok',
    offers: visibleOffers(cache, rows, cfg.ttlHours, now),
    fetchedAt: cache.fetchedAt,
    searched: run.queries.length,
    failed: run.failed.length
  };
};

const dismissHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { ratsonId, offerId } = params as { ratsonId: string; offerId: string };
  if (!ratsonId || !offerId) throw new Error('ratsonId and offerId are required');
  const { aiMeta } = await loadOwnedWish(strapi, ratsonId, context);
  const cache = readCache(aiMeta.external);
  if (!cache) return { success: true, dismissed: false };
  if (!cache.dismissed.includes(String(offerId))) cache.dismissed.push(String(offerId));
  await strapi.execute(
    '100updateRatson',
    { id: ratsonId, ai_meta: { ...aiMeta, external: cache } },
    context.jwt,
    context.fetch
  );
  return { success: true, dismissed: true, offerId: String(offerId) };
};

export const fetchExternalOffersConfig: ActionConfig = {
  key: 'fetchExternalOffers',
  description:
    'Owner completes a wish from the web: searches outside offers for plan rows nothing on the platform answers, and saves them on the wish.',
  graphqlOperation: fetchHandler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    force: { type: 'boolean', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to search the web for a wish' }],
  updateStrategy: { type: 'none' }
};

export const dismissExternalOfferConfig: ActionConfig = {
  key: 'dismissExternalOffer',
  description: "Owner hides one outside offer on her wish (not relevant / broken link).",
  graphqlOperation: dismissHandler,
  paramSchema: {
    ratsonId: { type: 'string', required: true },
    offerId: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};

/** Test seam: the limiters are process-wide. */
export function __resetExternalLimiters() {
  (perUser as any).windows?.clear?.();
  (platform as any).windows?.clear?.();
}
