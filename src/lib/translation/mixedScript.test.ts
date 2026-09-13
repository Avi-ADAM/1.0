import { describe, it, expect } from 'vitest';
import { corruptedWords, hasMixedScript, scriptOf, blankEscapes } from './mixedScript.js';

/**
 * Every corrupted sample here is assembled from escapes rather than typed.
 *
 * `npm run check:script` walks `src/`, this file included, so a literal
 * `מפ<cyrillic ge>ש` in it would make the checker report its own test suite.
 * Building the sample from `г` keeps the two honest: the escape is blanked
 * before the checker looks at the line, and the string still holds the real
 * character at runtime, which is the only thing the assertions care about.
 */
const CYRILLIC_GE = 'г'; // г — the classic stand-in for a Hebrew ג
const ARABIC_YEH = 'ي'; // ي — an Arabic tail on a Hebrew word
const CYRILLIC_O = 'о'; // о — homoglyph of the Latin o
const LATIN_P = 'p'; // p — standing where a Hebrew pe belongs

describe('scriptOf', () => {
    it('names the writing system of a letter', () => {
        expect(scriptOf('א')).toBe('Hebrew');
        expect(scriptOf('ا')).toBe('Arabic');
        expect(scriptOf(CYRILLIC_GE)).toBe('Cyrillic');
        expect(scriptOf('a')).toBe('Latin');
        expect(scriptOf('α')).toBe('Greek');
    });

    it('has no opinion about digits, punctuation or spaces', () => {
        for (const ch of ['1', '-', ' ', '·', '₪']) expect(scriptOf(ch)).toBeNull();
    });

    it('does not count the pointed Hebrew ligatures at U+FB1D..FB1F', () => {
        // They only ever appear inside this repo's RTL character-class ranges.
        // Counting them as Hebrew turns a regex source line into a "corrupt word".
        expect(scriptOf('יִ')).toBeNull();
        expect(scriptOf('ﬠ')).toBe('Hebrew');
    });
});

describe('corruptedWords — script clash', () => {
    it('flags a Cyrillic letter inside a Hebrew word', () => {
        const found = corruptedWords(`מפ${CYRILLIC_GE}ש`);
        expect(found).toHaveLength(1);
        expect(found[0].kind).toBe('script clash');
        expect(found[0].scripts).toContain('Cyrillic');
    });

    it('flags an Arabic letter ending a Hebrew word', () => {
        const found = corruptedWords(`ליוו${ARABIC_YEH}`);
        expect(found).toHaveLength(1);
        expect(found[0].kind).toBe('script clash');
    });

    it('finds every corrupted word in a longer text, not just the first', () => {
        const found = corruptedWords(`מפ${CYRILLIC_GE}ש בשעה ליוו${ARABIC_YEH} מחר`);
        expect(found.map((c) => c.kind)).toEqual(['script clash', 'script clash']);
    });
});

describe('corruptedWords — stray letter', () => {
    it('flags a lone Latin letter opening a Hebrew word', () => {
        // A Latin `p` standing where a Hebrew `pe` belongs. Assembled, not
        // typed, for the same reason as the samples above.
        const found = corruptedWords(`${LATIN_P}תוח`);
        expect(found).toHaveLength(1);
        expect(found[0].kind).toBe('stray letter');
    });

    it('flags a Cyrillic homoglyph inside a Latin word', () => {
        const found = corruptedWords(`prod${CYRILLIC_O}uct`);
        expect(found).toHaveLength(1);
        expect(found[0].kind).toBe('stray letter');
    });
});

describe('corruptedWords — what is deliberately allowed', () => {
    it('passes clean text in every script the site speaks', () => {
        for (const s of [
            'פיתוח אתר לקהילה',
            'Development of a booking site',
            'تطوير موقع للحجز',
            'Разработка сайта для сообщества',
            'Desarrollo de un sitio de reservas'
        ]) {
            expect(corruptedWords(s)).toEqual([]);
        }
    });

    it('passes a Hebrew particle bound to a foreign word', () => {
        // `לStrapi`, `בapi`, `הURL` — ordinary bilingual writing here, not damage.
        expect(corruptedWords('לStrapi')).toEqual([]);
        expect(corruptedWords('הURL')).toEqual([]);
    });

    it('passes a whole foreign word embedded in running text', () => {
        expect(corruptedWords('פיתוח אתר ל-Acme בשנה הבאה')).toEqual([]);
    });

    it('passes text with no letters at all', () => {
        expect(corruptedWords('1,200 ₪ · 2026-09-09')).toEqual([]);
    });

    it('is quiet on empty and non-string input', () => {
        expect(corruptedWords('')).toEqual([]);
        expect(corruptedWords(undefined as unknown as string)).toEqual([]);
        expect(corruptedWords(null as unknown as string)).toEqual([]);
    });
});

describe('blankEscapes', () => {
    it('blanks an escape without moving anything after it', () => {
        const line = String.raw`"a\nשעות"`;
        const blanked = blankEscapes(line);
        expect(blanked).toHaveLength(line.length);
        expect(blanked).not.toContain('n');
    });

    it('is what stops a source line reading as Latin + Hebrew', () => {
        // Only source code needs this. A member's sentence has no escapes in it,
        // which is why the runtime validator leaves the option off.
        const line = String.raw`\nשעות`;
        expect(corruptedWords(line, { escapes: true })).toEqual([]);
    });
});

describe('hasMixedScript', () => {
    it('is the boolean the runtime validator asks for', () => {
        expect(hasMixedScript(`מפ${CYRILLIC_GE}ש`)).toBe(true);
        expect(hasMixedScript('פיתוח אתר')).toBe(false);
    });
});
