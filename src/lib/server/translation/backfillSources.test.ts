import { describe, it, expect, vi } from 'vitest';

vi.mock('./config.js', () => ({
    readsCache: () => true,
    stateDir: () => '',
    limits: () => ({ rpm: 10, rpd: 200, batch: 25, onDemandShare: 0.3, model: 'm' })
}));

const { BACKFILL_SOURCES, activeSources, sourceByKey, stringsForNode } = await import('./backfillSources.js');
const {
    missionCardGroups,
    missionDetailGroups,
    resourceCardGroups,
    resourceDetailGroups,
    projectCardGroups,
    projectDetailGroups,
    productCardGroups
} = await import('./surfaces.js');
const {
    normalizeMissionCard,
    normalizeResourceCard,
    normalizeProjectCard,
    normalizeProductCard
} = await import('$lib/server/discovery/normalizeCards.js');
const { collect } = await import('$lib/translation/collect.js');
const { HIDDEN_PROJECT_IDS } = await import('$lib/server/discovery/hiddenProjects.js');

/** Sorted hashes of what one surface's loader would look up. */
const loaderHashes = (groups: Record<string, unknown[]>) =>
    collect(groups as never)
        .map((s) => s.hash)
        .sort();

/** Sorted hashes of what the walker produces for one surface of one node. */
const walkerHashes = (key: string, node: unknown, surface: string) =>
    sourceByKey(key)!
        .strings(node)
        .find((g) => g.surface === surface)!
        .strings.map((s) => s.hash)
        .sort();

const HIDDEN = HIDDEN_PROJECT_IDS[0];

/** A raw node in the shape `315backfillMissions` returns. */
const NODE = {
    id: '7',
    attributes: {
        name: 'פיתוח אתר הזמנות למרפאה קהילתית',
        descrip:
            '<p>בניית <strong>מערכת תורים</strong> למרפאה קהילתית, כולל ' +
            'ממשק למטופלים וללוח&nbsp;הזמנים של הצוות.</p><p>העבודה כוללת גם ' +
            'התממשקות למערכת הקיימת.</p>',
        hearotMeyuchadot: '<p>נדרשת זמינות בשעות הערב.</p>',
        updatedAt: '2026-09-01T00:00:00.000Z',
        project: { data: { id: '9', attributes: { projectName: 'רקמת הבריאות' } } }
    }
};

/** Long enough that the card's 220-character excerpt has to cut it. */
const LONG_NODE = {
    id: '8',
    attributes: {
        name: 'ליווי הקמה של מרכז קהילתי',
        descrip:
            '<p>' +
            'ליווי מלא של הקמת מרכז קהילתי חדש בשכונה, משלב התכנון ועד לפתיחת הדלתות. '.repeat(5) +
            '</p>',
        hearotMeyuchadot: null,
        project: { data: { id: '9', attributes: { projectName: 'רקמת הבריאות' } } }
    }
};

const all = () => true;

describe('the table', () => {
    it('has one source per corpus walk, and every one names a qid and its surfaces', () => {
        expect(BACKFILL_SOURCES.length).toBeGreaterThan(0);
        for (const s of BACKFILL_SOURCES) {
            expect(s.qid).toMatch(/^\d+/);
            expect(s.surfaces.length).toBeGreaterThan(0);
            expect(s.tier).toBeGreaterThanOrEqual(1);
        }
    });

    it('looks a source up by key', () => {
        expect(sourceByKey('openMission')?.qid).toBe('315backfillMissions');
        expect(sourceByKey('nope')).toBeNull();
    });
});

/**
 * The property this whole file exists for.
 *
 * The cache is content-addressed, so a row is only ever found by a page that
 * hashes byte for byte the same string. A walker that flattened `descrip` even
 * slightly differently from the loader would spend the entire free quota
 * filling rows no page can look up — and it would look like it worked, because
 * nothing errors and every page just renders source text.
 */
