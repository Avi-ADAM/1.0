import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...a: unknown[]) => sendToSer(...a) }));

const { readTranslationCache, rowsToMap, translateFor, MAX_HASHES_PER_READ } = await import(
    './store.js'
);
const { hashSource } = await import('$lib/translation/normalize.js');

const row = (over: Record<string, unknown> = {}) => ({
    id: '1',
    attributes: {
        key: 'he.en.abc',
        hash: 'abc',
        srcLang: 'he',
        tgtLang: 'en',
        text: 'A community clinic',
        mode: 'translate',
        engine: 'gemini',
        quality: 'machine',
        ...over
    }
});

const response = (rows: unknown[]) => ({ data: { textTranslations: { data: rows } } });

beforeEach(() => {
    sendToSer.mockReset();
});

describe('rowsToMap', () => {
    it('keys hits by source hash', () => {
        const map = rowsToMap(response([row()]), 'en');
        expect(map.abc.text).toBe('A community clinic');
        expect(map.abc.srcLang).toBe('he');
    });

    it('drops a row for the wrong target language rather than showing it', () => {
        expect(rowsToMap(response([row({ tgtLang: 'ru' })]), 'en')).toEqual({});
    });

    it('drops rows with no text, no hash, or an unknown source language', () => {
        expect(rowsToMap(response([row({ text: '' })]), 'en')).toEqual({});
        expect(rowsToMap(response([row({ hash: '' })]), 'en')).toEqual({});
        expect(rowsToMap(response([row({ srcLang: 'de' })]), 'en')).toEqual({});
    });

    it('prefers a human-reviewed row over a machine one for the same string', () => {
        const map = rowsToMap(
            response([
                row({ text: 'machine text' }),
                row({ text: 'human text', quality: 'reviewed', engine: 'human' })
            ]),
            'en'
        );
        expect(map.abc.text).toBe('human text');
        expect(map.abc.quality).toBe('reviewed');
    });

    it('does not let a machine row displace a reviewed one, whatever the order', () => {
        const map = rowsToMap(
            response([
                row({ text: 'human text', quality: 'reviewed', engine: 'human' }),
                row({ text: 'machine text' })
            ]),
            'en'
        );
        expect(map.abc.text).toBe('human text');
    });

    it('survives a garbage payload', () => {
        expect(rowsToMap(null, 'en')).toEqual({});
        expect(rowsToMap({ data: {} }, 'en')).toEqual({});
        expect(rowsToMap(response([{}, null]), 'en')).toEqual({});
    });
});

describe('readTranslationCache', () => {
    const strings = [
        { hash: hashSource('פיתוח אתר'), source: 'פיתוח אתר' },
        { hash: hashSource('מרפאה'), source: 'מרפאה' }
    ] as never;

    it('makes exactly one query for a whole page of strings', async () => {
        sendToSer.mockResolvedValue(response([]));
        await readTranslationCache(strings, 'en', { fetch: globalThis.fetch });
        expect(sendToSer).toHaveBeenCalledTimes(1);
        const [args, qid] = sendToSer.mock.calls[0];
        expect(qid).toBe('312translationsByHash');
        expect(args.tgt).toBe('en');
        expect(args.hashes).toHaveLength(2);
    });

    it('reports every hash it did not find as a miss', async () => {
        const hit = hashSource('פיתוח אתר');
        sendToSer.mockResolvedValue(response([row({ hash: hit })]));
        const out = await readTranslationCache(strings, 'en', { fetch: globalThis.fetch });
        expect(Object.keys(out.hits)).toEqual([hit]);
        expect(out.misses).toEqual([hashSource('מרפאה')]);
    });

    it('spends no query at all when the reader turned translation off', async () => {
        const out = await readTranslationCache(strings, 'en', {
            fetch: globalThis.fetch,
            pref: 'off'
        });
        expect(sendToSer).not.toHaveBeenCalled();
        expect(out).toEqual({ locale: 'en', hits: {}, misses: [] });
    });

    it('spends no query when there is nothing to look up', async () => {
        await readTranslationCache([], 'en', { fetch: globalThis.fetch });
        expect(sendToSer).not.toHaveBeenCalled();
    });

    it('renders source instead of throwing when the collection does not exist yet', async () => {
        // This is the state of the world in P1: no `text-translation` table,
        // every read fails, and the site must look exactly like it does today.
        sendToSer.mockRejectedValue(new Error('Unknown queId'));
        const out = await readTranslationCache(strings, 'en', { fetch: globalThis.fetch });
        expect(out.hits).toEqual({});
        expect(out.misses).toHaveLength(2);
    });

    it('caps one read at the query page limit', async () => {
        sendToSer.mockResolvedValue(response([]));
        const many = Array.from({ length: MAX_HASHES_PER_READ + 20 }, (_, i) => ({
            hash: hashSource(`string number ${i}`)
        })) as never;
        const out = await readTranslationCache(many, 'en', { fetch: globalThis.fetch });
        expect(sendToSer.mock.calls[0][0].hashes).toHaveLength(MAX_HASHES_PER_READ);
        // The tail is reported honestly as a miss, not silently dropped.
        expect(out.misses).toHaveLength(MAX_HASHES_PER_READ + 20);
    });

    it('refuses a locale the site does not speak', async () => {
        const out = await readTranslationCache(strings, 'de' as never, { fetch: globalThis.fetch });
        expect(sendToSer).not.toHaveBeenCalled();
        expect(out.hits).toEqual({});
    });
});

describe('translateFor', () => {
    it('collects from loader data and looks the strings up in one call', async () => {
        sendToSer.mockResolvedValue(response([]));
        const out = await translateFor(
            {
                project: [{ id: '1', attributes: { projectName: 'רקמת פיתוח קהילתי' } }],
                openMission: [{ id: '2', attributes: { name: 'עיצוב מסך הזמנות' } }]
            },
            'es',
            { fetch: globalThis.fetch }
        );
        expect(sendToSer).toHaveBeenCalledTimes(1);
        expect(sendToSer.mock.calls[0][0].hashes).toHaveLength(2);
        expect(out.locale).toBe('es');
    });
});
