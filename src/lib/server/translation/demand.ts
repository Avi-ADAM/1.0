/**
 * The guest demand log (§15.3 of docs/PLAN_UGC_TRANSLATION.md) — the piece
 * without which the backfill's priority queue is blind to exactly the readers
 * P3 exists for.
 *
 * **Why it has to exist.** `hits` on a cache row is stamped only by
 * `/api/translate/warm`, and only `always` readers warm. A guest is
 * `onDemand` by construction — no account, no preference — so a guest never
 * calls warm, never stamps anything, and §8.2's first tier ("somebody actually
 * asked for this") cannot see them at all. Yet the read path already knows
 * both halves of the signal on every page load: which strings missed, and what
 * locale the reader wanted them in. This records that, and nothing else.
 *
 * **Where it is stored, and why not Strapi.** §15.3 left this open between a
 * `translation-demand` collection and a placeholder row in `text-translation`.
 * It is neither: it is a JSONL file in `TRANSLATE_STATE_DIR`, beside the
 * governor's day counter, for three reasons.
 *
 *   1. A placeholder row in `text-translation` would have to be filtered out
 *      of every cache read, and a read path that has to ignore some of its own
 *      rows is how a half-translated page ships.
 *   2. A new collection means a Strapi deploy and two permission grants before
 *      a single line of this phase can run — and it would put a *write* in
 *      front of a page render, which §4.1 forbids outright.
 *   3. The consumer is the backfill worker, which runs on the same box. The
 *      governor already accepts exactly this limit (per-process, opt-in, and
 *      honest about it) for exactly this reason.
 *
 * The cost of the file is that a multi-instance deploy logs demand per
 * instance, and demand seen on an instance the worker does not run on is lost.
 * That loses *ordering information*, never correctness: an unlogged string is
 * still walked and still filled, just later. A collection is the upgrade when
 * that starts to matter, and `readDemand` is the only thing that would change.
 *
 * Nothing here is ever on the critical path: `record()` writes to memory and
 * returns, and the flush is deferred.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale, TranslatableString, TranslationMode } from '$lib/translation/types.js';

const FILE = 'demand.jsonl';

/** One string a reader wanted in one locale and did not get. */
export interface DemandEntry {
    /** The locale the reader was reading in — the whole point of §15.3.4. */
    locale: Locale;
    hash: string;
    /**
     * The source text. Without it the worker could not fill the row: nothing
     * can turn a hash back into the string it was made from.
     */
    source: string;
    mode: TranslationMode;
    /** `openMission.descrip` — telemetry, and the `firstSeenOn` of the row. */
    path?: string;
    /** How many times it was asked for since the last compaction. */
    count: number;
    /** Epoch-ms of the most recent ask. */
    seen: number;
}

/**
 * Distinct (locale, hash) pairs held in memory between flushes.
 *
 * A cap rather than unbounded growth: a crawler walking a large directory can
 * produce thousands of misses a minute, and a demand log that can exhaust the
 * server's memory is a worse bug than the ordering it was meant to improve.
 * Past the cap new pairs are dropped — the strings are still walked by the
 * backfill, they simply do not jump the queue.
 */
export const MAX_BUFFERED = 4000;

/** Deferred rather than immediate, so one page load never pays for the write. */
export const FLUSH_AFTER_MS = 30_000;

/** Above this the file is rewritten aggregated instead of appended to. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

const pairKey = (locale: string, hash: string) => `${locale} ${hash}`;

/**
 * An in-process buffer that spills to a file.
 *
 * Injectable clock and directory so the whole thing is testable without a real
 * timer or a real filesystem.
 */
export class DemandLog {
    private dir: string;
    private now: () => number;
    private buffer = new Map<string, DemandEntry>();
    private timer: ReturnType<typeof setTimeout> | null = null;
    private dropped = 0;

    constructor(dir: string, opts: { now?: () => number } = {}) {
        this.dir = dir ?? '';
        this.now = opts.now ?? (() => Date.now());
    }

    /**
     * Record that `strings` were wanted in `locale` and missed.
     *
     * Synchronous, allocation-only, and never throws. Callers pass the strings
     * they already collected — this does no work of its own.
     */
    record(
        locale: Locale,
        strings: Array<Pick<TranslatableString, 'hash' | 'source' | 'mode' | 'path'>>
    ): void {
        if (!locale || !Array.isArray(strings) || strings.length === 0) return;
        const seen = this.now();

        for (const s of strings) {
            if (!s?.hash || typeof s.source !== 'string' || !s.source) continue;
            const key = pairKey(locale, s.hash);
            const existing = this.buffer.get(key);
            if (existing) {
                existing.count++;
                existing.seen = seen;
                continue;
            }
            if (this.buffer.size >= MAX_BUFFERED) {
                this.dropped++;
                continue;
            }
            this.buffer.set(key, {
                locale,
                hash: s.hash,
                source: s.source,
                mode: s.mode === 'transliterate' ? 'transliterate' : 'translate',
                path: s.path,
                count: 1,
                seen
            });
        }

        this.schedule();
    }

    /** What is buffered right now. The in-memory reader, for a same-process cron. */
    snapshot(): DemandEntry[] {
        return [...this.buffer.values()].map((e) => ({ ...e }));
    }

    /** Pairs dropped at the cap since the last flush — a log line, not an error. */
    droppedCount(): number {
        return this.dropped;
    }

