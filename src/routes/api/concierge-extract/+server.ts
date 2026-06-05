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
 * Enrichment is skipped automatically for short/empty extractions and can be
 * turned off per-request with { enrich: false } (e.g. while the user is still
 * typing) to keep the keystroke-debounced path cheap.
 */

import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractWish, EMPTY_EXTRACTION, type WishExtraction } from '$lib/server/ai/extractWish';
import { enrichWish, EMPTY_ENRICHMENT, type WishEnrichment } from '$lib/server/ai/enrichWish';

/** Below this length, grounding the wish in the DB is noise — skip enrichment. */
const ENRICH_MIN_TEXT = 40;

function buildResponse(extraction: WishExtraction, enrichment: WishEnrichment) {
  return {
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
      `[concierge-extract] ✓ extracted in ${Date.now() - t0}ms — ` +
        `missions:${extraction.missions.length} resources:${extraction.resources.length} ` +
        `skills:${extraction.skills.length}`
    );
  } catch (err) {
    console.error('[concierge-extract] ✗ extraction failed:', err);
    return json(buildResponse(EMPTY_EXTRACTION, EMPTY_ENRICHMENT));
  }

  // ── 2. Enrich (best-effort, never breaks the response) ─────────────────────
  let enrichment: WishEnrichment = EMPTY_ENRICHMENT;
  const hasSignal = extraction.skills.length > 0 || extraction.missions.length > 0;
  if (wantEnrich && hasSignal && text.trim().length >= ENRICH_MIN_TEXT) {
    const t1 = Date.now();
    try {
      enrichment = await enrichWish(extraction, fetch);
      console.log(
        `[concierge-extract] ✓ enriched in ${Date.now() - t1}ms — ` +
          `missions:${enrichment.missions.length} people:${enrichment.people.length}`
      );
    } catch (err) {
      console.warn('[concierge-extract] enrichment failed (non-fatal):', err);
    }
  }

  return json(buildResponse(extraction, enrichment));
};
