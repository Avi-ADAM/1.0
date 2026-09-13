import { describe, it, expect, vi } from 'vitest';

vi.mock('./config.js', () => ({
    readsCache: () => true,
    stateDir: () => '',
    limits: () => ({ rpm: 10, rpd: 200, batch: 25, onDemandShare: 0.3, model: 'm' })
}));

const { runBackfill, advance, emptyBackfillState } = await import('./backfill.js');
const { Governor } = await import('./governor.js');
const { hashSource } = await import('$lib/translation/normalize.js');
import type { BackfillIO } from './backfill.js';
import type { CacheRowInput } from '$lib/server/actions/configs/cacheTranslations.js';

const all = () => true;

/** Two Hebrew missions from one rikma — a directory page in miniature. */
function corpus(count = 2) {
    return {
        data: {
            openMissions: {
                data: Array.from({ length: count }, (_, i) => ({
                    id: String(i + 1),
                    attributes: {
                        name: `פיתוח אתר מספר ${i + 1}`,
                        descrip: `<p>בניית מערכת תורים למרפאה קהילתית מספר ${i + 1}.</p>`,
                        hearotMeyuchadot: null,
                        project: { data: { id: '9', attributes: { projectName: 'רקמת הבריאות' } } }
                    }
                })),
                meta: { pagination: { page: 1, pageSize: 200, pageCount: 1, total: count } }
            }
        }
    };
}

/** A fake world. Records everything so a test can assert on what was spent. */
function fakeIO(over: Partial<BackfillIO> = {}) {
    const stored: CacheRowInput[] = [];
    const queries: Array<{ qid: string; variables: Record<string, unknown> }> = [];
    const io: BackfillIO & { stored: CacheRowInput[]; queries: typeof queries } = {
        stored,
        queries,
        async query(qid, variables) {
            queries.push({ qid, variables });
            return corpus();
        },
        async cached() {
            return new Map();
        },
        async store(rows) {
            stored.push(...rows);
            return { created: rows.length, skipped: 0, rejected: 0 };
        },
        ...over
    } as never;
    return io;
}

const openGovernor = () => new Governor({ rpm: 100, rpd: 1000, onDemandShare: 0.3 });

/** An engine that answers everything, and counts how often it was asked. */
function fakeEngine() {
    const calls: string[][] = [];
    const engine = async (items: Array<{ id: string; text: string }>, targets: string[]) => {
        calls.push(items.map((i) => i.id));
        return items.map((item) => ({
            id: item.id,
            detected: 'he',
            out: Object.fromEntries(targets.filter((t) => t !== 'he').map((t) => [t, `[${t}] ${item.text}`]))
        }));
    };
    return Object.assign(engine, { calls });
}

describe('nothing to do', () => {
    it('refuses to walk when no source feeds an enabled surface', async () => {
        const io = fakeIO();
        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: fakeEngine() as never,
            enabled: () => false,
            state: emptyBackfillState()
        });

        expect(report.stopped).toBe('no-sources');
        expect(io.queries).toHaveLength(0);
        expect(io.stored).toHaveLength(0);
    });
});

describe('identity rows', () => {
    it('are written with no engine at all, and no request', async () => {
        const io = fakeIO();
        const governor = openGovernor();
        const report = await runBackfill({ io, governor, enabled: all, state: emptyBackfillState() });

        expect(report.stopped).toBe('no-engine');
        expect(report.requests).toBe(0);
        expect(governor.status().backfill).toBe(0);
        expect(report.identityRows).toBeGreaterThan(0);
        expect(io.stored.every((r) => r.engine === 'identity')).toBe(true);
        expect(io.stored.every((r) => r.srcLang === 'he' && r.tgtLang === 'he')).toBe(true);
        expect(io.stored.every((r) => r.text === r.source)).toBe(true);
    });

    it('are skipped for a string whose language the detector will not guess', async () => {
        const io = fakeIO({
            async query() {
                return {
                    data: {
                        openMissions: {
                            data: [
                                {
                                    id: '1',
                                    // Two Latin words are not evidence of a language:
                                    // `detect.ts` answers `unknown` rather than flip a coin.
                                    attributes: { name: 'Studio Nova', descrip: null, project: { data: null } }
                                }
                            ],
                            meta: { pagination: { total: 1 } }
                        }
                    }
                };
            }
        });

        const report = await runBackfill({ io, governor: openGovernor(), enabled: all, state: emptyBackfillState() });
        expect(report.identityRows).toBe(0);
        expect(io.stored).toHaveLength(0);
    });
});

