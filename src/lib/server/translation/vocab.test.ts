import { describe, it, expect, vi } from 'vitest';

vi.mock('./config.js', () => ({
    readsCache: () => true,
    stateDir: () => '',
    limits: () => ({ rpm: 10, rpd: 200, batch: 25, onDemandShare: 0.3, model: 'm', fallbackModels: [] })
}));

const { VOCAB_KINDS, vocabStrings, vocabRows, isVocabCacheLocale } = await import('./vocab.js');
const { BACKFILL_SOURCES, stringsForNode } = await import('./backfillSources.js');
const { hashSource } = await import('$lib/translation/normalize.js');

const skill = VOCAB_KINDS.find((k) => k.entityKey === 'skill')!;
const page = {
    data: {
        skills: {
            data: [
                { id: '1', attributes: { skillName: '  Web   development ' } },
                { id: '2', attributes: { skillName: 'x' } },
                { id: '3', attributes: { skillName: 'UX design' } }
            ],
            meta: { pagination: { page: 1, pageSize: 200, pageCount: 1, total: 3 } }
        }
    }
};

describe('the catalog as a translation surface', () => {
    it('hashes the normalised English base name, and skips what is not worth a request', () => {
        const strings = vocabStrings(skill, vocabRows(skill, page));
        expect(strings.map((s) => s.source)).toEqual(['Web development', 'UX design']);
        expect(strings[0].hash).toBe(hashSource('Web development'));
    });

    it('the walker produces exactly the strings the vocab endpoint looks up', () => {
        const source = BACKFILL_SOURCES.find((s) => s.key === 'vocab:skill')!;
        expect(source.surfaces).toEqual(['vocabulary']);
        const walked = source
            .rowsOf(page)
            .flatMap((node) => stringsForNode(source, node, () => true))
            .map((s) => s.hash);
        const served = vocabStrings(skill, vocabRows(skill, page)).map((s) => s.hash);
        expect(walked).toEqual(served);
    });

    it('has one source per catalog collection', () => {
        const keys = BACKFILL_SOURCES.map((s) => s.key).filter((k) => k.startsWith('vocab:'));
        expect(keys.sort()).toEqual(['vocab:skill', 'vocab:tafkidim', 'vocab:vallue', 'vocab:workWay']);
    });

    it('serves only the locales Strapi has no row for', () => {
        expect(['ar', 'ru', 'es'].every(isVocabCacheLocale)).toBe(true);
        expect(isVocabCacheLocale('he')).toBe(false);
        expect(isVocabCacheLocale('en')).toBe(false);
    });
});
