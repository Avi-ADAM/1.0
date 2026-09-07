/**
 * Property-based tests for the content-addressing invariants.
 *
 * The example tests pin down the cases we reasoned about. These pin down the
 * two properties the *whole cache design* rests on, for every input:
 *
 *  - **idempotence** — `normalize(normalize(x)) === normalize(x)`. If it ever
 *    fails, the same sentence gets two rows, and every translation on the site
 *    is bought twice.
 *  - **injectivity on visible text** — two strings that differ by more than
 *    whitespace get different hashes. If it ever fails, one member's project
 *    description is rendered under another's translation.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeForHash, hashSource, cacheKey, parseCacheKey } from './normalize.js';

/**
 * Text like the site actually stores: four scripts, punctuation, whitespace.
 * The ranges are escapes rather than literal characters so `npm run check:script`
 * does not read the adjacent Hebrew/Arabic/Cyrillic bounds as one corrupted word.
 */
const siteText = fc.stringMatching(
    /^[\u0590-\u05ea\u0620-\u064a\u0410-\u044f A-Za-z0-9 .,!?'"()\-\n\t]{0,80}$/
);

describe('normalizeForHash — properties', () => {
    it('is idempotent for any string at all', () => {
        fc.assert(
            fc.property(fc.string(), (s) => {
                const once = normalizeForHash(s);
                expect(normalizeForHash(once)).toBe(once);
            })
        );
    });

    it('never leaves leading, trailing or doubled whitespace', () => {
        fc.assert(
            fc.property(fc.string(), (s) => {
                const n = normalizeForHash(s);
                expect(n).toBe(n.trim());
                expect(n).not.toMatch(/\s\s/);
            })
        );
    });

    it('hashing is a function of the normalized form only', () => {
        fc.assert(
            fc.property(siteText, (s) => {
                expect(hashSource(s)).toBe(hashSource(normalizeForHash(s)));
                // …and padding a string with whitespace cannot move it to a
                // different cache row.
                expect(hashSource(`  ${s}\n `)).toBe(hashSource(s));
            })
        );
    });

    it('different visible text implies a different hash', () => {
        fc.assert(
            fc.property(siteText, siteText, (a, b) => {
                fc.pre(normalizeForHash(a) !== normalizeForHash(b));
                expect(hashSource(a)).not.toBe(hashSource(b));
            })
        );
    });

    it('the hash is always 32 lowercase hex characters', () => {
        fc.assert(
            fc.property(fc.string(), (s) => {
                expect(hashSource(s)).toMatch(/^[0-9a-f]{32}$/);
            })
        );
    });
});

describe('cacheKey — properties', () => {
    const locale = fc.constantFrom('he', 'en', 'ar', 'ru', 'es' as const);

    it('round-trips through parseCacheKey for every pair', () => {
        fc.assert(
            fc.property(locale, locale, fc.string(), (src, tgt, text) => {
                const hash = hashSource(text);
                const parsed = parseCacheKey(cacheKey(src as never, tgt as never, hash));
                expect(parsed).toEqual({ srcLang: src, tgtLang: tgt, hash });
            })
        );
    });

    it('a key identifies exactly one (source, target, text) triple', () => {
        fc.assert(
            fc.property(locale, locale, siteText, siteText, (src, tgt, a, b) => {
                fc.pre(normalizeForHash(a) !== normalizeForHash(b));
                expect(cacheKey(src as never, tgt as never, hashSource(a))).not.toBe(
                    cacheKey(src as never, tgt as never, hashSource(b))
                );
            })
        );
    });
});