describe('idempotence', () => {
    it('spends nothing when every string is already cached', async () => {
        const io = fakeIO({
            async cached(hashes) {
                return new Map(hashes.map((h) => [h, new Set(['he', 'en', 'ar', 'ru', 'es'])]));
            }
        });
        const governor = openGovernor();
        const engine = fakeEngine();

        const report = await runBackfill({
            io,
            governor,
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.alreadyCached).toBe(report.considered);
        expect(report.requests).toBe(0);
        expect(engine.calls).toHaveLength(0);
        expect(io.stored).toHaveLength(0);
        expect(governor.status().backfill).toBe(0);
    });

    it('checks the cache before it asks the governor for anything', async () => {
        // A governor with no budget at all must not change the answer above:
        // "already cached" is decided first, so a covered corpus is free even
        // on a day the quota is gone.
        const io = fakeIO({
            async cached(hashes) {
                return new Map(hashes.map((h) => [h, new Set(['he', 'en', 'ar', 'ru', 'es'])]));
            }
        });
        const report = await runBackfill({
            io,
            governor: new Governor({ rpm: 0, rpd: 0, onDemandShare: 1 }),
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.stopped).toBe('done');
        expect(report.requests).toBe(0);
    });

    it('still fills a string that has only some of its five locales', async () => {
        const io = fakeIO({
            async cached(hashes) {
                return new Map(hashes.map((h) => [h, new Set(['he'])]));
            }
        });
        const engine = fakeEngine();
        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.alreadyCached).toBe(0);
        expect(engine.calls.length).toBeGreaterThan(0);
        // The identity row is already there, so the free pass writes none and
        // the four missing translations are what the request buys.
        expect(report.identityRows).toBe(0);
        expect(new Set(io.stored.filter((r) => r.engine === 'gemini').map((r) => r.tgtLang))).toEqual(
            new Set(['en', 'ar', 'ru', 'es'])
        );
    });
});

describe('spending', () => {
    it('buys all five locales in one request', async () => {
        const io = fakeIO();
        const engine = fakeEngine();
        await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState()
        });

        const targets = new Set(io.stored.filter((r) => r.engine === 'gemini').map((r) => r.tgtLang));
        expect([...targets].sort()).toEqual(['ar', 'en', 'es', 'ru']);
        expect(engine.calls).toHaveLength(1);
    });

    it('stamps hits 0 — the walk is not a reader waiting', async () => {
        const io = fakeIO();
        await runBackfill({
            io,
            governor: openGovernor(),
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(io.stored.every((r) => r.hits === 0)).toBe(true);
    });

    it('honours --locales', async () => {
        const io = fakeIO();
        await runBackfill({
            io,
            governor: openGovernor(),
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState(),
            locales: ['ru', 'es']
        });

        const targets = new Set(io.stored.map((r) => r.tgtLang));
        expect([...targets].sort()).toEqual(['es', 'ru']);
    });

    it('stops clean on the budget, with the cursor kept', async () => {
        const io = fakeIO({
            async query() {
                return corpus(40);
            }
        });
        const engine = fakeEngine();
        const state = emptyBackfillState();

        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state,
            budget: 1,
            batch: 2
        });

        expect(report.stopped).toBe('budget');
        expect(report.requests).toBe(1);
        expect(engine.calls).toHaveLength(1);
        expect(report.state.sources.openMission.page).toBeGreaterThanOrEqual(1);
    });

    it('stops clean when the governor refuses, and says why', async () => {
        const io = fakeIO({
            async query() {
                return corpus(40);
            }
        });
        // The reserve: a backfill may never eat the on-demand slice.
        const governor = new Governor({ rpm: 100, rpd: 10, onDemandShare: 1 });

        const report = await runBackfill({
            io,
            governor,
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState(),
            batch: 2
        });

        expect(report.stopped).toBe('governor');
        expect(report.reason).toBe('reserve');
        expect(report.requests).toBe(0);
    });

    it('counts a request the engine then failed — a sent request spent the quota', async () => {
        const io = fakeIO();
        const governor = openGovernor();
        const failing = async () => {
            throw new Error('502 from the model');
        };

        const report = await runBackfill({
            io,
            governor,
            engine: failing as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.stopped).toBe('error');
        expect(governor.status().backfill).toBe(1);
    });
});

