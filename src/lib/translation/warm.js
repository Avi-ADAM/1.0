/**
 * The client half of the on-demand fill (§4.1 of docs/PLAN_UGC_TRANSLATION.md).
 *
 * A loader renders the author's own words for every miss and hands the page the
 * missed strings. This posts them once, in the background, and resolves with
 * whatever came back so the component can swap it in without a navigation.
 *
 * Three rules it exists to keep:
 *
 * 1. **Fire-and-forget.** Nothing on the page ever awaits this to render. If it
 *    never resolves, the reader keeps reading source text and never learns that
 *    a request was made.
 * 2. **Only for `always`.** `onDemand` — the default — means "show a
 *    translation when the cache already has one; never ask for one that does
 *    not exist". A reader who has not asked for translations to be *bought*
 *    does not spend the site's daily budget by scrolling a public page.
 * 3. **Once per set of strings.** A page that re-renders, or a filter that
 *    re-runs a derived, must not re-post. The hashes already asked about are
 *    remembered for the life of the tab.
 */

import { get } from 'svelte/store';
import { autoTranslate } from '$lib/stores/autoTranslate.js';

/**
 * @typedef {import('./types.js').TranslatableString} TranslatableString
 * @typedef {import('./types.js').TranslationMap} TranslationMap
 * @typedef {import('./types.js').Locale} Locale
 */

/**
 * Hashes this tab has already asked about — filled or not.
 *
 * "Not filled" is deliberately remembered too: a string the engine could not
 * handle, or that the day's budget refused, will fail again on the next
 * scroll, and retrying it every render is how a fire-and-forget call becomes a
 * loop.
 */
const asked = new Set();

/**
 * Ask the server to fill these misses.
 *
 * @param {TranslatableString[]} pending the loader's missed strings
 * @param {Locale | string} locale the reader's locale, so the reply can carry
 *   their translations rather than only filling the cache for the next visitor
 * @returns {Promise<TranslationMap>} hits to merge, empty on every refusal
 */
export async function warmTranslations(pending, locale) {
    if (typeof window === 'undefined') return {};
    if (get(autoTranslate) !== 'always') return {};

    const items = (Array.isArray(pending) ? pending : []).filter(
        (s) => s && typeof s.source === 'string' && s.hash && !asked.has(s.hash)
    );
    if (items.length === 0) return {};

    for (const s of items) asked.add(s.hash);

    try {
        const res = await fetch('/api/translate/warm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locale,
                items: items.map((s) => ({ text: s.source, mode: s.mode, path: s.path }))
            })
        });
        if (!res.ok) return {};
        const body = await res.json();
        return body && typeof body.hits === 'object' && body.hits ? body.hits : {};
    } catch {
        // Offline, blocked, navigated away. The page is already correct.
        return {};
    }
}

/** Tests, and a reader who changed their preference mid-session. */
export function resetWarmMemory() {
    asked.clear();
}