describe('the walker hashes exactly what the loaders hash', () => {
    const source = sourceByKey('openMission')!;

    it('matches the directory card, excerpt and all', () => {
        const card = normalizeMissionCard(NODE as never)!;
        const fromLoader = collect(missionCardGroups([card]) as never).map((s) => s.hash).sort();
        const fromWalker = source
            .strings(NODE)
            .find((g) => g.surface === 'availableMission')!
            .strings.map((s) => s.hash)
            .sort();

        expect(fromWalker).toEqual(fromLoader);
        expect(fromWalker.length).toBeGreaterThan(0);
    });

    it('matches the mission page, full description and all', () => {
        const fromLoader = collect(missionDetailGroups(NODE) as never).map((s) => s.hash).sort();
        const fromWalker = source
            .strings(NODE)
            .find((g) => g.surface === 'missionDetail')!
            .strings.map((s) => s.hash)
            .sort();

        expect(fromWalker).toEqual(fromLoader);
    });

    it('costs one row, not two, when the description is short enough not to be truncated', () => {
        const card = source.strings(NODE).find((g) => g.surface === 'availableMission')!.strings;
        const detail = source.strings(NODE).find((g) => g.surface === 'missionDetail')!.strings;

        // The excerpt only differs from the full text when it is cut. Below the
        // 220-character mark the two surfaces are the same string, so content
        // addressing gives the second surface away for free.
        expect(card.find((s) => s.field === 'descrip')!.hash).toBe(
            detail.find((s) => s.field === 'descrip')!.hash
        );
    });

    it('produces two rows once the card has to truncate — and that is the design', () => {
        const card = source.strings(LONG_NODE).find((g) => g.surface === 'availableMission')!.strings;
        const detail = source.strings(LONG_NODE).find((g) => g.surface === 'missionDetail')!.strings;

        const cardDescrip = card.find((s) => s.field === 'descrip')!;
        const pageDescrip = detail.find((s) => s.field === 'descrip')!;

        // Two strings, two hashes, two rows — content addressing working as
        // designed at the cost of one extra row (§12). The card row is the one
        // an anonymous reader hits first.
        expect(cardDescrip.hash).not.toBe(pageDescrip.hash);
        expect(cardDescrip.source.endsWith('…')).toBe(true);
        expect(pageDescrip.source.length).toBeGreaterThan(cardDescrip.source.length);
    });

    it('carries no markup into either — the cache stores plain text', () => {
        for (const group of source.strings(NODE)) {
            for (const s of group.strings) {
                expect(s.source).not.toMatch(/<[a-z/]/i);
                expect(s.source).not.toContain('&nbsp;');
            }
        }
    });
});

/** The P4 walkers hold the same rule, each against its own loader. */
describe('requested resources — /availiableResorce and its pages', () => {
    const RESOURCE = {
        id: '21',
        attributes: {
            name: 'מקרן לאירוע קהילתי',
            descrip: 'מקרן  איכותי\n לערב הקרנה בגינה הציבורית, כולל מסך.',
            updatedAt: '2026-09-01T00:00:00.000Z',
            project: { data: { id: '9', attributes: { projectName: 'רקמת הבריאות' } } }
        }
    };

    it('matches the directory card', () => {
        const card = normalizeResourceCard(RESOURCE as never)!;
        const fromWalker = walkerHashes('openMashaabim', RESOURCE, 'availableResource');
        expect(fromWalker).toEqual(loaderHashes(resourceCardGroups([card])));
        expect(fromWalker).toHaveLength(3);
    });

    it('matches the resource page, which renders descrip as plain text', () => {
        // The loader hands the page `alld` — the attributes — wrapped with the id.
        const fromLoader = loaderHashes(resourceDetailGroups({ id: '21', attributes: RESOURCE.attributes }));
        expect(walkerHashes('openMashaabim', RESOURCE, 'resourceDetail')).toEqual(fromLoader);
    });

    it('costs one row for a description the card does not cut', () => {
        // The card's excerpt collapses whitespace; collect() normalizes the raw
        // field the same way, so below 220 characters they are one string.
        expect(walkerHashes('openMashaabim', RESOURCE, 'availableResource')).toEqual(
            walkerHashes('openMashaabim', RESOURCE, 'resourceDetail')
        );
    });
});