    private schedule(): void {
        if (this.timer || !this.dir) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.flush();
        }, FLUSH_AFTER_MS);
        // Never hold the process open for a telemetry write.
        (this.timer as { unref?: () => void }).unref?.();
    }

    /**
     * Append the buffer to the file and clear it.
     *
     * Fails soft in both directions: an unwritable directory costs the
     * ordering hint and nothing else, and the buffer is cleared either way so
     * a permanently broken path cannot turn into a memory leak.
     */
    flush(): number {
        // With nowhere to write, the buffer *is* the log — draining it would
        // throw away the only copy. A same-process reader still gets it from
        // `snapshot()`; nothing schedules this call in that mode anyway.
        if (!this.dir) return 0;

        const entries = [...this.buffer.values()];
        this.buffer.clear();
        const dropped = this.dropped;
        this.dropped = 0;
        if (entries.length === 0) return 0;

        try {
            if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
            const path = join(this.dir, FILE);

            // Compact before appending, not after: a file that has already
            // grown past the cap must not grow further in the same flush.
            if (existsSync(path) && statSync(path).size > MAX_FILE_BYTES) {
                compactDemand(this.dir, () => true);
            }

            appendFileSync(path, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
            if (dropped > 0) {
                console.warn(
                    `[translation] demand log dropped ${dropped} pair(s) at the ${MAX_BUFFERED} cap`
                );
            }
            return entries.length;
        } catch (err) {
            console.warn(
                '[translation] demand log could not be written — backfill will fall back to walk order:',
                err instanceof Error ? err.message : err
            );
            return 0;
        }
    }
}

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/**
 * Read the log back, aggregated by (locale, hash) and ordered by demand.
 *
 * Ordering is `count` first, then recency: a string thirty readers wanted last
 * week outranks one reader wanted an hour ago, and between equals the fresher
 * one wins. Malformed lines are skipped rather than fatal — this file is
 * appended to by a live server and may be read mid-write.
 */
export function readDemand(dir: string): DemandEntry[] {
    if (!dir) return [];
    const path = join(dir, FILE);
    if (!existsSync(path)) return [];

    let raw = '';
    try {
        raw = readFileSync(path, 'utf8');
    } catch {
        return [];
    }

    const merged = new Map<string, DemandEntry>();
    for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        let parsed: unknown;
        try {
            parsed = JSON.parse(line);
        } catch {
            continue;
        }
        const e = parsed as Partial<DemandEntry>;
        if (!isLocale(e.locale) || typeof e.hash !== 'string' || !e.hash) continue;
        if (typeof e.source !== 'string' || !e.source) continue;

        const key = pairKey(e.locale, e.hash);
        const count = Number.isFinite(e.count) ? Number(e.count) : 1;
        const seen = Number.isFinite(e.seen) ? Number(e.seen) : 0;
        const existing = merged.get(key);
        if (existing) {
            existing.count += count;
            if (seen > existing.seen) existing.seen = seen;
            continue;
        }
        merged.set(key, {
            locale: e.locale,
            hash: e.hash,
            source: e.source,
            mode: e.mode === 'transliterate' ? 'transliterate' : 'translate',
            path: typeof e.path === 'string' ? e.path : undefined,
            count,
            seen
        });
    }

    return [...merged.values()].sort((a, b) => b.count - a.count || b.seen - a.seen);
}

/**
 * Which locales guests actually arrive in, most-wanted first (§15.3.4).
 *
 * The backfill buys every locale in one request either way (§5.1), so this
 * does not change what a request costs — it changes which *strings* are worth
 * a request, and it is the honest answer to "which language is this corpus
 * failing right now".
 */
export function demandByLocale(entries: DemandEntry[]): Array<{ locale: Locale; count: number }> {
    const totals = new Map<Locale, number>();
    for (const e of entries ?? []) {
        if (!isLocale(e?.locale)) continue;
        totals.set(e.locale, (totals.get(e.locale) ?? 0) + (Number.isFinite(e.count) ? e.count : 1));
    }
    return [...totals]
        .map(([locale, count]) => ({ locale, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Rewrite the file with only the entries `keep` accepts, aggregated.
 *
 * The worker calls this after a run with "keep what is still not cached", so
 * the log stays a list of *outstanding* demand rather than a growing history.
 */
export function compactDemand(dir: string, keep: (e: DemandEntry) => boolean): number {
    if (!dir) return 0;
    const kept = readDemand(dir).filter(keep);
    try {
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(
            join(dir, FILE),
            kept.length ? kept.map((e) => JSON.stringify(e)).join('\n') + '\n' : '',
            'utf8'
        );
    } catch {
        // Same rule as everywhere in this file: telemetry never takes anything down.
    }
    return kept.length;
}

/**
 * The log the running server writes to, shared across requests in this process.
 *
 * `null` when `TRANSLATE_STATE_DIR` is unset — the same opt-in the governor's
 * day counter has, and for the same reason: a deploy with no writable disk has
 * nowhere honest to put this, and a log that silently vanishes with the
 * container is worse than one that plainly is not there.
 */
let singleton: DemandLog | null = null;

export function serverDemandLog(dir: string): DemandLog | null {
    if (!dir) return null;
    if (!singleton) singleton = new DemandLog(dir);
    return singleton;
}

/** Tests build their own; this drops the shared one. */
export function resetServerDemandLog(): void {
    singleton = null;
}
