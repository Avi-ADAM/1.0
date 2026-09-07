/**
 * Normalization and cache keys for the UGC translation cache (§2.3).
 *
 * The cache is **content-addressed**: a row is found by what the source string
 * *says*, not by which entity it came from. That is what buys reuse across
 * entities and invalidation-by-not-existing (an edited source hashes
 * differently, misses, and the stale row is simply never looked up again).
 *
 * The whole property rests on `normalizeForHash` being **idempotent** and
 * **minimal**. Two different normalizations mean two cache rows for the same
 * sentence, i.e. paying twice; an aggressive one (lowercasing, stripping
 * punctuation) merges strings whose translations legitimately differ. So:
 *
 *     trim → NFC → collapse runs of whitespace to a single space
 *
 * and nothing else. Do not add steps here without reading §2.3 first.
 */

import { sha256Hex } from './sha256.js';
import type { Locale, TranslationMode } from './types.js';

/** Characters that count as whitespace, including the ones RTL text drags in. */
const WS = /[\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/g;

/**
 * The one normalization applied before hashing. Idempotent by construction:
 * after one pass there is no leading/trailing whitespace and no run of two
 * whitespace characters, so a second pass changes nothing.
 */
export function normalizeForHash(s: string): string {
    if (typeof s !== 'string') return '';
    return s.normalize('NFC').replace(WS, ' ').trim();
}

/** Length of the stored hash prefix. 32 hex = 128 bits — collision-free at this scale. */
export const HASH_LENGTH = 32;

/** `sha256(normalizeForHash(s))`, truncated to `HASH_LENGTH` hex chars. */
export function hashSource(s: string): string {
    return sha256Hex(normalizeForHash(s)).slice(0, HASH_LENGTH);
}

/**
 * The cache row's `key`: `${srcLang}.${tgtLang}.${hash}`.
 *
 * `mode` is deliberately **not** in the key. A given source string is either
 * prose or a name — the manifest decides which, once, per field — so the same
 * string never needs two rows for the same language pair. Should that ever
 * stop being true, the mode has to enter the key, not the row.
 */
export function cacheKey(srcLang: Locale, tgtLang: Locale, hash: string): string {
    return `${srcLang}.${tgtLang}.${hash}`;
}

/** The inverse of `cacheKey`, for reading a row back. Returns null if malformed. */
export function parseCacheKey(
    key: string
): { srcLang: string; tgtLang: string; hash: string } | null {
    const parts = typeof key === 'string' ? key.split('.') : [];
    if (parts.length !== 3) return null;
    const [srcLang, tgtLang, hash] = parts;
    if (!srcLang || !tgtLang || !hash) return null;
    return { srcLang, tgtLang, hash };
}

/**
 * Is this string worth spending a cache lookup — let alone a translation — on?
 *
 * Rejects the things that are the same in every language and would otherwise
 * fill the cache with rows nobody reads: empty/whitespace, a bare number, a
 * URL, an email, and anything with no letter in it at all (`—`, `1,200 ₪`,
 * `2026-09-07`). This is a cheap pre-filter, not the authorization: what is
 * translatable at all is decided by the manifest in `fields.js`.
 */
export function isWorthTranslating(s: string): boolean {
    const n = normalizeForHash(s);
    if (n.length < 2) return false;
    if (/^https?:\/\//i.test(n)) return false;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return false;
    // At least one letter in any script. `\p{L}` covers Hebrew, Arabic,
    // Cyrillic and Latin alike — do not narrow it to /[a-z]/i.
    return /\p{L}/u.test(n);
}

/** Convenience: the full identity of one string in the cache, for one pair. */
export function describe(
    source: string,
    srcLang: Locale,
    tgtLang: Locale,
    mode: TranslationMode = 'translate'
): { hash: string; key: string; mode: TranslationMode } {
    const hash = hashSource(source);
    return { hash, key: cacheKey(srcLang, tgtLang, hash), mode };
}
