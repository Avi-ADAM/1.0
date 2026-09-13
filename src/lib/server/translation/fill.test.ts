import { describe, it, expect, vi } from 'vitest';
import { fillTranslations } from './fill.js';
import { hashSource } from '$lib/translation/normalize.js';
import type { TranslateEngine } from './gemini.js';
import type { Locale } from '$lib/translation/types.js';

const TARGETS: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];

/** An engine that answers from a table, and records what it was asked. */
function fakeEngine(
    table: Record<string, { detected: string; out: Partial<Record<Locale, string>> }>
): TranslateEngine & { calls: number; lastItems: unknown[] } {
    const fn = vi.fn(async (items: any[]) => {
        fn.calls++;
        fn.lastItems = items;
        return items
            .filter((i) => table[i.text])
            .map((i) => ({ id: i.id, detected: table[i.text].detected, out: table[i.text].out }));
    }) as any;
    fn.calls = 0;
    fn.lastItems = [];
    return fn;
}

const HE = 'פיתוח אתר הזמנות';
const HE_TABLE = {
    [HE]: {
        detected: 'he',
        out: {
            en: 'Booking site development',
            ar: 'تطوير موقع الحجز',
            ru: 'Разработка сайта бронирования',
            es: 'Desarrollo del sitio de reservas'
        }
    }
};

describe('one request, every locale', () => {
    it('produces a row per target, including the identity row', async () => {
        const engine = fakeEngine(HE_TABLE);
        const out = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: TARGETS,
            model: 'gemini-2.5-flash-lite'
        });

        expect(engine.calls).toBe(1);
        expect(out.rows).toHaveLength(5);
        expect(out.unfilled).toEqual([]);

        const identity = out.rows.find((r) => r.tgtLang === 'he');
        expect(identity).toMatchObject({ engine: 'identity', text: HE, srcLang: 'he', model: null });

        const en = out.rows.find((r) => r.tgtLang === 'en');
        expect(en).toMatchObject({ engine: 'gemini', model: 'gemini-2.5-flash-lite' });
    });

    it('writes the identity row so the same string is never re-asked forever', async () => {
        // An English description read by an English reader is the commonest
        // string on the site; without this row it is a permanent miss.
        const source = 'A booking site for a community clinic';
        const engine = fakeEngine({ [source]: { detected: 'en', out: { he: 'אתר' } } });

        const out = await fillTranslations([{ source, mode: 'translate' }], {
            engine,
            targets: ['en', 'he']
        });

        expect(out.rows.find((r) => r.tgtLang === 'en')).toMatchObject({
            engine: 'identity',
            srcLang: 'en',
            text: source
        });
    });

    it('deduplicates by hash before spending anything', async () => {
        const engine = fakeEngine(HE_TABLE);
        await fillTranslations(
            [
                { source: HE, mode: 'translate' },
                { source: HE, mode: 'translate' },
                { source: `  ${HE}  `, mode: 'translate' }
            ],
            { engine, targets: ['en'] }
        );
        // Three cards, one string, one item in the request.
        expect(engine.lastItems).toHaveLength(1);
    });
});

describe('what comes back to the waiting reader', () => {
    it('returns hits for their locale only', async () => {
        const engine = fakeEngine(HE_TABLE);
        const out = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: TARGETS,
            forLocale: 'ru'
        });

        expect(Object.keys(out.hits)).toEqual([hashSource(HE)]);
        expect(out.hits[hashSource(HE)]).toMatchObject({
            text: 'Разработка сайта бронирования',
            srcLang: 'he',
            engine: 'gemini',
            quality: 'machine'
        });
    });

    it('returns nothing when no reader is waiting', async () => {
        const engine = fakeEngine(HE_TABLE);
        const out = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: TARGETS
        });
        expect(out.hits).toEqual({});
    });
});

describe('what it refuses to invent', () => {
    it('produces no rows when the source language cannot be established', async () => {
        // A confident "translated from Hebrew" label on text that was not
        // Hebrew is worse than no translation at all.
        const source = 'Acme 2026';
        const engine = fakeEngine({ [source]: { detected: 'martian', out: { he: 'אקמה' } } });

        const out = await fillTranslations([{ source, mode: 'translate' }], {
            engine,
            targets: ['he', 'en']
        });
        expect(out.rows).toEqual([]);
        expect(out.unfilled).toEqual([hashSource(source)]);
    });

    it('falls back to the local guess when the engine omitted `detected`', async () => {
        const engine = vi.fn(async (items: any[]) =>
            items.map((i) => ({ id: i.id, out: { en: 'Booking site development' } }))
        ) as unknown as TranslateEngine;

        const out = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: ['en']
        });
        expect(out.rows[0]).toMatchObject({ srcLang: 'he', tgtLang: 'en' });
    });

    it('skips a locale the engine left out, and keeps the ones it answered', async () => {
        const engine = fakeEngine({
            [HE]: { detected: 'he', out: { en: 'Booking site development', ru: '   ' } }
        });
        const out = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: ['en', 'ru']
        });
        expect(out.rows.map((r) => r.tgtLang)).toEqual(['en']);
        expect(out.unfilled).toEqual([]);
    });

    it('reports a string the engine ignored entirely as unfilled', async () => {
        const engine = fakeEngine(HE_TABLE);
        const other = 'משהו אחר לגמרי כאן';
        const out = await fillTranslations(
            [
                { source: HE, mode: 'translate' },
                { source: other, mode: 'translate' }
            ],
            { engine, targets: ['en'] }
        );
        expect(out.unfilled).toEqual([hashSource(other)]);
        expect(out.rows).toHaveLength(1);
    });

    it('spends nothing on an empty input', async () => {
        const engine = fakeEngine({});
        const out = await fillTranslations([], { engine });
        expect(out).toEqual({ rows: [], hits: {}, unfilled: [] });
        expect(engine.calls).toBe(0);
    });
});

describe('the demand signal', () => {
    it('marks on-demand rows with hits=1 and backfill rows with 0', async () => {
        const engine = fakeEngine(HE_TABLE);

        const onDemand = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: ['en'],
            hits: 1
        });
        expect(onDemand.rows[0].hits).toBe(1);

        const backfill = await fillTranslations([{ source: HE, mode: 'translate' }], {
            engine,
            targets: ['en']
        });
        expect(backfill.rows[0].hits).toBe(0);
    });

    it('carries firstSeenOn through as telemetry', async () => {
        const engine = fakeEngine(HE_TABLE);
        const out = await fillTranslations(
            [{ source: HE, mode: 'translate', firstSeenOn: 'openMission.descrip' }],
            { engine, targets: ['en'] }
        );
        expect(out.rows[0].firstSeenOn).toBe('openMission.descrip');
    });
});
