/**
 * A rikma's short address — `/r/<slug>` today, `<slug>.1lev1.com` in S2
 * (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4).
 *
 * Pure, so the editor, the action and the apply step all hold the same rule.
 * ASCII only, on purpose: a look-alike letter from another alphabet (Cyrillic
 * `а` for Latin `a`) is the oldest phishing trick for a host name, and `xn--`
 * is how such a name is smuggled through DNS.
 */

import { MAX_SLUG_LENGTH, MIN_SLUG_LENGTH, RESERVED_SLUGS, REVIEW_WORDS } from './reserved.js';

export { MAX_SLUG_LENGTH, MIN_SLUG_LENGTH };

/**
 * @typedef {'empty' | 'tooShort' | 'tooLong' | 'chars' | 'edgeHyphen' | 'doubleHyphen'
 *   | 'digitsOnly' | 'reserved' | 'review'} SlugProblem
 */

/**
 * What a member typed, made into the shape a slug has — lowercase, spaces and
 * underscores as hyphens, runs of hyphens collapsed. It does not make an
 * invalid slug valid (Hebrew stays Hebrew, and `validateSlug` says so).
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeSlugInput(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, '-')
    .replace(/-{2,}/g, '-');
}

/**
 * @param {string} slug
 * @returns {boolean}
 */
function needsReview(slug) {
  const tokens = slug.split('-');
  return REVIEW_WORDS.some((w) => tokens.includes(w) || (w.length >= 5 && slug.includes(w)));
}

/**
 * @param {unknown} raw - already normalized or not; it is normalized here again
 * @returns {{ ok: true, slug: string } | { ok: false, slug: string, problem: SlugProblem }}
 */
export function validateSlug(raw) {
  const slug = normalizeSlugInput(raw);
  /** @param {SlugProblem} problem */
  const no = (problem) => ({ ok: /** @type {const} */ (false), slug, problem });

  if (!slug) return no('empty');
  if (slug.length < MIN_SLUG_LENGTH) return no('tooShort');
  if (slug.length > MAX_SLUG_LENGTH) return no('tooLong');
  if (!/^[a-z0-9-]+$/.test(slug)) return no('chars');
  if (slug.startsWith('-') || slug.endsWith('-')) return no('edgeHyphen');
  // Also what keeps `xn--…` (punycode) out.
  if (slug.includes('--')) return no('doubleHyphen');
  // `/r/482` would read as an id, and an id-shaped address is the one a
  // reader cannot tell apart from the old `/project/482`.
  if (/^\d+$/.test(slug)) return no('digitsOnly');
  if (RESERVED_SLUGS.has(slug)) return no('reserved');
  if (needsReview(slug)) return no('review');
  return { ok: true, slug };
}

/**
 * The parameter of `/r/[slug]` as it arrived — case kept, so the route can
 * redirect `/r/Bees` to `/r/bees` instead of answering it twice.
 *
 * @param {unknown} raw
 * @returns {string | null} the canonical slug, or null when it cannot be one
 */
export function slugFromPath(raw) {
  const s = String(raw ?? '').toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(s) && !s.includes('--') ? s : null;
}

// ── Former addresses ────────────────────────────────────────────────────────
// `Project.formerSlugs` is one text field: every address the rikma ever had,
// space-delimited with a space at each end (" bees old-bees "), so an old link
// is found with a plain `contains: " old-bees "` filter — no extra collection,
// no permission grant. A slug can never contain a space, so the delimiter is
// unambiguous.

/**
 * @param {unknown} stored
 * @returns {string[]}
 */
export function formerSlugList(stored) {
  return String(stored ?? '')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => slugFromPath(s) === s);
}

/** @param {string} slug */
export const formerSlugToken = (slug) => ` ${slug} `;

/**
 * The stored value after a rikma moves from `previous` to `next`: the old
 * address joins the list (so its links keep redirecting) and the new one leaves
 * it (a rikma may take back an address it once had).
 *
 * @param {unknown} stored
 * @param {string | null | undefined} previous
 * @param {string} next
 * @returns {string | null}
 */
export function nextFormerSlugs(stored, previous, next) {
  const set = new Set(formerSlugList(stored));
  if (previous && previous !== next) set.add(previous);
  set.delete(next);
  return set.size ? ` ${[...set].join(' ')} ` : null;
}

// ── A first suggestion from the rikma's name ───────────────────────────────

/** @type {Record<string, string>} */
const HEBREW = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch', ט: 't', י: 'y',
  כ: 'k', ך: 'ch', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p',
  ף: 'f', צ: 'tz', ץ: 'tz', ק: 'k', ר: 'r', ש: 'sh', ת: 't'
};

/** @type {Record<string, string>} */
const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya'
};

/** @type {Record<string, string>} */
const ARABIC = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z',
  ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'a',
  و: 'w', ي: 'y', ى: 'a', ء: ''
};

/**
 * A starting point, not an answer: unvowelled Hebrew and Arabic cannot be
 * transliterated reliably, so the editor shows this as a suggestion the member
 * edits. Returns '' when nothing usable comes out.
 *
 * @param {unknown} name
 * @returns {string}
 */
export function suggestSlug(name) {
  const latin = String(name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .split('')
    .map((ch) => HEBREW[ch] ?? CYRILLIC[ch] ?? ARABIC[ch] ?? ch)
    .join('');
  const slug = normalizeSlugInput(latin.replace(/[^a-z0-9\s-]+/g, ' '))
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '');
  return validateSlug(slug).ok ? slug : '';
}
