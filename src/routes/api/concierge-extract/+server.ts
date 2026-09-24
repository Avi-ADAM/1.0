/**
 * POST /api/concierge-extract — live wish analysis for the Concierge composer.
 *
 * PLAN_CONCIERGE §6/§7: turn a free-form wish into a structured spec AND ground
 * it in the platform. Two stages:
 *   1. extract  — a Mastra agent pulls out missions, resources, skills,
 *                 categories, a title suggestion and gentle hints.
 *   2. enrich   — (opt-in) look up existing missions in the library and real
 *                 members who hold the needed skills, so we can suggest people.
 *
 * The response stays backward-compatible with the old shape
 * ({ missions, resources, hints }) and adds { skills, categories,
 * titleSuggestion, matches: { missions, people } }.
 *
 * With { place: { lat, lng, radius, isOnline } } the enrichment keeps only
 * providers that reach the wish, nearest first (PLAN_CONCIERGE_LOCAL_PROVIDERS).
 *
 * Enrichment is skipped automatically for short/empty extractions and can be
 * turned off per-request with { enrich: false } (e.g. while the user is still
 * typing) to keep the keystroke-debounced path cheap.
 */

import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  extractWish,
  EMPTY_EXTRACTION,
  EMPTY_DETAILS,
  type WishExtraction
} from '$lib/server/ai/extractWish';
import { enrichWish, EMPTY_ENRICHMENT, type WishEnrichment } from '$lib/server/ai/enrichWish';
import type { WishPlace } from '$lib/server/concierge/localMatch';
import { geocodePlace, type GeoPoint } from '$lib/server/geo/geocode';

/** Below this length, grounding the wish in the DB is noise — skip enrichment. */
const ENRICH_MIN_TEXT = 40;
const LANGS = new Set(['he', 'en', 'ar', 'ru', 'es']);

function hasPoint(p: WishPlace | null): boolean {
  return (
    typeof p?.lat === 'number' &&
    Number.isFinite(p.lat) &&
    typeof p?.lng === 'number' &&
    Number.isFinite(p.lng)
  );
}

function buildResponse(
  extraction: WishExtraction,
  enrichment: WishEnrichment,
  geo: GeoPoint | null = null
) {
  return {
    // What the writer stated — dates, budget, place (+ its point), online,
    // group kind. The composer fills only the squares she has not set.
    details: { ...(extraction.details ?? EMPTY_DETAILS), geo },
    // Back-compat fields (consumed by the existing Lev rail).
    missions: extraction.missions,
    resources: extraction.resources,
    hints: extraction.hints,
    // New structured fields.
    skills: extraction.skills,
    categories: extraction.categories,
    titleSuggestion: extraction.titleSuggestion,
    matches: enrichment
  };
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  const body = await request.json().catch(() => ({}));
  const text: string = body?.text ?? '';
  const wantEnrich: boolean = body?.enrich !== false;
  const lang: string = LANGS.has(body?.lang) ? body.lang : 'he';
  const rawPlace = body?.place;
  let place: WishPlace | null =
    rawPlace && typeof rawPlace === 'object'
      ? {
          lat: rawPlace.lat ?? null,
          lng: rawPlace.lng ?? null,
          radius: rawPlace.radius ?? null,
          isOnline: rawPlace.isOnline === true
        }
      : null;

  console.log(`[concierge-extract] ▶ text length: ${text.length}, enrich: ${wantEnrich}`);

  if (!text || text.trim().length < 20) {
    return json(buildResponse(EMPTY_EXTRACTION, EMPTY_ENRICHMENT));
  }

  // ── 1. Extract ────────────────────────────────────────────────────────────
  let extraction: WishExtraction;
  const t0 = Date.now();
  try {
    extraction = await extractWish(text, GEMINI_API_KEY);
    console.log(
      `[concierge-extract] ✓ extracted in ${Date.now() - t0}ms - ` +
        `missions:${extraction.missions.length} resources:${extraction.resources.length} ` +
        `skills:${extraction.skills.length}`
    );
  } catch (err) {
    console.error('[concierge-extract] ✗ extraction failed:', err);
    return json(buildResponse(EMPTY_EXTRACTION, EMPTY_ENRICHMENT));
  }

  // ── 1b. Place — the text named one; find its point (best-effort) ─────────
  const details = extraction.details ?? EMPTY_DETAILS;
  let geo: GeoPoint | null = null;
  if (details.place && details.online !== true) {
    geo = await geocodePlace(details.place, lang);
  }
  // The writer has not picked a place yet: ground the matches in the one she
  // wrote, the same way the composer is about to fill it in for her.
  if (!hasPoint(place) && !place?.isOnline) {
    if (geo) {
      place = { lat: geo.lat, lng: geo.lng, radius: place?.radius ?? 15, isOnline: false };
    } else if (details.online === true) {
      place = { lat: null, lng: null, radius: null, isOnline: true };
    }
  }

  // ── 2. Enrich (best-effort, never breaks the response) ─────────────────────
  let enrichment: WishEnrichment = EMPTY_ENRICHMENT;
  const hasSignal = extraction.skills.length > 0 || extraction.missions.length > 0;
  if (wantEnrich && hasSignal && text.trim().length >= ENRICH_MIN_TEXT) {
    const t1 = Date.now();
    try {
      enrichment = await enrichWish(extraction, fetch, { place });
      console.log(
        `[concierge-extract] ✓ enriched in ${Date.now() - t1}ms - ` +
          `missions:${enrichment.missions.length} people:${enrichment.people.length}`
      );
    } catch (err) {
      console.warn('[concierge-extract] enrichment failed (non-fatal):', err);
    }
  }

  return json(buildResponse(extraction, enrichment, geo));
};
