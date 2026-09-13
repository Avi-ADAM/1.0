import { describe, it, expect } from 'vitest';
import { validateTranslation, validateBatchShape } from './validate.js';

/** Assembled, not typed — see the note in `mixedScript.test.ts`. */
const CYRILLIC_GE = 'г';

const ok = (r: ReturnType<typeof validateTranslation>) => r.ok;

describe('the good case', () => {
    it('accepts an ordinary translation', () => {
        expect(
            validateTranslation({
                source: 'פיתוח אתר הזמנות למרפאה קהילתית',
                output: 'Development of a booking site for a community clinic',
                target: 'en',
                srcLang: 'he'
            })
        ).toEqual({ ok: true, reasons: [] });
    });

    it('accepts a transliterated name in the reader’s script', () => {
        expect(
            ok(
                validateTranslation({
                    source: 'ברוך',
                    output: 'Baruch (ברוך)',
                    target: 'en',
                    srcLang: 'he',
                    mode: 'transliterate'
                })
            )
        ).toBe(true);
    });

    it('accepts a legitimately longer rendering of a very short source', () => {
        // `לב` → `lev (heart / feed)` is 9× the source and entirely correct.
        expect(
            ok(
                validateTranslation({
                    source: 'לב',
                    output: 'lev (heart / feed)',
                    target: 'en',
                    srcLang: 'he'
                })
            )
        ).toBe(true);
    });
});

