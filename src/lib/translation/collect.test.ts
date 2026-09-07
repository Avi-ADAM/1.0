import { describe, it, expect } from 'vitest';
import { collect, collectFromEntity, collectFromList, hashesOf } from './collect.js';
import { hashSource } from './normalize.js';

describe('collectFromEntity', () => {
    it('reads a raw Strapi entity — { id, attributes }', () => {
        const got = collectFromEntity('project', {
            id: '7',
            attributes: {
                projectName: 'רקמת פיתוח קהילתי',
                publicDescription: 'פיתוח אתר הזמנות למרפאה קהילתית'
            }
        });
        expect(got.map((s) => s.field).sort()).toEqual(['projectName', 'publicDescription']);
        expect(got[0].id).toBe('7');
        expect(got[0].entityKey).toBe('project');
        expect(got[0].path).toBe('project.projectName');
    });

    it('reads an already-flattened entity — { id, ...fields }', () => {
        const got = collectFromEntity('openMission', {
            id: 3,
            name: 'עיצוב מסך הזמנות',
            descrip: 'מסך שמראה את כל התורים הפתוחים'
        });
        expect(got).toHaveLength(2);
        expect(got[0].id).toBe('3');
    });

    it('skips fields that are absent, empty, or not strings', () => {
        const got = collectFromEntity('project', {
            id: '1',
            attributes: { projectName: '', publicDescription: null }
        });
        expect(got).toEqual([]);
    });

    it('skips a value longer than the field max instead of truncating it', () => {
        // Truncating would hash a different string than the one on screen, and
        // the reader would get half a description translated.
        const got = collectFromEntity('project', {
            id: '1',
            attributes: { projectName: 'א'.repeat(200) }
        });
        expect(got).toEqual([]);
    });

    it('skips a field with no language in it — a URL, a number, a date', () => {
        const got = collectFromEntity('user', {
            id: '1',
            attributes: { bio: 'https://example.com', city: '42', username: 'Baruch' }
        });
        expect(got.map((s) => s.field)).toEqual(['username']);
    });

    it('carries the manifest mode through, so a name is never translated as prose', () => {
        const got = collectFromEntity('user', { id: '1', attributes: { username: 'בָּרוּךְ' } });
        expect(got[0].mode).toBe('transliterate');
    });

    it('normalizes before hashing, so trailing whitespace is not a new cache row', () => {
        const a = collectFromEntity('project', { id: '1', attributes: { projectName: ' רקמה  א ' } });
        const b = collectFromEntity('project', { id: '2', attributes: { projectName: 'רקמה א' } });
        expect(a[0].hash).toBe(b[0].hash);
        expect(a[0].source).toBe('רקמה א');
    });

    it('returns nothing for an entity kind that is not in the manifest', () => {
        expect(collectFromEntity('forum', { id: '1', attributes: { subject: 'שלום' } })).toEqual([]);
    });

    it('survives null, undefined and junk', () => {
        expect(collectFromEntity('project', null)).toEqual([]);
        expect(collectFromEntity('project', undefined)).toEqual([]);
        expect(collectFromList('project', null as never)).toEqual([]);
    });
});

describe('collect', () => {
    it('deduplicates by hash across entities — the point of content addressing', () => {
        // The same rikma name on thirty cards is one lookup, and later one
        // paid request, not thirty.
        const got = collect({
            project: [
                { id: '1', attributes: { projectName: 'רקמת פיתוח' } },
                { id: '2', attributes: { projectName: 'רקמת פיתוח' } }
            ],
            openMission: [{ id: '9', attributes: { name: 'רקמת פיתוח' } }]
        });
        expect(got).toHaveLength(1);
        expect(got[0].hash).toBe(hashSource('רקמת פיתוח'));
    });

    it('collects across kinds', () => {
        const got = collect({
            project: [{ id: '1', attributes: { projectName: 'רקמה א' } }],
            user: [{ id: '5', attributes: { bio: 'מפתחת אתרים מירושלים' } }]
        });
        expect(got.map((s) => s.entityKey).sort()).toEqual(['project', 'user']);
    });

    it('handles an empty or missing group map', () => {
        expect(collect({})).toEqual([]);
        expect(collect(undefined as never)).toEqual([]);
    });
});

describe('hashesOf', () => {
    it('returns the distinct hashes', () => {
        const h = hashSource('רקמה א');
        expect(hashesOf([{ hash: h }, { hash: h }] as never)).toEqual([h]);
        expect(hashesOf(undefined as never)).toEqual([]);
    });
});