describe('the guest demand log drives the order', () => {
    it('puts a string guests asked for at the front, even if the walk never found it', async () => {
        const io = fakeIO();
        const engine = fakeEngine();
        const wanted = 'טקסט שאורח ביקש ולא קיבל';

        await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState(),
            demand: [
                {
                    locale: 'es',
                    hash: hashSource(wanted),
                    source: wanted,
                    mode: 'translate',
                    count: 12,
                    seen: 1
                }
            ],
            batch: 1
        });

        expect(engine.calls[0]).toEqual([hashSource(wanted)]);
    });

    it('reports the (locale, hash) pairs it filled, so the log can be compacted', async () => {
        const io = fakeIO();
        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.covered.length).toBeGreaterThan(0);
        // A pair, not a bare hash: a Hebrew guest who missed a Hebrew string is
        // satisfied by the identity row, a Spanish guest reading it is not.
        for (const pair of report.covered) expect(pair).toMatch(/^(he|en|ar|ru|es) [0-9a-f]{32}$/);

        const hebrew = report.covered.filter((p) => p.startsWith('he '));
        const spanish = report.covered.filter((p) => p.startsWith('es '));
        expect(hebrew.length).toBeGreaterThan(0);
        expect(spanish.length).toBeGreaterThan(0);
    });

    it('covers only the locale an identity row actually answered', async () => {
        const io = fakeIO();
        // No engine: the free pass writes he→he and nothing else, so a Spanish
        // guest's demand for the same string must survive compaction.
        const report = await runBackfill({ io, governor: openGovernor(), enabled: all, state: emptyBackfillState() });

        expect(report.covered.length).toBeGreaterThan(0);
        expect(report.covered.every((p) => p.startsWith('he '))).toBe(true);
    });
});

describe('dry runs', () => {
    it('decide out loud and spend nothing', async () => {
        const io = fakeIO();
        const governor = openGovernor();
        const engine = fakeEngine();
        const lines: string[] = [];

        const report = await runBackfill({
            io,
            governor,
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState(),
            dry: true,
            log: (l) => lines.push(l)
        });

        expect(engine.calls).toHaveLength(0);
        expect(io.stored).toHaveLength(0);
        expect(governor.status().backfill).toBe(0);
        expect(report.requests).toBeGreaterThan(0); // what it *would* have cost
        expect(lines.some((l) => l.startsWith('[dry]'))).toBe(true);
    });
});

describe('failing soft', () => {
    it('keeps the demand-log work when the corpus query fails', async () => {
        const wanted = 'משהו שאורח ביקש';
        const io = fakeIO({
            async query() {
                throw new Error('Strapi is down');
            }
        });
        const engine = fakeEngine();

        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState(),
            demand: [
                { locale: 'ru', hash: hashSource(wanted), source: wanted, mode: 'translate', count: 1, seen: 1 }
            ]
        });

        expect(report.walked).toBe(0);
        expect(engine.calls).toHaveLength(1);
        expect(report.stopped).toBe('done');
    });

    it('stops rather than guessing when it cannot tell what is already cached', async () => {
        const io = fakeIO({
            async cached() {
                throw new Error('coverage query failed');
            }
        });
        const engine = fakeEngine();

        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: engine as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.stopped).toBe('error');
        expect(engine.calls).toHaveLength(0);
    });

    it('counts a failed store as rejected rather than losing the run', async () => {
        const io = fakeIO({
            async store() {
                throw new Error('cacheTranslations refused');
            }
        });
        const report = await runBackfill({
            io,
            governor: openGovernor(),
            engine: fakeEngine() as never,
            enabled: all,
            state: emptyBackfillState()
        });

        expect(report.rowsCreated).toBe(0);
        expect(report.rowsRejected).toBeGreaterThan(0);
    });
});

describe('the cursor', () => {
    it('advances a page when the page was full', () => {
        const cursor = { page: 1, pageCount: 5, passes: 0 };
        advance(cursor, 200, 200);
        expect(cursor).toMatchObject({ page: 2, passes: 0 });
    });

    it('wraps and counts a pass when the page was short', () => {
        const cursor = { page: 3, pageCount: 5, passes: 0 };
        advance(cursor, 12, 200);
        expect(cursor).toMatchObject({ page: 1, passes: 1 });
    });

    it('wraps at the last page even when it was exactly full', () => {
        const cursor = { page: 5, pageCount: 5, passes: 2 };
        advance(cursor, 200, 200);
        expect(cursor).toMatchObject({ page: 1, passes: 3 });
    });

    it('resumes where the last run stopped', async () => {
        const pages: Array<Record<string, unknown>> = [];
        const io = fakeIO({
            async query(_qid, variables) {
                pages.push(variables);
                return {
                    data: {
                        openMissions: {
                            data: corpus(200).data.openMissions.data,
                            meta: { pagination: { total: 1000 } }
                        }
                    }
                };
            }
        });
        const state = { sources: { openMission: { page: 3, pageCount: 5, passes: 0 } } };
        await runBackfill({ io, governor: openGovernor(), enabled: all, state });

        expect(pages[0].page).toBe(3);
        expect(state.sources.openMission.page).toBe(4);
    });
});
