/**
 * The reader's UGC-translation preference (§4.4 of docs/PLAN_UGC_TRANSLATION.md).
 *
 *   off      — never look anything up. The read path skips its query entirely,
 *              so this costs a reader who does not want translation *nothing*,
 *              not even one extra round-trip.
 *   onDemand — the default. Show a translation when the cache already has one;
 *              never ask for one that does not exist.
 *   always   — also report misses, so they can be filled (P2). In P1 there is
 *              no warm endpoint, so `always` and `onDemand` render identically;
 *              the setting is stored now so the preference does not have to be
 *              re-collected from every user later.
 *
 * Stored in `localStorage`, per device, and read synchronously at import so the
 * first render already knows the answer — a preference that arrives one frame
 * late shows the reader the wrong text and then swaps it, which is worse than
 * either answer on its own.
 *
 * It is *not* mirrored to Strapi yet. §4.4 wants a `UsersPermissionsUser
 * .autoTranslate` enum so the choice follows the account across devices; that
 * field does not exist on the backend (see docs/STRAPI_TEXT_TRANSLATION_SETUP.md),
 * and inventing a write against a missing column would fail silently on every
 * save. `mirrorToProfile` below is the one place to wire it up when it lands.
 */

import { writable } from 'svelte/store';

/** @typedef {import('$lib/translation/types.js').AutoTranslatePref} AutoTranslatePref */

const KEY = 'autoTranslate';

/** @type {AutoTranslatePref[]} */
export const AUTO_TRANSLATE_VALUES = ['off', 'onDemand', 'always'];

/** @type {AutoTranslatePref} */
export const AUTO_TRANSLATE_DEFAULT = 'onDemand';

/**
 * @param {unknown} v
 * @returns {AutoTranslatePref}
 */
export function coercePref(v) {
    return AUTO_TRANSLATE_VALUES.includes(/** @type {AutoTranslatePref} */ (v))
        ? /** @type {AutoTranslatePref} */ (v)
        : AUTO_TRANSLATE_DEFAULT;
}

/** @returns {AutoTranslatePref} */
function read() {
    // SSR has no localStorage, and a browser in private mode can throw on
    // access rather than return null. Either way the default is the answer.
    try {
        if (typeof localStorage === 'undefined') return AUTO_TRANSLATE_DEFAULT;
        return coercePref(localStorage.getItem(KEY));
    } catch {
        return AUTO_TRANSLATE_DEFAULT;
    }
}

export const autoTranslate = writable(read());

autoTranslate.subscribe((value) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(KEY, coercePref(value));
    } catch {
        // A reader who blocks storage still gets the setting for this session.
    }
});

/**
 * Set the preference.
 * @param {unknown} value
 */
export function setAutoTranslate(value) {
    autoTranslate.set(coercePref(value));
}

/**
 * Mirror the preference to the user's Strapi profile so it follows the account
 * across devices (§4.4).
 *
 * A deliberate no-op until `UsersPermissionsUser.autoTranslate` exists: a write
 * to a column Strapi does not have is not an error the user would ever see, it
 * is a save that quietly does nothing. When the field lands, add it to
 * `updateUserBasic` and call that here — do not add a second write path.
 *
 * @returns {Promise<boolean>} whether anything was actually mirrored
 */
export async function mirrorToProfile() {
    return false;
}

/**
 * "Show me the original, not the translation" — the `<Translated>` toggle.
 *
 * One flag for the whole site rather than one per string: a reader who wants
 * the author's own words wants them everywhere, and a per-paragraph toggle
 * that forgets itself on the next navigation is a toggle nobody uses twice.
 * §4.2 puts it in localStorage for the same reason the preference above is
 * there — it has to be known before the first paint.
 */

const ORIG_KEY = 'showOriginals';

/** @returns {boolean} */
function readOriginals() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem(ORIG_KEY) === '1';
    } catch {
        return false;
    }
}

export const showOriginals = writable(readOriginals());

showOriginals.subscribe((value) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(ORIG_KEY, value ? '1' : '0');
    } catch {
        // Session-only for a reader who blocks storage. Still works.
    }
});
