/**
 * The backfill worker's core (§8 and §15 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * **What this is for, in one sentence.** A guest cannot fill the cache and
 * never will — they have no account, so they get `onDemand`, and only `always`
 * readers warm (§15.1). Letting them warm is refused, because an anonymous
 * public page is what a crawler walks and one crawl of `/availableMission`
 * would be a day's budget (§15.2). So the answer is to *have already paid*
 * before the guest arrives, quantum after quantum, out of a free quota. This
 * is that.
 *
 * All the I/O is injected. Everything here is a decision — what to fill next,
 * whether to spend, when to stop — and every decision is testable against a
 * fake, which is how `gemini.ts` is tested too.
 *
 * Four properties, and each one is a test:
 *
 * 1. **Idempotent.** A string already in the cache is skipped *before* the
 *    governor is consulted, so re-running costs nothing.
 * 2. **Budget-bounded, and it stops clean.** The moment the budget is gone the
 *    run ends with its cursor saved. Tomorrow picks it up. That is not a
 *    failure mode, it is the whole design: weeks of free quota, one quantum a
 *    day, and the corpus is covered without a paid call.
 * 3. **Identity rows first, and free.** `detect.ts` produces them with no
 *    engine request at all, and on a Hebrew-majority corpus read by a
 *    Hebrew-majority audience that is the single most common render on the
 *    site turning from a permanent miss into a hit, for nothing (§15.3.5).
 * 4. **Demand before corpus.** Strings guests actually asked for and did not
 *    get come first; the walk is what fills everything else (§15.3.3).
 */

import { hashSource } from '$lib/translation/normalize.js';
import { detectLang } from '$lib/translation/detect.js';
import { activeSources, stringsForNode, type BackfillSource } from './backfillSources.js';
import type { Governor } from './governor.js';
import type { TranslateEngine } from './gemini.js';
import { fillTranslations, type FillInput } from './fill.js';
import type { DemandEntry } from './demand.js';
import type { SurfaceKey } from './config.js';
import type { Locale, TranslatableString, TranslationMode } from '$lib/translation/types.js';
import type { CacheRowInput } from '$lib/server/actions/configs/cacheTranslations.js';

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];

/** Hashes asked about in one cache-existence query. */
export const HASHES_PER_CHECK = 200;

/** One candidate string, with the demand that put it at the front of the queue. */
export interface Candidate {
    hash: string;
    source: string;
    mode: TranslationMode;
    /** `openMission.descrip` — stored as `firstSeenOn`, never part of a key. */
    path?: string;
    /** Sum of guest asks from the demand log. 0 for a string only the walk found. */
    demand: number;
}

/** Everything the worker needs from the outside world. */
export interface BackfillIO {
    /** Run one of the corpus qids. Rejects on transport failure. */
    query(qid: string, variables: Record<string, unknown>): Promise<unknown>;
    /**
     * Which of these hashes already have a cache row, and for which target.
     * Returns `hash -> set of tgtLang`. A hash absent from the map has nothing.
     */
    cached(hashes: string[]): Promise<Map<string, Set<string>>>;
    /** Store rows. Must go through `cacheTranslations`, which validates them. */
    store(rows: CacheRowInput[]): Promise<{ created: number; skipped: number; rejected: number }>;
}

/** Per-source cursor. Plain JSON, written beside the governor's day counter. */
export interface SourceCursor {
    page: number;
    pageCount: number | null;
    /** How many times the walk has wrapped around the whole corpus. */
    passes: number;
    lastRun?: string;
}

export interface BackfillState {
    sources: Record<string, SourceCursor>;
}

export function emptyBackfillState(): BackfillState {
    return { sources: {} };
}

