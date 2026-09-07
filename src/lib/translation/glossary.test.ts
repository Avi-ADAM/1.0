import { describe, it, expect } from 'vitest';
import { GLOSSARY, termsIn, glossaryFor, glossaryViolations, sourceForms } from './glossary.js';

const LOCALES = ['he', 'en', 'ar', 'ru', 'es'] as const;

describe('the glossary table itself', () => {
    it('renders every term in every locale', () => {
        for (const term of GLOSSARY) {
            for (const l of LOCALES) {
                expect(term.render[l], `${term.he} → ${l}`).toBeTruthy();
            }
        }
    });

    it('leaves the platform name untouched in every locale', () => {
        const brand = GLOSSARY.find((t) => t.he === '1lev1');
        expect(brand?.invariant).toBe(true);
        for (const l of LOCALES) expect(brand?.render[l]).toBe('1lev1');
    });

    it('has no duplicate source forms — two rows claiming one word is ambiguous', () => {
        const all = GLOSSARY.flatMap(sourceForms);
        expect(new Set(all).size).toBe(all.length);
    });
});

describe('termsIn', () => {
    it('finds a term through a bound Hebrew preposition', () => {
        // Hebrew binds prepositions to the noun, so `ברקמה` / `לרקמה` /
        // `שהרקמה` are the normal way the word appears in real text.
        expect(termsIn('הצטרפתי לרקמה חדשה').map((t) => t.he)).toContain('רקמה');
        expect(termsIn('הכל נעשה ברקמה').map((t) => t.he)).toContain('רקמה');
    });

    it('finds several terms in one sentence', () => {
        const found = termsIn('החלוקה ברקמה נקבעת במוח').map((t) => t.he);
        expect(found).toEqual(expect.arrayContaining(['חלוקה', 'רקמה', 'מוח']));
    });

    it('finds nothing in text with no domain terms', () => {
        expect(termsIn('בניית אתר תדמית')).toEqual([]);
        expect(termsIn('')).toEqual([]);
        expect(termsIn(undefined as never)).toEqual([]);
    });
});

describe('glossaryFor — the prompt constraint', () => {
    it('gives the canonical rendering for the target locale only', () => {
        expect(glossaryFor('החלוקה ברקמה', 'en')).toEqual(
            expect.arrayContaining([
                { from: 'רקמה', to: 'rikma (partnership)' },
                { from: 'חלוקה', to: 'haluka (profit split)' }
            ])
        );
    });

    it('is empty when the source has no domain terms — no wasted constraint', () => {
        expect(glossaryFor('בניית אתר תדמית', 'es')).toEqual([]);
    });
});

describe('glossaryViolations — the check that actually decides', () => {
    it('passes an output that kept the canonical rendering', () => {
        expect(
            glossaryViolations('הצטרפתי לרקמה חדשה', 'I joined a new rikma (partnership)', 'en')
        ).toEqual([]);
    });

    it('rejects the translation that turns רקמה into "tissue"', () => {
        const bad = glossaryViolations('הצטרפתי לרקמה חדשה', 'I joined a new tissue', 'en');
        expect(bad.map((t) => t.he)).toEqual(['רקמה']);
    });

    it('rejects "brain" for מוח and "heart" for לב', () => {
        expect(glossaryViolations('המוח של הרקמה', 'The brain of the tissue', 'en')).toHaveLength(2);
    });

    it('accepts an output that drops the parenthetical gloss on a later mention', () => {
        // Only the transliterated head is required — a model that writes the
        // gloss once and then just "rikma" is not making the mistake we guard
        // against.
        expect(glossaryViolations('ברקמה', 'in the rikma', 'en')).toEqual([]);
    });

    it('holds the platform name invariant in every locale', () => {
        for (const l of LOCALES) {
            expect(glossaryViolations('הצטרפו ל־1lev1', 'Join us', l)).toHaveLength(1);
            expect(glossaryViolations('הצטרפו ל־1lev1', 'Join 1lev1', l)).toEqual([]);
        }
    });

    it('says nothing about text that had no terms to violate', () => {
        expect(glossaryViolations('בניית אתר תדמית', 'anything at all', 'ru')).toEqual([]);
    });
});