describe('rikmot — /project and /project/[id]', () => {
    const PROJECT = {
        id: '9',
        attributes: {
            projectName: 'רקמת הבריאות',
            publicDescription: '<p>רקמה שבונה <strong>כלים דיגיטליים</strong> למרפאות קהילתיות.</p>',
            updatedAt: '2026-09-01T00:00:00.000Z',
            open_missions: { data: [{ id: '7', attributes: { name: 'פיתוח אתר הזמנות' } }] },
            matanotofs: { data: [{ id: '3', attributes: { name: 'ערכת עזרה ראשונה' } }] }
        }
    };

    it('matches the directory card', () => {
        const card = normalizeProjectCard(PROJECT as never)!;
        expect(walkerHashes('project', PROJECT, 'projectDirectory')).toEqual(
            loaderHashes(projectCardGroups([card]))
        );
    });

    it('matches the rikma page — description, mission names, product names', () => {
        const fromWalker = walkerHashes('project', PROJECT, 'projectDetail');
        expect(fromWalker).toEqual(loaderHashes(projectDetailGroups(PROJECT)));
        expect(fromWalker).toHaveLength(3);
    });

    it('does not look up the rikma name on its own page — the seal is not prose', () => {
        const detail = sourceByKey('project')!
            .strings(PROJECT)
            .find((g) => g.surface === 'projectDetail')!.strings;
        expect(detail.some((s) => s.source === 'רקמת הבריאות')).toBe(false);
    });

    it('gives the mission page the same row the rikma page reads', () => {
        // A mission's name is one string wherever it is shown; the rikma page
        // and the mission walker must agree on it or the page buys it twice.
        const mission = {
            id: '7',
            attributes: { name: 'פיתוח אתר הזמנות', descrip: null, project: { data: null } }
        };
        const fromMission = walkerHashes('openMission', mission, 'missionDetail');
        expect(walkerHashes('project', PROJECT, 'projectDetail')).toEqual(
            expect.arrayContaining(fromMission)
        );
    });

    it('walks no hidden rikma', () => {
        const hidden = { ...PROJECT, id: HIDDEN };
        expect(stringsForNode(sourceByKey('project')!, hidden, all)).toEqual([]);
    });
});

describe('products — /gift', () => {
    const PRODUCT = {
        id: '3',
        attributes: {
            name: 'ערכת עזרה ראשונה',
            origin: 'project',
            projectcreates: { data: [{ id: '9', attributes: { projectName: 'רקמת הבריאות' } }] }
        }
    };

    it('matches the directory card', () => {
        const card = normalizeProductCard(PRODUCT as never)!;
        const fromWalker = walkerHashes('matanot', PRODUCT, 'productDirectory');
        expect(fromWalker).toEqual(loaderHashes(productCardGroups([card])));
        expect(fromWalker).toHaveLength(2);
    });

    it('does not look up a personal seller — a person is transliterated, not translated', () => {
        const personal = {
            id: '4',
            attributes: {
                name: 'שיעור גיטרה',
                origin: 'personal',
                owner_user: { data: { id: '1', attributes: { username: 'ברוך' } } },
                projectcreates: { data: [] }
            }
        };
        const strings = stringsForNode(sourceByKey('matanot')!, personal, all);
        expect(strings.map((s) => s.source)).toEqual(['שיעור גיטרה']);
    });
});

