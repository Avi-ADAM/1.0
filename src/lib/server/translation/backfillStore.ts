/**
 * The backfill cursor on disk (§8.1 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * `.translate-state/cursor.json`, in the same directory as the governor's day
 * counter, and in the same spirit as `.embed-cache/` next to
 * `sync-vocabulary.ts`: a run stops the moment its budget is gone, and
 * tomorrow's run picks up exactly where it stopped. That is the whole point of
 * the phase — weeks of free quota, one quantum a day, and the corpus is
 * covered without a paid call.
 *
 * Fails soft in both directions. An unreadable cursor means "start from the
 * beginning", which costs one wasted pass over already-cached strings (they
 * are skipped before the governor is consulted, so a wasted pass is cheap by
 * construction). An unwritable one means the next run repeats this one, which
 * is the same cost again. Neither is worth refusing to run over.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { emptyBackfillState, type BackfillState, type SourceCursor } from './backfill.js';

const FILE = 'cursor.json';

/** Read the cursor, or a fresh one. Never throws. */
export function loadBackfillState(dir: string): BackfillState {
    if (!dir) return emptyBackfillState();
    const path = join(dir, FILE);
    if (!existsSync(path)) return emptyBackfillState();

    try {
        const parsed = JSON.parse(readFileSync(path, 'utf8'));
        const sources: Record<string, SourceCursor> = {};
        for (const [key, raw] of Object.entries(parsed?.sources ?? {})) {
            const c = raw as Partial<SourceCursor>;
            // A hand-edited or half-written file must not become a cursor that
            // skips half the corpus in silence.
            const page = Number.isFinite(c?.page) && Number(c.page) >= 1 ? Math.floor(Number(c.page)) : 1;
            sources[key] = {
                page,
                pageCount: Number.isFinite(c?.pageCount) ? Number(c.pageCount) : null,
                passes: Number.isFinite(c?.passes) ? Number(c.passes) : 0,
                lastRun: typeof c?.lastRun === 'string' ? c.lastRun : undefined
            };
        }
        return { sources };
    } catch {
        return emptyBackfillState();
    }
}

/**
 * Write the cursor through a temp file, so a kill mid-write cannot truncate it
 * — the same guard `scripts/scheduler/scheduler.mjs` puts on its state.
 */
export function saveBackfillState(dir: string, state: BackfillState): boolean {
    if (!dir) return false;
    try {
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const path = join(dir, FILE);
        const tmp = `${path}.tmp`;
        writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
        renameSync(tmp, path);
        return true;
    } catch {
        return false;
    }
}
