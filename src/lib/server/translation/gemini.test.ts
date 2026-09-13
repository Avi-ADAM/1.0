import { describe, it, expect, vi } from 'vitest';
import { geminiEngine, buildPrompt, chunk, TranslateEngineError } from './gemini.js';
import type { TranslateItem } from './gemini.js';
import type { Locale } from '$lib/translation/types.js';

const TARGETS: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];

const ITEMS: TranslateItem[] = [
    { id: 'a1', mode: 'translate', text: 'פיתוח אתר הזמנות למרפאה קהילתית' },
    { id: 'b2', mode: 'transliterate', text: 'ברוך' }
];

/** A fake Gemini. Never touches the network; asserts on what it was handed. */
function fakeTransport(
    body: unknown,
    { status = 200, capture }: { status?: number; capture?: (req: any) => void } = {}
) {
    return vi.fn(async (_url: any, init: any) => {
        capture?.(JSON.parse(init.body));
        return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
            text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
        } as unknown as Response;
    }) as unknown as typeof globalThis.fetch;
}

/** Gemini wraps the model's JSON in a candidates/parts envelope. */
function envelope(obj: unknown) {
    return { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] };
}

describe('translateBatch', () => {
    it('fills every locale in ONE request', async () => {
        const transport = fakeTransport(
            envelope({
                items: [
                    { id: 'a1', detected: 'he', out: { he: 'א', en: 'b', ar: 'c', ru: 'д', es: 'e' } },
                    { id: 'b2', detected: 'he', out: { he: 'ברוך', en: 'Baruch', ar: 'ب', ru: 'Б', es: 'B' } }
                ]
            })
        );
        const engine = geminiEngine({ apiKey: 'k', model: 'm', transport });

        const out = await engine(ITEMS, TARGETS);

        expect(transport).toHaveBeenCalledTimes(1);
        expect(out).toHaveLength(2);
        expect(Object.keys(out[0].out).sort()).toEqual(['ar', 'en', 'es', 'he', 'ru']);
        expect(out[0].detected).toBe('he');
    });

    it('pins the response to JSON with a schema, and keeps the temperature low', async () => {
        let sent: any;
        const transport = fakeTransport(envelope({ items: [] }), { capture: (r) => (sent = r) });
        await geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS);

        expect(sent.generationConfig.responseMimeType).toBe('application/json');
        expect(sent.generationConfig.responseSchema.required).toEqual(['items']);
        expect(sent.generationConfig.responseSchema.properties.items.items.required).toEqual([
            'id',
            'detected',
            'out'
        ]);
        expect(sent.generationConfig.temperature).toBeLessThanOrEqual(0.3);
    });

    it('spends nothing on an empty batch', async () => {
        const transport = fakeTransport(envelope({ items: [] }));
        expect(await geminiEngine({ apiKey: 'k', model: 'm', transport })([], TARGETS)).toEqual([]);
        expect(await geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, [])).toEqual([]);
        expect(transport).not.toHaveBeenCalled();
    });

    it('refuses without a key rather than sending an unauthenticated request', async () => {
        const transport = fakeTransport(envelope({ items: [] }));
        await expect(geminiEngine({ apiKey: '', model: 'm', transport })(ITEMS, TARGETS)).rejects.toThrow(
            TranslateEngineError
        );
        expect(transport).not.toHaveBeenCalled();
    });
});

describe('failures are errors the caller can classify, never silent', () => {
    it('marks a 429 retryable — the quota is already spent either way', async () => {
        const transport = fakeTransport('rate limited', { status: 429 });
        const engine = geminiEngine({ apiKey: 'k', model: 'm', transport });

        await expect(engine(ITEMS, TARGETS)).rejects.toMatchObject({
            status: 429,
            retryable: true
        });
    });

    it('marks a 400 not retryable', async () => {
        const transport = fakeTransport('bad request', { status: 400 });
        await expect(geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS)).rejects.toMatchObject({
            status: 400,
            retryable: false
        });
    });

    it('rejects a response with no text part', async () => {
        const transport = fakeTransport({ candidates: [] });
        await expect(geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS)).rejects.toThrow(
            /no text part/
        );
    });

    it('rejects a text part that is not JSON', async () => {
        const transport = fakeTransport({
            candidates: [{ content: { parts: [{ text: 'Sure! Here is your translation:' }] } }]
        });
        await expect(geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS)).rejects.toThrow(
            /not valid JSON/
        );
    });

    it('rejects the whole batch when one id drifted', async () => {
        const transport = fakeTransport(
            envelope({ items: [{ id: 'ghost', detected: 'he', out: { en: 'x' } }] })
        );
        await expect(geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS)).rejects.toThrow(
            /bad batch shape/
        );
    });

    it('turns a transport throw into a retryable engine error', async () => {
        const transport = vi.fn(async () => {
            throw new Error('ECONNRESET');
        }) as unknown as typeof globalThis.fetch;

        await expect(geminiEngine({ apiKey: 'k', model: 'm', transport })(ITEMS, TARGETS)).rejects.toMatchObject({
            retryable: true
        });
    });
});

describe('buildPrompt', () => {
    it('carries the glossary in as a mandatory constraint', () => {
        const p = buildPrompt([{ id: 'x', mode: 'translate', text: 'הרקמה מחפשת שותפים' }], ['en']);
        expect(p).toContain('GLOSSARY');
        expect(p).toContain('rikma (partnership)');
        expect(p).toContain('discarded');
    });

    it('says nothing about a glossary when no term appears', () => {
        const p = buildPrompt([{ id: 'x', mode: 'translate', text: 'a booking site' }], ['he']);
        expect(p).not.toContain('GLOSSARY');
    });

    it('explains transliteration only when a name is in the batch', () => {
        const withName = buildPrompt([{ id: 'x', mode: 'transliterate', text: 'ברוך' }], ['en']);
        expect(withName).toContain('NAMES');

        const withoutName = buildPrompt([{ id: 'x', mode: 'translate', text: 'a site' }], ['en']);
        expect(withoutName).not.toContain('NAMES');
    });

    it('names every target language and asks for a detected source', () => {
        const p = buildPrompt(ITEMS, TARGETS);
        for (const name of ['Hebrew', 'English', 'Arabic', 'Russian', 'Spanish']) {
            expect(p).toContain(name);
        }
        expect(p).toContain('detected');
    });

    it('bans the two things the validator would otherwise bin the batch for', () => {
        const p = buildPrompt(ITEMS, TARGETS);
        expect(p).toMatch(/Do not explain/i);
        expect(p).toMatch(/no markdown/i);
    });
});

describe('chunk', () => {
    it('fills a batch before opening the next one', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('survives a nonsense size rather than looping forever', () => {
        expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
        expect(chunk([], 25)).toEqual([]);
    });
});
