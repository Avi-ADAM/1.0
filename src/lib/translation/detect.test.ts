import { describe, it, expect } from 'vitest';
import { detectLang, detectScript, isAlreadyIn, SCRIPT_OF } from './detect.js';

describe('detectScript', () => {
    it('names the dominant script and its share', () => {
        expect(detectScript('פיתוח אתר').script).toBe('hebrew');
        expect(detectScript('عيادة مجتمعية').script).toBe('arabic');
        expect(detectScript('общественная клиника').script).toBe('cyrillic');
        expect(detectScript('community clinic').script).toBe('latin');
    });

    it('ignores digits, punctuation and emoji when counting', () => {
        const { script, letters } = detectScript('רקמה 💗 (2026) — 1,200 ₪');
        expect(script).toBe('hebrew');
        expect(letters).toBe(4);
    });

    it('reports no script at all when there are no letters', () => {
        expect(detectScript('2026-09-07').script).toBe('unknown');
        expect(detectScript('   ').letters).toBe(0);
    });

    it('sees the mixed-script garbage a bad bulk edit leaves behind', () => {
        // A Hebrew word with a Cyrillic ghe (U+0433) sitting inside it, where a
        // Hebrew gimel belongs. It renders as garbage and reorders the RTL run.
        // This is the exact failure `npm run check:script` catches in the JSON
        // files and the exact thing an LLM produces; P2's validator rejects a
        // row on this share. Written in escapes on purpose — spelled out, the
        // literal would be flagged by that very checker.
        const corrupted = '\u05de\u05e4\u0433\u05e9'; // מ פ [Cyrillic г] ש
        const { script, share } = detectScript(corrupted);
        expect(script).toBe('hebrew');
        expect(share).toBeLessThan(1);
    });
});

describe('detectLang', () => {
    it('maps the three decisive scripts to their locale', () => {
        expect(detectLang('פיתוח אתר הזמנות למרפאה').lang).toBe('he');
        expect(detectLang('تطوير موقع حجز لعيادة').lang).toBe('ar');
        expect(detectLang('Разработка сайта бронирования').lang).toBe('ru');
    });

    it('separates English from Spanish by stop words', () => {
        expect(detectLang('Development of a booking site for a community clinic').lang).toBe('en');
        expect(
            detectLang('Desarrollo de un sitio de reservas para una clínica comunitaria').lang
        ).toBe('es');
    });

    it('keeps Hebrew prose with a Latin brand name in it on the Hebrew side', () => {
        expect(detectLang('פיתוח אתר הזמנות עבור Acme').lang).toBe('he');
    });

    it('answers unknown rather than guessing', () => {
        // no letters
        expect(detectLang('1,200 ₪').lang).toBe('unknown');
        expect(detectLang('2026-09-07').lang).toBe('unknown');
        // genuinely mixed — no script holds a majority
        expect(detectLang('shalom שלום').lang).toBe('unknown');
        // Latin, but no stop word either way: a two-word product name is not
        // evidence of a language.
        expect(detectLang('Blue Sofa').lang).toBe('unknown');
        // not a string
        expect(detectLang(undefined as never).lang).toBe('unknown');
    });

    it('never returns a locale with zero confidence', () => {
        for (const s of ['1,200 ₪', 'Blue Sofa', 'shalom שלום']) {
            const d = detectLang(s);
            if (d.lang !== 'unknown') expect(d.confidence).toBeGreaterThan(0);
        }
    });
});

describe('isAlreadyIn — the identity-row test', () => {
    it('is true when the reader already reads the source language', () => {
        expect(isAlreadyIn('Development of a booking site for the clinic', 'en')).toBe(true);
        expect(isAlreadyIn('פיתוח אתר הזמנות למרפאה', 'he')).toBe(true);
    });

    it('is false across languages', () => {
        expect(isAlreadyIn('פיתוח אתר הזמנות למרפאה', 'en')).toBe(false);
    });

    it('an unknown detection is never "already right"', () => {
        expect(isAlreadyIn('Blue Sofa', 'en')).toBe(false);
        expect(isAlreadyIn('Blue Sofa', 'es')).toBe(false);
    });
});

describe('SCRIPT_OF', () => {
    it('covers all five locales', () => {
        expect(Object.keys(SCRIPT_OF).sort()).toEqual(['ar', 'en', 'es', 'he', 'ru']);
    });
});
