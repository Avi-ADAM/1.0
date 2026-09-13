/**
 * Per-surface read wiring for the UGC translation cache (§7 of
 * docs/PLAN_UGC_TRANSLATION.md).
 *
 * One place, so the P4 rollout is entries in this file rather than translation
 * logic sprinkled through loaders, and so every surface obeys the same rules:
 * the env flag, the reader's preference, one batched query, misses render
 * source.
 *
 * **What gets hashed is what gets rendered.** The mission cards show
 * `excerpt` — plain text pulled out of the tiptap HTML in `descrip` and
 * trimmed — not `descrip` itself, and the cache is content-addressed, so those
 * are two different strings. Translating the raw HTML would be the wrong
 * answer twice over: the validator strips markup precisely because a model
 * that is handed tags invents more of them, and the reader would still be
 * shown the excerpt. So the card's own text is what is looked up here, and the
 * full description gets its own row on the mission's own page in P4. Content
 * addressing means the two coexist at the cost of one extra row, and the
 * excerpt row is the one an anonymous reader actually needs.
 */

import { readsCache, stateDir, type SurfaceKey } from './config.js';
import { readTranslationCache } from './store.js';
import { serverDemandLog } from './demand.js';
import { collect } from '$lib/translation/collect.js';
import { plainForTranslation } from '$lib/translation/richText.js';
import type {
    AutoTranslatePref,
    Locale,
    TranslatableString,
    TranslationPayload
} from '$lib/translation/types.js';

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/**
 * How many missed strings a page hands back for warming.
 *
 * One warm call buys one request, and one request carries `TRANSLATE_BATCH`
 * strings — so shipping more than that to the client is payload nobody can
 * spend. The cap is what keeps `pending` from doubling the weight of a list
 * page on a cold cache.
 */
export const MAX_PENDING = 25;

export interface SurfaceTranslations {
    /** Hits keyed by source hash — what `<Translated>` reads. */
    translations: TranslationPayload | null;
    /**
     * The missed strings themselves, capped. The client posts these to
     * `/api/translate/warm`; hashes alone would be useless, because nothing can
     * resolve a hash back to the text it was made from.
     */
    pending: TranslatableString[];
}

const OFF: SurfaceTranslations = { translations: null, pending: [] };

/**
 * Read the cache for one surface.
 *
 * Returns `OFF` — no query at all — when the surface is not enabled or the
 * locale is unknown. Never throws: `readTranslationCache` already fails soft,
 * and a translation lookup must not be able to take a page down.
 */
export async function translateSurface(
    surface: SurfaceKey,
    groups: Record<string, unknown[]>,
    locale: unknown,
    fetch: typeof globalThis.fetch,
    pref?: unknown
): Promise<SurfaceTranslations> {
    if (!isLocale(locale) || !readsCache(surface)) return OFF;

    // `off` costs the reader nothing — not even one extra round-trip (§4.4).
    // The preference reaches the server as a plain cookie because this
    // decision has to be made before anything is fetched, and localStorage is
    // invisible here. An absent cookie means the default, `onDemand`.
    const reader: AutoTranslatePref = pref === 'off' || pref === 'always' ? pref : 'onDemand';
    if (reader === 'off') return OFF;

    const strings = collect(groups as never);
    if (strings.length === 0) return OFF;

    const payload = await readTranslationCache(strings, locale, { fetch, pref: reader });

    const missed = new Set(payload.misses);
    const missedStrings = strings.filter((s) => missed.has(s.hash));

    // The guest demand log (§15.3.3). This is the only place on the site that
    // can see what an anonymous reader wanted and did not get: a guest is
    // `onDemand` by construction and never calls the warm endpoint, so `hits`
    // on a cache row can never carry their signal. Recorded in full — not
    // capped at MAX_PENDING, which bounds a *payload*, not what the backfill's
    // priority queue is allowed to know.
    //
    // In-memory and deferred, never a write in front of a render (§4.1), and
    // silently absent unless `TRANSLATE_STATE_DIR` gives it somewhere honest
    // to live.
    if (missedStrings.length > 0) {
        serverDemandLog(stateDir())?.record(locale, missedStrings);
    }

    const pending = missedStrings.slice(0, MAX_PENDING);

    return { translations: payload, pending };
}

/**
 * `/availableMission` — the public open-missions directory, and the first
 * surface P2 turns on. Highest anonymous reader count on the site, and the one
 * where a wall of Hebrew costs the most.
 *
 * @param cards `MissionCard[]` from `normalizeMissionCard`
 */
export function missionCardGroups(cards: unknown[]): Record<string, unknown[]> {
    const list = Array.isArray(cards) ? cards : [];
    return {
        openMission: list.map((c) => {
            const card = c as { id?: unknown; name?: unknown; excerpt?: unknown };
            return { id: card.id, name: card.name, descrip: card.excerpt };
        }),
        // The rikma's name is repeated across every card it owns; the collector
        // deduplicates by hash, so a directory of 200 missions from 30 rikmot
        // asks about 30 names, not 200.
        project: list.map((c) => {
            const card = c as { projectId?: unknown; projectName?: unknown };
            return { id: card.projectId, projectName: card.projectName };
        })
    };
}

/**
 * `/availableMission/[id]` — one mission's own page (§7.1, and the P4 note in
 * this file's header about the full description finally getting its own row).
 *
 * Two things it does that the directory does not:
 *
 * 1. **The whole description, not the 220-character excerpt.** The card row and
 *    the page row are two different strings and therefore two different hashes;
 *    content addressing lets them coexist at the cost of one extra row, and
 *    this is the one a reader who opened the mission actually reads.
 * 2. **`descrip` and `hearotMeyuchadot` are tiptap HTML.** The cache stores
 *    plain text on purpose — the validator strips markup precisely because a
 *    model handed tags invents more of them — so what is hashed here is the
 *    plain-text rendering, and the page hashes the same rendering through the
 *    same helper. A reader who taps "show original" gets the formatted HTML
 *    back untouched; nothing is destroyed, only the *translated* view is flat.
 */
