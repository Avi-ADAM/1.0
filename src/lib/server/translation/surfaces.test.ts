import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `config.ts` reads `$env/dynamic/private`, which does not exist outside a
 * SvelteKit build. Mocking the flag rather than the env module keeps the test
 * about the thing it is testing: whether a query runs at all.
 */
const readsCache = vi.fn(() => true);
/**
 * `stateDir` returns '' — the documented default — so `serverDemandLog` hands
 * back null and the demand log stays entirely out of these tests. That it is
 * *called* at all is covered in `demand.test.ts`.
 */
vi.mock('./config.js', () => ({
    readsCache: (...args: unknown[]) => readsCache(...(args as [])),
    stateDir: () => '',
    // Unused here, but the module is imported whole.
    limits: () => ({ rpm: 10, rpd: 200, batch: 25, onDemandShare: 0.3, model: 'm' })
}));

const readTranslationCache = vi.fn(async (strings: any[], locale: string) => ({
    locale,
    hits: {},
    misses: strings.map((s) => s.hash)
}));
vi.mock('./store.js', () => ({
    readTranslationCache: (...args: unknown[]) => readTranslationCache(...(args as [any[], string])),
    MAX_HASHES_PER_READ: 300
}));

const {
    translateSurface,
    missionCardGroups,
    resourceDetailGroups,
    projectCardGroups,
    projectDetailGroups,
    productCardGroups,
    MAX_PENDING
} = await import('./surfaces.js');
const { collect } = await import('$lib/translation/collect.js');

const sources = (groups: Record<string, unknown[]>) =>
    collect(groups as never).map((s) => `${s.path}=${s.source}`);

const CARDS = [
    { id: '1', name: 'פיתוח אתר הזמנות', excerpt: 'בניית מערכת תורים למרפאה', projectId: '9', projectName: 'רקמת הבריאות' },
    { id: '2', name: 'עיצוב לוגו', excerpt: null, projectId: '9', projectName: 'רקמת הבריאות' }
];

beforeEach(() => {
    readsCache.mockReturnValue(true);
    readTranslationCache.mockClear();
});

describe('the env flag', () => {
    it('makes no query at all when the surface is not enabled', async () => {
        readsCache.mockReturnValue(false);
        const out = await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);

        expect(readTranslationCache).not.toHaveBeenCalled();
        expect(out).toEqual({ translations: null, pending: [] });
    });

    it('reads once when it is', async () => {
        await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        expect(readTranslationCache).toHaveBeenCalledTimes(1);
    });
});

describe('the reader preference', () => {
    it('`off` costs the reader nothing, not even one round-trip', async () => {
        const out = await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch, 'off');
        expect(readTranslationCache).not.toHaveBeenCalled();
        expect(out.translations).toBeNull();
    });

    it('treats an absent or unknown cookie as the default', async () => {
        for (const pref of [undefined, '', 'nonsense']) {
            readTranslationCache.mockClear();
            await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch, pref);
            expect(readTranslationCache).toHaveBeenCalledTimes(1);
            expect((readTranslationCache.mock.calls[0] as unknown as any[])[2].pref).toBe('onDemand');
        }
    });

    it('passes `always` through', async () => {
        await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch, 'always');
        expect((readTranslationCache.mock.calls[0] as unknown as any[])[2].pref).toBe('always');
    });
});

describe('an unknown locale', () => {
    it('is not a language we can translate into, so nothing is asked', async () => {
        for (const locale of [undefined, 'fr', '', null]) {
            readTranslationCache.mockClear();
            const out = await translateSurface('availableMission', missionCardGroups(CARDS), locale, fetch);
            expect(readTranslationCache).not.toHaveBeenCalled();
            expect(out.pending).toEqual([]);
        }
    });
});

describe('missionCardGroups', () => {
    it('hashes the excerpt the card actually renders, not the raw HTML', async () => {
        await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        const strings = (readTranslationCache.mock.calls[0] as unknown as any[])[0];
        expect(strings.map((s: any) => s.source)).toContain('בניית מערכת תורים למרפאה');
    });

    it('asks about a repeated rikma name once, not once per card', async () => {
        await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        const strings = (readTranslationCache.mock.calls[0] as unknown as any[])[0];
        const names = strings.filter((s: any) => s.source === 'רקמת הבריאות');
        expect(names).toHaveLength(1);
    });

    it('skips a card with no excerpt rather than hashing an empty string', async () => {
        await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        const strings = (readTranslationCache.mock.calls[0] as unknown as any[])[0];
        expect(strings.every((s: any) => s.source.length > 0)).toBe(true);
        // 2 names + 1 excerpt + 1 project name.
        expect(strings).toHaveLength(4);
    });

    it('survives a nonsense card list', () => {
        expect(missionCardGroups(null as unknown as unknown[])).toEqual({
            openMission: [],
            project: []
        });
    });
});

