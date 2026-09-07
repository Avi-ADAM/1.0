import { describe, it, expect } from 'vitest';
import {
    normalizeForHash,
    hashSource,
    cacheKey,
    parseCacheKey,
    isWorthTranslating,
    describe as describeString,
    HASH_LENGTH
} from './normalize.js';

describe('normalizeForHash', () => {
    it('trims and collapses whitespace', () => {
        expect(normalizeForHash('  hello   world  ')).toBe('hello world');
        expect(normalizeForHash('a\n\n\tb')).toBe('a b');
    });

    it('collapses the non-breaking and RTL spaces that get pasted in', () => {
        expect(normalizeForHash(' רקמה של　פיתוח ')).toBe('רקמה של פיתוח');
    });

    it('NFC-normalizes, so two encodings of the same word are one cache row', () => {
        const composed = 'café'; // café
        const decomposed = 'café'; // cafe + combining acute
        expect(composed).not.toBe(decomposed);
        expect(normalizeForHash(composed)).toBe(normalizeForHash(decomposed));
        expect(hashSource(composed)).toBe(hashSource(decomposed));
    });

    it('does NOT lowercase or strip punctuation — those change the translation', () => {
        expect(normalizeForHash('Apple.')).toBe('Apple.');
        expect(hashSource('Apple.')).not.toBe(hashSource('apple'));
    });

    it('survives a non-string without throwing', () => {
        expect(normalizeForHash(undefined as never)).toBe('');
        expect(normalizeForHash(null as never)).toBe('');
    });
});

describe('hashSource', () => {
    it('is 32 hex characters', () => {
        const h = hashSource('פיתוח אתר');
        expect(h).toHaveLength(HASH_LENGTH);
        expect(h).toMatch(/^[0-9a-f]+$/);
    });

    it('is stable — this literal must never change value', () => {
        // Pinned on purpose. If this fails, every cached row on the site just
        // became unreachable and has to be re-bought; that is a decision, not
        // a refactor.
        expect(hashSource('Hello, world')).toBe('4ae7c3b6ac0beff671efa8cf57386151');
    });

    it('different visible text means a different hash', () => {
        expect(hashSource('רקמה')).not.toBe(hashSource('רקמות'));
    });

    it('whitespace-only differences do NOT change the hash — that is the point', () => {
        expect(hashSource(' רקמה  של פיתוח ')).toBe(hashSource('רקמה של פיתוח'));
    });
});

describe('cacheKey / parseCacheKey', () => {
    it('round-trips', () => {
        const key = cacheKey('he', 'es', 'abc123');
        expect(key).toBe('he.es.abc123');
        expect(parseCacheKey(key)).toEqual({ srcLang: 'he', tgtLang: 'es', hash: 'abc123' });
    });

    it('rejects a malformed key rather than guessing', () => {
        expect(parseCacheKey('he.es')).toBeNull();
        expect(parseCacheKey('')).toBeNull();
        expect(parseCacheKey('a.b.c.d')).toBeNull();
    });
});

describe('isWorthTranslating', () => {
    it('accepts prose in every script', () => {
        expect(isWorthTranslating('פיתוח אתר')).toBe(true);
        expect(isWorthTranslating('community clinic')).toBe(true);
        expect(isWorthTranslating('عيادة')).toBe(true);
        expect(isWorthTranslating('клиника')).toBe(true);
    });

    it('rejects what is the same in every language', () => {
        expect(isWorthTranslating('')).toBe(false);
        expect(isWorthTranslating('   ')).toBe(false);
        expect(isWorthTranslating('42')).toBe(false);
        expect(isWorthTranslating('1,200 ₪')).toBe(false);
        expect(isWorthTranslating('2026-09-07')).toBe(false);
        expect(isWorthTranslating('—')).toBe(false);
        expect(isWorthTranslating('https://1lev1.com/project/3')).toBe(false);
        expect(isWorthTranslating('someone@example.com')).toBe(false);
    });

    it('rejects a single character but keeps a two-letter word', () => {
        expect(isWorthTranslating('a')).toBe(false);
        expect(isWorthTranslating('hi')).toBe(true);
    });
});

describe('describe()', () => {
    it('bundles the hash, the key and the mode', () => {
        const d = describeString('רקמה', 'he', 'en', 'transliterate');
        expect(d.hash).toBe(hashSource('רקמה'));
        expect(d.key).toBe(`he.en.${d.hash}`);
        expect(d.mode).toBe('transliterate');
    });
});
