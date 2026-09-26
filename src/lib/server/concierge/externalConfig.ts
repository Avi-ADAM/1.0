/**
 * The dials of the concierge's external offers
 * (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §6) — read from the
 * environment, in one place.
 *
 * Off is the default: `CONCIERGE_EXTERNAL` unset means no search is ever
 * bought and /concierge/[id] renders exactly what it did before.
 *
 * `$env/dynamic/private`, not `$env/static/private` and not `process.env`:
 * `vite dev` does not fill `process.env` from `.env`, and dynamic env lets an
 * operator turn the feature off or tighten a quota without a rebuild.
 */

import { env } from '$env/dynamic/private';

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface ExternalConfig {
  /** Master switch — `CONCIERGE_EXTERNAL=on`. */
  enabled: boolean;
  /** Preferred provider id; the resolver falls back to the next available. */
  provider: string | null;
  /** How long a saved search is shown before it counts as stale. */
  ttlHours: number;
  /** Runs one wisher may start in a day, across all her wishes. */
  dailyPerUser: number;
  /** Runs the whole platform may start in a day — the spend ceiling. */
  dailyGlobal: number;
  /** Needs searched per run (musts first). */
  maxNeeds: number;
  /** Domains never shown (lowercase, no `www.`). */
  blocklist: string[];
  /** Gemini model used for grounded search. */
  geminiModel: string;
  geminiApiKey: string;
}

export function externalConfig(): ExternalConfig {
  const blocklist = (env.CONCIERGE_EXTERNAL_BLOCKLIST ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^www\./, ''))
    .filter(Boolean);
  return {
    enabled: (env.CONCIERGE_EXTERNAL ?? '').trim().toLowerCase() === 'on',
    provider: (env.CONCIERGE_EXTERNAL_PROVIDER ?? '').trim() || null,
    ttlHours: num(env.CONCIERGE_EXTERNAL_TTL_H, 168),
    dailyPerUser: num(env.CONCIERGE_EXTERNAL_DAILY_USER, 10),
    dailyGlobal: num(env.CONCIERGE_EXTERNAL_DAILY_GLOBAL, 300),
    maxNeeds: num(env.CONCIERGE_EXTERNAL_MAX_NEEDS, 4),
    blocklist,
    // Measured 2026-09-26 with this project's key: the `-latest` aliases
    // refuse search grounding (429), and 2.5-flash-lite searches but returns
    // no grounding chunks — so every line fails the golden rule. 2.5-flash
    // returns chunks.
    geminiModel: (env.CONCIERGE_EXTERNAL_GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash',
    geminiApiKey:
      env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API || ''
  };
}