describe('hidden rikmot', () => {
    it('are dropped by every walker, as every directory loader drops them', () => {
        const hiddenRel = { data: { id: HIDDEN, attributes: { projectName: 'רקמת בדיקה' } } };
        const nodes: Record<string, unknown> = {
            openMission: { id: '1', attributes: { ...NODE.attributes, project: hiddenRel } },
            openMashaabim: { id: '2', attributes: { name: 'מקרן', descrip: 'מקרן', project: hiddenRel } },
            project: { id: HIDDEN, attributes: { projectName: 'רקמת בדיקה' } },
            matanot: {
                id: '3',
                attributes: { name: 'מוצר בדיקה', projectcreates: { data: [hiddenRel.data] } }
            }
        };
        for (const source of BACKFILL_SOURCES) {
            expect(stringsForNode(source, nodes[source.key], all)).toEqual([]);
        }
    });
});

describe('stringsForNode', () => {
    it('deduplicates across surfaces — the mission name is one string, not two', () => {
        const source = sourceByKey('openMission')!;
        const merged = stringsForNode(source, LONG_NODE, all);
        const hashes = merged.map((s) => s.hash);

        expect(new Set(hashes).size).toBe(hashes.length);
        expect(merged.filter((s) => s.field === 'name')).toHaveLength(1);
        // Both descrip variants survive: they are genuinely different strings.
        expect(merged.filter((s) => s.field === 'descrip')).toHaveLength(2);
    });

    it('drops the surfaces that are off, so nothing is bought for a page nobody reads', () => {
        const source = sourceByKey('openMission')!;
        const cardOnly = stringsForNode(source, NODE, (s) => s === 'availableMission');
        const both = stringsForNode(source, NODE, all);

        expect(cardOnly.length).toBeLessThan(both.length);
        expect(cardOnly.some((s) => s.field === 'hearotMeyuchadot')).toBe(false);
    });

    it('returns nothing for a node with no attributes rather than throwing', () => {
        const source = sourceByKey('openMission')!;
        expect(stringsForNode(source, null, all)).toEqual([]);
        expect(stringsForNode(source, { id: '1' }, all)).toEqual([]);
    });

    it('survives a mission with no rikma and no description', () => {
        const source = sourceByKey('openMission')!;
        const bare = { id: '3', attributes: { name: 'עיצוב לוגו', descrip: null, project: { data: null } } };
        const out = stringsForNode(source, bare, all);

        expect(out.map((s) => s.field)).toEqual(['name']);
    });
});

describe('activeSources', () => {
    it('skips a source whose every surface is off — that would be spend with no reader', () => {
        expect(activeSources(() => false)).toEqual([]);
        expect(activeSources(all)).toHaveLength(BACKFILL_SOURCES.length);
    });

    it('keeps a source when even one of its surfaces is on', () => {
        expect(activeSources((s) => s === 'missionDetail').map((s) => s.key)).toEqual(['openMission']);
        expect(activeSources((s) => s === 'projectDetail').map((s) => s.key)).toEqual(['project']);
    });

    it('honours --only', () => {
        expect(activeSources(all, ['openMission'])).toHaveLength(1);
        expect(activeSources(all, ['matanot', 'project']).map((s) => s.key)).toEqual(['project', 'matanot']);
        expect(activeSources(all, ['nothing-by-this-name'])).toEqual([]);
    });

    it('has a walker for every surface the read path knows', async () => {
        // A surface with no walker can only ever be filled by an `always`
        // reader — never for a guest, which is the reader §15 exists for.
        const { SURFACE_KEYS } = await vi.importActual<typeof import('./config.js')>('./config.js');
        const walked = new Set(BACKFILL_SOURCES.flatMap((s) => s.surfaces));
        expect(SURFACE_KEYS.length).toBeGreaterThan(0);
        for (const key of SURFACE_KEYS) expect(walked.has(key)).toBe(true);
    });

    it('returns them in tier order — public and anonymous first', () => {
        const tiers = activeSources(all).map((s) => s.tier);
        expect([...tiers].sort((a, b) => a - b)).toEqual(tiers);
    });
});
