/**
 * Broad product domains → the platform's `Category` rows
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.6).
 *
 * A wish carries 1-3 domain labels (`ai_meta.categories`) and `matchRatson`
 * scores a product by how its `Category` names meet them. An imported product
 * names its domains in words ("אירועים", "food"); this matches them to the
 * rows that already exist — in any of their languages — so a rikma import
 * does not mint "אירוע" next to "אירועים". What is left over is for the caller
 * to create, deliberately.
 *
 * Pure; the Strapi half is in $lib/server/assistant/categories.ts.
 */

export interface CategoryEntry {
  /** The default-locale id — the only one a relation may point at. */
  id: string;
  /** Its name in every locale. */
  names: string[];
}

/** Same word, however it was typed: case, spacing, a definite article. */
export function normalizeCategoryName(raw: string): string {
  let s = String(raw ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '') // Hebrew points
    .replace(/[ً-ٟ]/g, '') // Arabic harakat
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  // A definite article in front of a longer word ("האירועים", "الطعام").
  s = s
    .split(' ')
    .map((w) => (w.length > 3 && w.startsWith('ה') ? w.slice(1) : w.length > 4 && w.startsWith('ال') ? w.slice(2) : w))
    .join(' ');
  return s;
}

/**
 * @returns the ids of the rows the names already are (deduplicated, in the
 *          order asked), and the names that match nothing — first spelling
 *          kept, duplicates folded.
 */
export function matchCategories(
  names: readonly string[],
  catalog: readonly CategoryEntry[]
): { ids: string[]; missing: string[] } {
  const byName = new Map<string, string>();
  for (const c of catalog) {
    for (const n of c.names) {
      const k = normalizeCategoryName(n);
      if (k && !byName.has(k)) byName.set(k, c.id);
    }
  }
  const ids: string[] = [];
  const missing: string[] = [];
  const seenMissing = new Set<string>();
  for (const raw of names) {
    const k = normalizeCategoryName(raw);
    if (!k) continue;
    const id = byName.get(k);
    if (id) {
      if (!ids.includes(id)) ids.push(id);
    } else if (!seenMissing.has(k)) {
      seenMissing.add(k);
      missing.push(String(raw).trim().slice(0, 40));
    }
  }
  return { ids, missing };
}