export interface BackfillOptions {
    io: BackfillIO;
    governor: Governor;
    /** Absent ⇒ identity rows only. That path needs no API key and no quota. */
    engine?: TranslateEngine;
    /** Is this surface reading the cache? Sources whose surfaces are all off are skipped. */
    enabled: (surface: SurfaceKey) => boolean;
    state: BackfillState;
    /** Outstanding guest misses, most-wanted first. */
    demand?: DemandEntry[];
    /** Max engine requests this run may make, on top of whatever the governor allows. */
    budget?: number;
    /** Source strings per engine request. */
    batch?: number;
    /** Rows fetched per corpus page. */
    pageSize?: number;
    /** Restrict to these source keys. */
    only?: string[];
    /** Restrict the targets bought. Defaults to all five — one request buys them all (§5.1). */
    locales?: Locale[];
    model?: string;
    /** Decide out loud, spend nothing, write nothing. */
    dry?: boolean;
    log?: (line: string) => void;
}

export interface BackfillReport {
    /** Nodes read out of the corpus. */
    walked: number;
    /** Distinct strings considered. */
    considered: number;
    /** Already complete in the cache — skipped before the governor was asked. */
    alreadyCached: number;
    /** Identity rows written. Free: no engine request. */
    identityRows: number;
    /** Engine requests actually spent. */
    requests: number;
    rowsCreated: number;
    rowsSkipped: number;
    rowsRejected: number;
    /** Hashes the engine returned nothing usable for. */
    unfilled: number;
    /** Why the run ended. `done` = the corpus and the demand log are covered. */
    stopped: 'done' | 'budget' | 'governor' | 'no-engine' | 'no-sources' | 'error';
    /** The governor's refusal, when that is what ended it. */
    reason?: string;
    /**
     * `${tgtLang} ${hash}` for every pair this run put in the cache — what the
     * demand log is compacted against.
     *
     * A *pair*, not a hash, because a demand entry is a pair: a Hebrew guest
     * who missed a Hebrew string is satisfied by an identity row, while a
     * Spanish guest who missed the same string is not, and dropping both would
     * lose the second one's signal.
     *
     * Slightly optimistic by design — `cacheTranslations` may still reject a
     * row after this counts it. That costs *priority*, never the fill: the
     * string is still in the corpus and the next walk reaches it.
     */
    covered: string[];
    state: BackfillState;
}

const noop = () => {};

/**
 * Run one budget-bounded pass.
 *
 * Never throws for an ordinary failure: a refused batch, an engine error, a
 * store rejection are all reported and the run continues or stops cleanly.
 * A page render is unaffected either way — this process is not on anyone's
 * critical path, and the site renders source text for everything it did not
 * get to.
 */
