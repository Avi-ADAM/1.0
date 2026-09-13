/**
 * A file-backed store for the governor's day counter (§5.3 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * Opt-in through `TRANSLATE_STATE_DIR`, and off by default. A serverless
 * deploy has nowhere honest to keep this, and a governor that *believes* it
 * persisted its budget while writing into a container that is about to vanish
 * is worse than one that plainly says it is per-process: the first overspends
 * quietly, the second is a number an operator can set `TRANSLATE_RPD` against.
 *
 * Same spirit as the backfill worker's `.translate-state/cursor.json` (P3),
 * and it will read the same directory.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GovernorState, GovernorStore } from './governor.js';

const FILE = 'quota.json';

/**
 * `null` when no directory is configured — the governor then keeps its counter
 * in memory for the life of the process, which is the documented default.
 */
export function fileGovernorStore(dir: string): GovernorStore | undefined {
    if (!dir) return undefined;

    const path = join(dir, FILE);

    return {
        load(): GovernorState | null {
            if (!existsSync(path)) return null;
            const parsed = JSON.parse(readFileSync(path, 'utf8'));
            // A hand-edited or half-written file must not become a budget.
            if (
                typeof parsed?.day !== 'string' ||
                typeof parsed?.onDemand !== 'number' ||
                typeof parsed?.backfill !== 'number'
            ) {
                return null;
            }
            return {
                day: parsed.day,
                onDemand: parsed.onDemand,
                backfill: parsed.backfill,
                recent: Array.isArray(parsed.recent) ? parsed.recent.filter((t: unknown) => typeof t === 'number') : []
            };
        },

        save(state: GovernorState): void {
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            writeFileSync(path, JSON.stringify(state), 'utf8');
        }
    };
}
