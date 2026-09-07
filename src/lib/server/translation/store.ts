/**
 * The read half of the UGC translation cache (§4.1 of
 * docs/PLAN_UGC_TRANSLATION.md). **Read only** — the write half
 * (`cacheTranslations`, the Gemini adapter, the governor) is P2 and does not
 * exist yet. Nothing in this file can spend a request.
 *
 * The hard rule it enforces: *a page load never waits on a translation API*.
 * A loader hands it strings it has already fetched; it makes at most one
 * batched query; hits come back attached to the payload and misses are just
 * reported, so the page renders the author's own words. A cold page is not
 * slower because it is being read in Russian, and a crawler walking
 * /availableMission cannot burn a day's quota.
 *
 * Until the Strapi `text-translation` collection exists (see
 * docs/STRAPI_TEXT_TRANSLATION_SETUP.md), every call here fails soft and
 * returns "all misses" — which is exactly today's behaviour, in every language.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import type {
    Locale,
    TranslatableString,
    TranslationHit,
    TranslationMap,
    TranslationPayload
} from '$lib/translation/types.js';

const QID = '312translationsByHash';

/** Strapi's `pagination.limit` for the qid. Keep in step with its default. */
export const MAX_HASHES_PER_READ = 300;

const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];
const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/**
 * The one place this module is allowed to be noisy, and only once per process:
 * a missing collection is an operational fact worth seeing in the logs, but it
 * must not print per request on a list page.
 */
let warned = false;
function warnOnce(err: unknown) {
    if (warned) return;
    warned = true;
    console.warn(
        '[translation] cache read failed — rendering source text. ' +
            'This is expected until the Strapi `text-translation` collection and its ' +
            'two permission grants exist (docs/STRAPI_TEXT_TRANSLATION_SETUP.md).',
        err instanceof Error ? err.message : err
    );
}

/** Rows the qid returned, mapped to `hash → hit`. Exported for its own test. */
export function rowsToMap(rows: unknown, tgtLang: Locale): TranslationMap {
    const data = (rows as { data?: { textTranslations?: { data?: unknown[] } } })?.data
        ?.textTranslations?.data;
    if (!Array.isArray(data)) return {};

    const map: TranslationMap = {};
    for (const row of data) {
        const a = (row as { attributes?: Record<string, unknown> })?.attributes;
        if (!a) continue;

        const hash = typeof a.hash === 'string' ? a.hash : '';
        const text = typeof a.text === 'string' ? a.text : '';
        const srcLang = a.srcLang;
        if (!hash || !text || !isLocale(srcLang)) continue;
        // The filter already pins tgtLang; a row that disagrees is a bug
        // somewhere upstream and must not be rendered to a reader.
        if (a.tgtLang !== tgtLang) continue;

        const hit: TranslationHit = {
            text,
            srcLang,
            mode: a.mode === 'transliterate' ? 'transliterate' : 'translate',
            engine:
                a.engine === 'human' || a.engine === 'identity' || a.engine === 'glossary'
                    ? a.engine
                    : 'gemini',
            quality: a.quality === 'reviewed' ? 'reviewed' : 'machine'
        };

        // A human-reviewed row always wins over a machine one for the same
        // string; otherwise first row wins and the result is stable.
        const existing = map[hash];
        if (!existing || (existing.quality !== 'reviewed' && hit.quality === 'reviewed')) {
            map[hash] = hit;
        }
    }
    return map;
}

export interface ReadOptions {
    /** SvelteKit's `fetch` from the load function. Required on the server. */
    fetch: typeof globalThis.fetch;
    /**
     * `off` skips the query entirely — zero added queries for readers who do
     * not want translation (§4.4). Anything else reads the cache.
     */
    pref?: 'off' | 'onDemand' | 'always';
}

/**
 * Look up the translations of `strings` for one reader's locale.
 *
 * Never throws, never awaits an API, and never spends anything. Returns the
 * hits it found and the hashes it did not — the miss list is what the warm
 * endpoint will consume in P2; in P1 it is telemetry the caller may ignore.
 */
export async function readTranslationCache(
    strings: TranslatableString[],
    locale: Locale,
    { fetch, pref = 'onDemand' }: ReadOptions
): Promise<TranslationPayload> {
    const hashes = [...new Set((strings ?? []).map((s) => s.hash).filter(Boolean))];
    const empty: TranslationPayload = { locale, hits: {}, misses: hashes };

    if (pref === 'off' || hashes.length === 0 || !isLocale(locale)) {
        return { locale, hits: {}, misses: pref === 'off' ? [] : hashes };
    }

    // One query, not N. Beyond the page limit the tail is reported as a miss
    // rather than paged: a list page showing 300 distinct strings is already
    // past the point where a second round-trip is the right trade.
    const asked = hashes.slice(0, MAX_HASHES_PER_READ);

    try {
        const res = await sendToSer(
            { hashes: asked, tgt: locale, limit: MAX_HASHES_PER_READ },
            QID,
            0,
            0,
            true,
            fetch
        );
        const hits = rowsToMap(res, locale);
        return { locale, hits, misses: hashes.filter((h) => !hits[h]) };
    } catch (err) {
        warnOnce(err);
        return empty;
    }
}

/**
 * The whole read path in one call, for a loader that already has its entities:
 *
 * ```js
 * const translations = await translateFor(
 *   { project: projects, openMission: missions },
 *   locale,
 *   { fetch }
 * );
 * return { projects, missions, translations };
 * ```
 *
 * The returned payload is what `<Translated>` consumes, keyed by source hash.
 */
export async function translateFor(
    groups: Record<string, unknown[]>,
    locale: Locale,
    opts: ReadOptions
): Promise<TranslationPayload> {
    const { collect } = await import('$lib/translation/collect.js');
    return readTranslationCache(collect(groups as never), locale, opts);
}