describe('mixed script — the characteristic LLM failure here', () => {
    it('rejects a Cyrillic letter inside a Hebrew word', () => {
        const r = validateTranslation({
            source: 'a meeting next week',
            output: `מפ${CYRILLIC_GE}ש בשבוע הבא`,
            target: 'he',
            srcLang: 'en'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('mixed-script');
        expect(r.detail).toContain('Cyrillic');
    });
});

describe('the glossary decides, the prompt only suggests', () => {
    it('rejects an output that dropped a domain term', () => {
        const r = validateTranslation({
            source: 'הרקמה מחפשת שותפים',
            output: 'The tissue is looking for partners',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('glossary');
        expect(r.detail).toContain('רקמה');
    });

    it('accepts the canonical rendering', () => {
        expect(
            ok(
                validateTranslation({
                    source: 'הרקמה מחפשת שותפים',
                    output: 'The rikma (partnership) is looking for partners',
                    target: 'en',
                    srcLang: 'he'
                })
            )
        ).toBe(true);
    });

    it('accepts the transliterated head without the gloss on a later mention', () => {
        expect(
            ok(
                validateTranslation({
                    source: 'הרקמה מחפשת שותפים',
                    output: 'The rikma is looking for partners',
                    target: 'en',
                    srcLang: 'he'
                })
            )
        ).toBe(true);
    });
});

describe('length', () => {
    it('rejects a 5× hallucination', () => {
        const source = 'פיתוח אתר הזמנות למרפאה קהילתית בירושלים';
        const r = validateTranslation({
            source,
            output:
                'Development of a booking site for a community clinic in Jerusalem. ' +
                'I should note that this translation may not capture every nuance of the ' +
                'original Hebrew, which uses several idiomatic constructions. If you would ' +
                'like, I can offer an alternative rendering that stays closer to the source, ' +
                'or a freer one that reads more naturally in English. Let me know which you prefer.',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('too-long');
    });

    it('rejects a truncation', () => {
        const r = validateTranslation({
            source: 'פיתוח אתר הזמנות למרפאה קהילתית בירושלים, כולל תמיכה ותחזוקה',
            output: 'Development',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('too-short');
    });

    it('does not apply the shrink rule to a short source', () => {
        expect(ok(validateTranslation({ source: 'משאב', output: 'resource', target: 'en', srcLang: 'he' }))).toBe(true);
    });
});

describe('markup and echoes', () => {
    it('rejects tags the source did not have', () => {
        const r = validateTranslation({
            source: 'פיתוח אתר',
            output: '<p>Website development</p>',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('markup');
    });

    it('rejects a fenced code block the model wrapped its answer in', () => {
        const r = validateTranslation({
            source: 'פיתוח אתר',
            output: '```Website development```',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.reasons).toContain('markup');
    });

    it('rejects an output that is just the source echoed back', () => {
        const r = validateTranslation({
            source: 'פיתוח אתר לקהילה',
            output: 'פיתוח אתר לקהילה',
            target: 'en',
            srcLang: 'he'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('unchanged');
    });

    it('rejects an empty output', () => {
        const r = validateTranslation({ source: 'פיתוח אתר', output: '   ', target: 'en', srcLang: 'he' });
        expect(r.ok).toBe(false);
        expect(r.reasons).toEqual(['empty']);
    });
});

describe('script of the target', () => {
    it('rejects Russian written in Latin letters', () => {
        const r = validateTranslation({
            source: 'Development of a booking site for a community clinic',
            output: 'Razrabotka sayta bronirovaniya dlya obshchestvennoy kliniki',
            target: 'ru',
            srcLang: 'en'
        });
        expect(r.ok).toBe(false);
        expect(r.reasons).toContain('wrong-script');
    });

    it('accepts real Cyrillic for ru', () => {
        expect(
            ok(
                validateTranslation({
                    source: 'Development of a booking site for a community clinic',
                    output: 'Разработка сайта бронирования для общественной клиники',
                    target: 'ru',
                    srcLang: 'en'
                })
            )
        ).toBe(true);
    });

    it('leaves a transliteration alone — carrying both scripts is the point', () => {
        expect(
            ok(
                validateTranslation({
                    source: 'ברוך',
                    output: 'Baruch',
                    target: 'ru',
                    srcLang: 'he',
                    mode: 'transliterate'
                })
            )
        ).toBe(true);
    });
});

describe('validateBatchShape — a bad batch fails whole', () => {
    it('accepts a well-formed response', () => {
        const r = validateBatchShape(
            { items: [{ id: 'a1', detected: 'he', out: { en: 'x', ru: 'у' } }] },
            ['a1', 'b2']
        );
        expect(r.ok).toBe(true);
        expect(r.items[0].detected).toBe('he');
        expect(r.items[0].out).toEqual({ en: 'x', ru: 'у' });
    });

    it('rejects a response with no items array', () => {
        expect(validateBatchShape({}, ['a1']).ok).toBe(false);
        expect(validateBatchShape('nope', ['a1']).ok).toBe(false);
        expect(validateBatchShape(null, ['a1']).ok).toBe(false);
    });

    it('rejects an id nobody asked about — the ids may have drifted', () => {
        const r = validateBatchShape({ items: [{ id: 'ghost', out: { en: 'x' } }] }, ['a1']);
        expect(r.ok).toBe(false);
        expect(r.error).toContain('ghost');
    });

    it('rejects a duplicated id', () => {
        const r = validateBatchShape(
            { items: [{ id: 'a1', out: { en: 'x' } }, { id: 'a1', out: { en: 'y' } }] },
            ['a1']
        );
        expect(r.ok).toBe(false);
        expect(r.error).toContain('duplicate');
    });

    it('rejects a non-string translation, and takes the whole batch with it', () => {
        const r = validateBatchShape(
            { items: [{ id: 'a1', out: { en: 'fine' } }, { id: 'b2', out: { en: 42 } }] },
            ['a1', 'b2']
        );
        expect(r.ok).toBe(false);
        expect(r.items).toEqual([]);
    });

    it('ignores a locale nobody asked for rather than failing on it', () => {
        const r = validateBatchShape({ items: [{ id: 'a1', out: { en: 'x', fr: 'y' } }] }, ['a1']);
        expect(r.ok).toBe(true);
        expect(r.items[0].out).toEqual({ en: 'x' });
    });

    it('accepts a partial batch — fewer items than asked is a miss, not a fault', () => {
        const r = validateBatchShape({ items: [{ id: 'a1', out: { en: 'x' } }] }, ['a1', 'b2']);
        expect(r.ok).toBe(true);
        expect(r.items).toHaveLength(1);
    });
});