export async function runBackfill(opts: BackfillOptions): Promise<BackfillReport> {
    const {
        io,
        governor,
        engine,
        enabled,
        state,
        demand = [],
        budget = Infinity,
        batch = 25,
        pageSize = 200,
        only,
        locales = LOCALES,
        model,
        dry = false,
        log = noop
    } = opts;

    const report: BackfillReport = {
        walked: 0,
        considered: 0,
        alreadyCached: 0,
        identityRows: 0,
        requests: 0,
        rowsCreated: 0,
        rowsSkipped: 0,
        rowsRejected: 0,
        unfilled: 0,
        stopped: 'done',
        covered: [],
        state
    };

    const sources = activeSources(enabled, only);
    if (sources.length === 0) {
        report.stopped = 'no-sources';
        log('no source feeds an enabled surface — nothing to fill (check TRANSLATE_SURFACES)');
        return report;
    }

    // ── the queue ───────────────────────────────────────────────────────────
    // Demand first (§8.2 tier 1: somebody actually asked and got source text),
    // then the corpus walk. Both are deduplicated into one list so a string
    // that appears in both is considered once.
    const queue = new Map<string, Candidate>();

    for (const entry of demand) {
        const hash = entry?.hash || (entry?.source ? hashSource(entry.source) : '');
        if (!hash || !entry?.source) continue;
        const existing = queue.get(hash);
        if (existing) {
            existing.demand += entry.count ?? 1;
            continue;
        }
        queue.set(hash, {
            hash,
            source: entry.source,
            mode: entry.mode === 'transliterate' ? 'transliterate' : 'translate',
            path: entry.path,
            demand: entry.count ?? 1
        });
    }
    const fromDemand = queue.size;
    if (fromDemand > 0) log(`${fromDemand} string(s) from the guest demand log go first`);

    // ── the walk ────────────────────────────────────────────────────────────
    for (const source of sources) {
        const cursor = (state.sources[source.key] ??= { page: 1, pageCount: null, passes: 0 });
        let res: unknown;
        try {
            res = await io.query(source.qid, { page: cursor.page, pageSize });
        } catch (err) {
            // A corpus query that fails costs nothing and must not lose the
            // work already queued from the demand log.
            log(`[${source.key}] corpus query failed: ${err instanceof Error ? err.message : err}`);
            continue;
        }

        const rows = source.rowsOf(res);
        const total = source.totalOf(res);
        cursor.pageCount = total == null ? cursor.pageCount : Math.max(1, Math.ceil(total / pageSize));
        cursor.lastRun = new Date().toISOString();

        for (const node of rows) {
            report.walked++;
            for (const s of stringsForNode(source, node, enabled)) {
                if (queue.has(s.hash)) continue;
                queue.set(s.hash, {
                    hash: s.hash,
                    source: s.source,
                    mode: s.mode,
                    path: s.path,
                    demand: 0
                });
            }
        }

        const readPage = cursor.page;
        advance(cursor, rows.length, pageSize);
        log(
            `[${source.key}] page ${readPage}${cursor.pageCount ? ` of ${cursor.pageCount}` : ''}` +
                ` — ${rows.length} row(s); next run resumes at page ${cursor.page}` +
                (cursor.passes ? ` (pass ${cursor.passes + 1})` : '')
        );
    }

    const candidates = [...queue.values()].sort((a, b) => b.demand - a.demand);
    report.considered = candidates.length;
    if (candidates.length === 0) return report;

    // ── what is already there ───────────────────────────────────────────────
    // Idempotence lives here, and it is checked before the governor is asked
    // anything at all: re-running a covered corpus must cost zero requests.
    const have = new Map<string, Set<string>>();
    for (let i = 0; i < candidates.length; i += HASHES_PER_CHECK) {
        const slice = candidates.slice(i, i + HASHES_PER_CHECK).map((c) => c.hash);
        try {
            for (const [hash, targets] of await io.cached(slice)) have.set(hash, targets);
        } catch (err) {
            // Not knowing what is cached means every row would be re-sent to
            // the engine and then skipped by the store — quota for nothing.
            log(`cache check failed, stopping: ${err instanceof Error ? err.message : err}`);
            report.stopped = 'error';
            return report;
        }
    }

    const outstanding: Candidate[] = [];
    for (const c of candidates) {
        const targets = have.get(c.hash);
        if (targets && locales.every((l) => targets.has(l))) {
            report.alreadyCached++;
            continue;
        }
        outstanding.push(c);
    }
    log(`${report.alreadyCached} already cached, ${outstanding.length} outstanding`);
    if (outstanding.length === 0) return report;

    // ── identity rows: free, and first ──────────────────────────────────────
    const identityRows: CacheRowInput[] = [];
    for (const c of outstanding) {
        const lang = detectLang(c.source).lang;
        if (lang === 'unknown' || !locales.includes(lang)) continue;
        if (have.get(c.hash)?.has(lang)) continue;
        identityRows.push({
            hash: c.hash,
            srcLang: lang,
            tgtLang: lang,
            source: c.source,
            text: c.source,
            mode: c.mode,
            engine: 'identity',
            model: null,
            hits: c.demand > 0 ? 1 : 0,
            firstSeenOn: c.path ?? null
        });
    }

    if (identityRows.length > 0) {
        log(`${identityRows.length} identity row(s) — no engine request, no quota`);
        if (!dry) {
            const stored = await storeAll(io, identityRows, log);
            report.identityRows = stored.created;
            report.rowsCreated += stored.created;
            report.rowsSkipped += stored.skipped;
            report.rowsRejected += stored.rejected;
            for (const row of identityRows) report.covered.push(`${row.tgtLang} ${row.hash}`);
        } else {
            report.identityRows = identityRows.length;
        }
    }

    // ── the engine pass ─────────────────────────────────────────────────────
    if (!engine) {
        report.stopped = 'no-engine';
        log('no engine configured — identity rows only (set TRANSLATE_WRITE=1 and a Gemini key to buy translations)');
        return report;
    }

    // A string whose only missing target was its own language is done: the
    // identity row above covered it, and asking the engine would buy nothing.
    const needEngine = outstanding.filter((c) => {
        const detected = detectLang(c.source).lang;
        const covered = new Set(have.get(c.hash) ?? []);
        if (detected !== 'unknown') covered.add(detected);
        return !locales.every((l) => covered.has(l));
    });
    log(`${needEngine.length} string(s) need the engine`);

    for (let i = 0; i < needEngine.length; i += batch) {
        if (report.requests >= budget) {
            report.stopped = 'budget';
            log(`budget of ${budget} request(s) spent — stopping clean`);
            break;
        }

        // Counted before the request is sent: one that fails still consumed
        // the quota, and a governor that only counts successes overspends.
        const decision = dry ? { ok: true, reason: undefined } : governor.spend('backfill', 1);
        if (!decision.ok) {
            report.stopped = 'governor';
            report.reason = decision.reason;
            log(`governor says no (${decision.reason}) — stopping clean, the cursor is saved`);
            break;
        }

        const slice = needEngine.slice(i, i + batch);
        report.requests++;
        if (dry) {
            log(`[dry] would translate ${slice.length} string(s) into ${locales.join(',')}`);
            continue;
        }

        const inputs: FillInput[] = slice.map((c) => ({
            source: c.source,
            mode: c.mode,
            firstSeenOn: c.path
        }));

        let filled: Awaited<ReturnType<typeof fillTranslations>>;
        try {
            filled = await fillTranslations(inputs, {
                engine,
                targets: locales,
                model,
                // The walk is not a reader waiting; the demand log is what
                // carries "somebody asked" now, so `hits` stays 0 here (§8.2).
                hits: 0
            });
        } catch (err) {
            // Transport failure. The request is already counted, which is
            // correct, and stopping is right: whatever broke will break again
            // in a hundred milliseconds and eat the rest of the day's budget.
            log(`engine failed, stopping: ${err instanceof Error ? err.message : err}`);
            report.stopped = 'error';
            break;
        }

        report.unfilled += filled.unfilled.length;
        if (filled.rows.length === 0) continue;

        const stored = await storeAll(io, filled.rows, log);
        report.rowsCreated += stored.created;
        report.rowsSkipped += stored.skipped;
        report.rowsRejected += stored.rejected;
        for (const row of filled.rows) report.covered.push(`${row.tgtLang} ${row.hash}`);
    }

    return report;
}

