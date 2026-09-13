/**
 * The dials of the UGC translation write path (§5.2 of
 * docs/PLAN_UGC_TRANSLATION.md) — read from the environment, in one place.
 *
 * Two rules this file exists to enforce:
 *
 * 1. **Nothing is hardcoded that Google can change.** Free-tier RPM/RPD numbers
 *    drift. Ship conservative defaults, log the 429s, tune the env — never bake
 *    a limit into a module that would then have to be redeployed to fix.
 * 2. **Off is the default.** `TRANSLATE_SURFACES` empty means the read path
 *    does not run and `TRANSLATE_WRITE` unset means no request can be bought.
 *    An operator turns P2 on deliberately, one surface at a time, which is the
 *    whole shape the phase was asked to have.
 *
 * `$env/dynamic/private`, not `$env/static/private` and not `process.env`:
 * `vite dev` does not fill `process.env` from `.env` (see the note on
 * `gemini-embeddings.ts`, which learned this the hard way), and dynamic env
 * lets an operator change a budget without a rebuild.
 */

import { env } from '$env/dynamic/private';

/**
 * Surface keys the read path knows about. See `surfaces.ts`.
 *
 * A surface is one *rendering* — a directory card and an entity's own page are
 * two keys even when they show the same entity, because they show different
 * strings (a 220-character excerpt vs. the whole description) and an operator
 * may reasonably want one on without the other.
 */
export type SurfaceKey =
    | 'availableMission'
    | 'missionDetail'
    | 'availableResource'
    | 'resourceDetail'
    | 'projectDirectory'
    | 'projectDetail'
    | 'productDirectory';

/** Every key, for `--status` and for validating what an operator typed. */
export const SURFACE_KEYS: SurfaceKey[] = [
    'availableMission',
    'missionDetail',
    'availableResource',
    'resourceDetail',
    'projectDirectory',
    'projectDetail',
    'productDirectory'
];

function num(raw: string | undefined, fallback: number): number {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

function flag(raw: string | undefined): boolean {
    return raw === '1' || raw === 'true' || raw === 'yes';
}

/**
 * Which surfaces may read the cache. Comma-separated keys, or `*` for all.
 *
 * Empty — the default — means the feature is entirely inert: no query, no
 * component change, no payload. Exactly today's behaviour, in every language.
 */
export function readSurfaces(): Set<string> {
    const raw = (env.TRANSLATE_SURFACES ?? '').trim();
    if (!raw) return new Set();
    if (raw === '*') return new Set(['*']);
    return new Set(
        raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    );
}

/** May this surface read the translation cache? */
export function readsCache(surface: SurfaceKey): boolean {
    const set = readSurfaces();
    return set.has('*') || set.has(surface);
}

/**
 * May `/api/translate/warm` spend a request?
 *
 * Deliberately separate from `TRANSLATE_SURFACES`: reading a cache someone
 * else filled costs nothing, and it is worth being able to run the read path
 * on a surface for a week before allowing it to buy anything.
 */
export function writeEnabled(): boolean {
    return flag(env.TRANSLATE_WRITE) && !!apiKey();
}

/** The Gemini key. Same two names the embeddings module already reads. */
export function apiKey(): string {
    return env.GEMINI_API_KEY || env.GOOGLE_API || '';
}

export interface TranslateLimits {
    /** Requests per minute ceiling. */
    rpm: number;
    /** Requests per day ceiling — the governor's whole budget. */
    rpd: number;
    /** Source strings packed into one request. */
    batch: number;
    /**
     * Share of the daily budget reserved for on-demand traffic, which the
     * backfill worker can never eat. Without it a backfill run makes the live
     * site's misses un-fillable for the rest of the day.
     */
    onDemandShare: number;
    /** Model id. Cheapest that handles he/ar reliably. */
    model: string;
}

/**
 * Conservative on purpose. These are not Google's published numbers — they are
 * numbers that cannot get the key rate-limited while the feature is proven on
 * one surface. Raise them in the env once the 429 log is quiet.
 */
export function limits(): TranslateLimits {
    const share = Number(env.TRANSLATE_ONDEMAND_SHARE);
    return {
        rpm: num(env.TRANSLATE_RPM, 10),
        rpd: num(env.TRANSLATE_RPD, 200),
        batch: num(env.TRANSLATE_BATCH, 25),
        onDemandShare: Number.isFinite(share) && share >= 0 && share <= 1 ? share : 0.3,
        model: env.TRANSLATE_MODEL || 'gemini-2.5-flash-lite'
    };
}

/**
 * Per-caller ceiling on `/api/translate/warm`, so one client cannot drain the
 * day (§5.3). A logged-in reader gets the larger allowance because they are
 * identified by their user id; an anonymous one is keyed by IP, which several
 * readers can share and one attacker can rotate.
 */
export interface WarmLimits {
    /** Requests per caller per rolling window. */
    perWindow: number;
    windowMs: number;
    /** Strings accepted in one warm call. */
    maxItems: number;
}

export function warmLimits(loggedIn: boolean): WarmLimits {
    return {
        perWindow: loggedIn ? num(env.TRANSLATE_WARM_RPM_USER, 6) : num(env.TRANSLATE_WARM_RPM_ANON, 2),
        windowMs: 60_000,
        maxItems: num(env.TRANSLATE_WARM_MAX_ITEMS, 25)
    };
}

/**
 * Directory for the governor's day counter, so a restart does not hand the
 * budget back (§5.3). Opt-in: on a filesystem-less deploy there is nowhere
 * honest to put it, and the governor falls back to memory rather than
 * pretending. See `governor.ts`.
 */
export function stateDir(): string {
    return (env.TRANSLATE_STATE_DIR ?? '').trim();
}