export function missionDetailGroups(mission: unknown): Record<string, unknown[]> {
    const node = mission as { id?: unknown; attributes?: Record<string, any> } | null;
    const a = node?.attributes;
    if (!a) return {};

    const project = a.project?.data;

    return {
        openMission: [
            {
                id: node?.id,
                name: a.name,
                descrip: plainForTranslation(a.descrip),
                hearotMeyuchadot: plainForTranslation(a.hearotMeyuchadot)
            }
        ],
        project: [{ id: project?.id, projectName: project?.attributes?.projectName }]
    };
}

/**
 * `/availiableResorce` — the public requested-resources directory. Same card
 * contract as the missions directory: the name, the rikma's name, and the
 * 220-character `excerpt` the card actually renders.
 *
 * @param cards `ResourceCard[]` from `normalizeResourceCard`
 */
export function resourceCardGroups(cards: unknown[]): Record<string, unknown[]> {
    const list = Array.isArray(cards) ? cards : [];
    return {
        openMashaabim: list.map((c) => {
            const card = c as { id?: unknown; name?: unknown; excerpt?: unknown };
            return { id: card.id, name: card.name, descrip: card.excerpt };
        }),
        project: list.map((c) => {
            const card = c as { projectId?: unknown; projectName?: unknown };
            return { id: card.projectId, projectName: card.projectName };
        })
    };
}

/**
 * `/availiableResorce/[id]` — one requested resource's own page.
 *
 * Unlike a mission, a resource's `descrip` is rendered **as plain text** — the
 * page prints it inside a `<p>`, not through RichText — so the string hashed
 * here is the raw field, not a flattening of it. What gets hashed is what gets
 * rendered; `collect()` normalizes whitespace on both sides of that contract.
 *
 * @param node `{ id, attributes }` — the loader's `alld` wrapped with its id
 */
export function resourceDetailGroups(node: unknown): Record<string, unknown[]> {
    const n = node as { id?: unknown; attributes?: Record<string, any> } | null;
    const a = n?.attributes;
    if (!a) return {};

    const project = a.project?.data;
    return {
        openMashaabim: [{ id: n?.id, name: a.name, descrip: a.descrip }],
        project: project ? [{ id: project.id, projectName: project.attributes?.projectName }] : []
    };
}

/**
 * `/project` — the public rikma directory. The card shows the rikma's name and
 * an excerpt of `publicDescription`, already flattened by `normalizeProjectCard`.
 *
 * @param cards `ProjectCard[]` from `normalizeProjectCard`
 */
export function projectCardGroups(cards: unknown[]): Record<string, unknown[]> {
    const list = Array.isArray(cards) ? cards : [];
    return {
        project: list.map((c) => {
            const card = c as { id?: unknown; name?: unknown; description?: unknown };
            return { id: card.id, projectName: card.name, publicDescription: card.description };
        })
    };
}

/**
 * `/project/[id]` — a rikma's public page.
 *
 * Three kinds of string, each exactly as the page renders it:
 *
 * - `publicDescription` — tiptap HTML, flattened by `plainForTranslation`, the
 *   same helper the page hashes with (§12). The formatted original stays one
 *   tap away.
 * - the open missions' names — the same filtered list `49GetProjectById`
 *   returns. The directory and the mission pages already buy these strings, so
 *   on a warm cache they arrive here for nothing.
 * - the products' names.
 *
 * **Not the rikma's name.** The page shows it inside `AuthorityBadge`, a seal
 * drawn on an SVG path — an identity mark, not prose — and a string that is
 * looked up but never rendered is a query for nothing.
 *
 * @param project `{ id, attributes }` from `49GetProjectById`
 */
export function projectDetailGroups(project: unknown): Record<string, unknown[]> {
    const node = project as { id?: unknown; attributes?: Record<string, any> } | null;
    const a = node?.attributes;
    if (!a) return {};

    const missions = Array.isArray(a.open_missions?.data) ? a.open_missions.data : [];
    const products = Array.isArray(a.matanotofs?.data) ? a.matanotofs.data : [];

    return {
        project: [{ id: node?.id, publicDescription: plainForTranslation(a.publicDescription) }],
        openMission: missions.map((m: any) => ({ id: m?.id, name: m?.attributes?.name })),
        matanot: products.map((p: any) => ({ id: p?.id, name: p?.attributes?.name }))
    };
}

/**
 * `/gift` — the public products directory. The product's name, and the rikma's
 * name for a rikma product.
 *
 * A **personal** product's seller is a person, and a person's name is
 * transliterated rather than translated (§4.3) — that belongs to the profile
 * surfaces of §7.4, not to a directory card. So for a personal product only
 * the product's own name is looked up.
 *
 * @param cards `ProductCard[]` from `normalizeProductCard`
 */
export function productCardGroups(cards: unknown[]): Record<string, unknown[]> {
    const list = Array.isArray(cards) ? cards : [];
    return {
        matanot: list.map((c) => {
            const card = c as { id?: unknown; name?: unknown };
            return { id: card.id, name: card.name };
        }),
        project: list
            .filter((c) => !(c as { personal?: unknown }).personal)
            .map((c) => {
                const card = c as { projectId?: unknown; projectName?: unknown };
                return { id: card.projectId, projectName: card.projectName };
            })
    };
}