describe('the P4 builders hash what their pages render', () => {
    it('resourceDetailGroups: the plain-text descrip as it is, and only a rikma name', () => {
        const withRikma = {
            id: '21',
            attributes: {
                name: 'מקרן',
                descrip: 'מקרן לערב הקרנה',
                project: { data: { id: '9', attributes: { projectName: 'רקמת הבריאות' } } }
            }
        };
        expect(sources(resourceDetailGroups(withRikma))).toEqual([
            'openMashaabim.name=מקרן',
            'openMashaabim.descrip=מקרן לערב הקרנה',
            'project.projectName=רקמת הבריאות'
        ]);

        // A concierge/maagad need has no rikma; the page shows a label it
        // builds itself, which is chrome, not text anybody wrote.
        const wish = { id: '22', attributes: { name: 'מקרן', descrip: null, project: { data: null } } };
        expect(sources(resourceDetailGroups(wish))).toEqual(['openMashaabim.name=מקרן']);
        expect(resourceDetailGroups(null)).toEqual({});
    });

    it('projectCardGroups: the name and the excerpt, as the card has them', () => {
        const cards = [{ id: '9', name: 'רקמת הבריאות', description: 'כלים דיגיטליים למרפאות' }];
        expect(sources(projectCardGroups(cards))).toEqual([
            'project.projectName=רקמת הבריאות',
            'project.publicDescription=כלים דיגיטליים למרפאות'
        ]);
    });

    it('projectDetailGroups: the flattened description, mission and product names — not the seal', () => {
        const project = {
            id: '9',
            attributes: {
                projectName: 'רקמת הבריאות',
                publicDescription: '<p>כלים <strong>דיגיטליים</strong></p><p>למרפאות</p>',
                open_missions: { data: [{ id: '7', attributes: { name: 'פיתוח אתר' } }] },
                matanotofs: { data: [{ id: '3', attributes: { name: 'ערכת עזרה ראשונה' } }] }
            }
        };
        const out = sources(projectDetailGroups(project));
        expect(out).toContain('openMission.name=פיתוח אתר');
        expect(out).toContain('matanot.name=ערכת עזרה ראשונה');
        expect(out.some((s) => s.startsWith('project.projectName'))).toBe(false);
        const descrip = out.find((s) => s.startsWith('project.publicDescription='))!;
        expect(descrip).not.toMatch(/<[a-z/]/i);
        expect(descrip).toContain('דיגיטליים');
    });

    it('projectDetailGroups survives a rikma with no missions and no products', () => {
        expect(sources(projectDetailGroups({ id: '9', attributes: { publicDescription: null } }))).toEqual([]);
        expect(projectDetailGroups(null)).toEqual({});
    });

    it('productCardGroups: a personal seller is a person, and is not looked up', () => {
        const cards = [
            { id: '3', name: 'ערכת עזרה ראשונה', personal: false, projectId: '9', projectName: 'רקמת הבריאות' },
            { id: '4', name: 'שיעור גיטרה', personal: true, projectId: null, projectName: null }
        ];
        expect(sources(productCardGroups(cards))).toEqual([
            'matanot.name=ערכת עזרה ראשונה',
            'matanot.name=שיעור גיטרה',
            'project.projectName=רקמת הבריאות'
        ]);
    });
});

describe('what the client is handed for warming', () => {
    it('returns the missed strings themselves — a hash cannot be un-hashed', async () => {
        const out = await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        expect(out.pending.length).toBeGreaterThan(0);
        for (const p of out.pending) {
            expect(typeof p.source).toBe('string');
            expect(p.source.length).toBeGreaterThan(0);
            expect(p.hash).toBeTruthy();
        }
    });

    it('caps the list at what one request could actually spend', async () => {
        const many = Array.from({ length: 200 }, (_, i) => ({
            id: String(i),
            name: `משימה מספר ${i} בפרויקט`,
            excerpt: `תיאור ייחודי למשימה מספר ${i}`,
            projectId: String(i),
            projectName: `רקמה מספר ${i}`
        }));
        const out = await translateSurface('availableMission', missionCardGroups(many), 'en', fetch);
        expect(out.pending).toHaveLength(MAX_PENDING);
    });

    it('hands back nothing to warm when everything was a hit', async () => {
        readTranslationCache.mockImplementationOnce(async (strings: any[], locale: string) => ({
            locale,
            hits: Object.fromEntries(
                strings.map((s) => [
                    s.hash,
                    { text: 'x', srcLang: 'he', mode: 'translate', engine: 'gemini', quality: 'machine' }
                ])
            ),
            misses: []
        }));
        const out = await translateSurface('availableMission', missionCardGroups(CARDS), 'en', fetch);
        expect(out.pending).toEqual([]);
        expect(Object.keys(out.translations!.hits).length).toBe(4);
    });
});
