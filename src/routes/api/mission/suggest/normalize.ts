/**
 * Pure shaping helpers for POST /api/mission/suggest.
 *
 * They live outside `+server.ts` because both of them decide what the member
 * actually receives, and both have already been wrong in a way nothing caught:
 * the category shape silently emptied every suggestion, and an unclamped money
 * estimate goes straight into the form's money row and the rikma's equity
 * preview. Tested in `normalize.test.ts`.
 */

import type { MatchResult, matchAllCategories } from '$lib/embed/matcher.js';

export type MatchAll = Awaited<ReturnType<typeof matchAllCategories>>;

/** The client's per-category view: one bucket per match status. */
export interface SuggestCategory {
  matched: MatchResult[];
  suggestions: MatchResult[];
  newItems: MatchResult[];
}

/** Category as the vector store names it — `methods` is the work-ways namespace. */
export type CategoryKey = 'skills' | 'roles' | 'methods' | 'vallues';

/**
 * One category, per match status.
 *
 * `matchAllCategories` groups by STATUS first and category second
 * (`{ matched: { skills: [...] }, … }`), so indexing it by category —
 * `matchResults['skills']` — is always `undefined`. That is what this used to
 * do, and every category came back empty whenever the vector store answered.
 * The client reads its chips out of exactly this object, so the AI's skills,
 * roles and work-ways were listed in the panel and then applied as nothing.
 *
 * `raw` is the floor: with no match results at all (vector store down) nothing
 * was matched, so every extracted term is new and the member still gets the
 * suggestion.
 */
export function buildCategory(
  namespace: CategoryKey,
  matchResults: MatchAll | null,
  raw: string[]
): SuggestCategory {
  if (!matchResults) {
    return {
      matched: [],
      suggestions: [],
      newItems: raw.map((input) => ({ input, status: 'new' as const }))
    };
  }
  return {
    matched: matchResults.matched[namespace] ?? [],
    suggestions: matchResults.suggestions[namespace] ?? [],
    newItems: matchResults.newItems[namespace] ?? []
  };
}

export interface NumberRange {
  min: number;
  max: number;
}

/**
 * The money estimate is a starting point for a human, not a quote: clamp it to
 * a band a member can sanity-check instead of letting a hallucinated 9,000,000
 * land in the form (and from there in the rikma's equity preview).
 */
export const HOURS_RANGE: NumberRange = { min: 0.5, max: 2000 };
export const VALPH_RANGE: NumberRange = { min: 10, max: 1000 };

/**
 * A finite positive number inside `range`, or null — never NaN, never a string.
 * Models write money as `"₪120"` or `"120 ש\"ח"` often enough to be worth
 * stripping rather than discarding.
 */
export function clampNumber(raw: unknown, range: NumberRange): number | null {
  const n =
    typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.max(n, range.min), range.max);
}
