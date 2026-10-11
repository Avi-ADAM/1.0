/**
 * "It changed while you were editing" — a three-way merge per field
 * (docs/inprogress/PLAN_REALTIME_MIGRATION.md, the edit-page notice).
 *
 * An open form starts from a version of the object (`base`). When the object
 * changes underneath it — the realtime bus re-read the page's data because
 * another member, or a matured decision, changed it — the form holds `mine`
 * and the page now holds `theirs`. Per field:
 *
 * | base → theirs | mine          | result                                   |
 * |---------------|---------------|------------------------------------------|
 * | unchanged     | anything      | nothing to do                            |
 * | changed       | = base        | take theirs quietly (`apply`)            |
 * | changed       | = theirs      | both arrived at the same value — nothing |
 * | changed       | anything else | a conflict: the person chooses           |
 *
 * Decided from the data, not from events: almost every action in a rikma
 * publishes `project:<pid>`, so listening for "something changed" would warn
 * about every sale and mission. Comparing the fields the form shows warns only
 * when one of them actually moved. Pure; the form decides what to do with it.
 */

export type Eq = (a: unknown, b: unknown) => boolean;

export interface MergeField {
  key: string;
  /** How two values of this field compare; `sameValue` by default. */
  eq?: Eq;
}

export interface Conflict {
  key: string;
  mine: unknown;
  theirs: unknown;
}

export interface MergeResult {
  /** Fields the person had not touched, to take from `theirs` as they are. */
  apply: Record<string, unknown>;
  /** Fields both sides changed, differently. */
  conflicts: Conflict[];
}

const blank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '');

/** Strings compare trimmed; null, undefined and '' are all "empty". */
export const sameValue: Eq = (a, b) => {
  if (blank(a) && blank(b)) return true;
  if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return a === b;
};

/** Lists compare as sets (order is not a change). */
export const sameSet: Eq = (a, b) => {
  const norm = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map(String))].sort() : []);
  const x = norm(a);
  const y = norm(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

/**
 * The words of a rich-text value, whether it is HTML (what the editor gives
 * back) or Strapi blocks (what the server stores) — the two never compare as
 * strings, so a description the person did not touch would look edited.
 */
export function plainText(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(plainText).join(' ').replace(/\s+/g, ' ').trim();
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text;
    return plainText(o.children ?? []);
  }
  const s = String(v);
  if (/^\s*\[/.test(s)) {
    try {
      return plainText(JSON.parse(s));
    } catch {
      /* not JSON — treat as HTML/text */
    }
  }
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export const sameText: Eq = (a, b) => plainText(a) === plainText(b);

export function mergeRemote(
  base: Record<string, unknown>,
  mine: Record<string, unknown>,
  theirs: Record<string, unknown>,
  fields: readonly MergeField[]
): MergeResult {
  const out: MergeResult = { apply: {}, conflicts: [] };
  for (const { key, eq = sameValue } of fields) {
    if (eq(base[key], theirs[key])) continue;
    if (eq(mine[key], base[key])) out.apply[key] = theirs[key];
    else if (!eq(mine[key], theirs[key])) out.conflicts.push({ key, mine: mine[key], theirs: theirs[key] });
  }
  return out;
}