/**
 * Move the cursor to the next page, wrapping when the corpus runs out.
 *
 * Wrapping rather than stopping forever is deliberate: the corpus grows, and
 * an edited description is a *new* string (content addressing, §2.2). A walker
 * that finished once and never looked again would leave every future mission
 * untranslated until someone remembered to reset it.
 */
export function advance(cursor: SourceCursor, rowsRead: number, pageSize: number): void {
    const lastPage = rowsRead < pageSize || (cursor.pageCount != null && cursor.page >= cursor.pageCount);
    if (lastPage) {
        cursor.page = 1;
        cursor.passes = (cursor.passes ?? 0) + 1;
    } else {
        cursor.page += 1;
    }
}

/** Store in cap-sized chunks, never letting one bad chunk lose the rest. */
async function storeAll(
    io: BackfillIO,
    rows: CacheRowInput[],
    log: (line: string) => void
): Promise<{ created: number; skipped: number; rejected: number }> {
    const out = { created: 0, skipped: 0, rejected: 0 };
    const CHUNK = 300;
    for (let i = 0; i < rows.length; i += CHUNK) {
        try {
            const res = await io.store(rows.slice(i, i + CHUNK));
            out.created += res.created ?? 0;
            out.skipped += res.skipped ?? 0;
            out.rejected += res.rejected ?? 0;
        } catch (err) {
            out.rejected += Math.min(CHUNK, rows.length - i);
            log(`store failed for one chunk: ${err instanceof Error ? err.message : err}`);
        }
    }
    return out;
}
