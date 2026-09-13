import { describe, expect, it } from 'vitest';
import { isRealTranslation } from './hits.js';
import type { TranslationHit } from './types.js';

const hit = (over: Partial<TranslationHit> = {}): TranslationHit => ({
    text: 'Improving the lyrics of a promotional song',
    srcLang: 'he',
    mode: 'translate',
    engine: 'gemini',
    quality: 'machine',
    ...over
});

describe('isRealTranslation', () => {
    it('is true for a machine translation', () => {
        expect(isRealTranslation(hit())).toBe(true);
    });

    it('is true for a reviewed translation', () => {
        expect(isRealTranslation(hit({ quality: 'reviewed', engine: 'human' }))).toBe(true);
    });

    // The whole reason this module exists. An identity row's `text` IS the
    // source (§2.2), so every `!!hit.text` test in the display layer used to
    // call it a translation — and told a Hebrew reader that Hebrew had been
    // "translated from Hebrew".
    it('is false for an identity row, however non-empty its text', () => {
        const identity = hit({
            engine: 'identity',
            srcLang: 'he',
            text: 'שיפור מילים של שיר קידום'
        });
        expect(identity.text).not.toBe('');
        expect(isRealTranslation(identity)).toBe(false);
    });

    it('is false for a miss', () => {
        expect(isRealTranslation(undefined)).toBe(false);
        expect(isRealTranslation(null)).toBe(false);
    });

    it('is false for a row that came back with no text', () => {
        expect(isRealTranslation(hit({ text: '' }))).toBe(false);
    });

    it('does not care about mode — a transliterated name is still a translation', () => {
        expect(isRealTranslation(hit({ mode: 'transliterate', text: 'Baruch' }))).toBe(true);
    });

    // `.find(isRealTranslation)` is how the mission cards pick which of three
    // fields owns the card's single provenance line; a predicate that reads
    // the array index would break there.
    it('works as a bare Array.prototype.find predicate', () => {
        const identity = hit({ engine: 'identity' });
        const real = hit({ text: 'the real one' });
        expect([undefined, identity, real].find(isRealTranslation)).toBe(real);
        expect([undefined, identity].find(isRealTranslation)).toBeUndefined();
    });
});
