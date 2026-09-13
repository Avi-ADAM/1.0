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
 * It is *also* mirrored to `UsersPermissionsUser.autoTranslate` so the choice
 * follows the account across devices (§4.4). localStorage stays the first
 * reader — the mirror is a slower, second copy, never the one the first paint
 * waits on. See `mirrorToProfile` below.
 */

import { get, writable } from 'svelte/store';

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

// A store's subscriber fires once with the current value the moment it is
// attached. Persisting *that* would write the default into storage at import
// time on a device that has never chosen anything — and a stored default is
// indistinguishable from a real choice, which is precisely the distinction
// `adoptFromProfile` needs. So the first run is skipped: the key exists only
// once the reader has actually picked something.
let seenInitial = false;
autoTranslate.subscribe((value) => {
    if (!seenInitial) {
        seenInitial = true;
        return;
    }
    const pref = coercePref(value);
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(KEY, pref);
    } catch {
        // A reader who blocks storage still gets the setting for this session.
    }
    writeCookie(pref);
});

/**
 * Mirror the preference into a plain cookie as well.
 *
 * `off` is supposed to mean *no query at all* — zero added round-trips for a
 * reader who does not want translation (§4.4) — and that decision has to be
 * made in the `load()` function, on the server, before anything is fetched.
 * `localStorage` is invisible there, so the only way to honour `off` at the
 * point where the saving actually happens is a cookie.
 *
 * Deliberately not httpOnly and deliberately not a secret: it carries one of
 * three known words, it is set by the browser it belongs to, and the server
 * uses it only to decide whether to run a read-only lookup. The account copy
 * on `UsersPermissionsUser.autoTranslate` remains the durable one.
 *
 * @param {AutoTranslatePref} pref
 */
function writeCookie(pref) {
    try {
        if (typeof document === 'undefined') return;
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${KEY}=${pref}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    } catch {
        // Cookies blocked: the read path falls back to its default, which is
        // `onDemand` — a lookup, never a purchase.
    }
}

/** @type {ReturnType<typeof setTimeout> | null} */
let mirrorTimer = null;

/**
 * Set the preference.
 *
 * The device is updated synchronously — that is what the next render reads —
 * and the account copy follows on a short debounce. Three radio buttons a
 * reader clicks through in a second are one write, not three, which matters
 * because `updateUserBasic` notifies the user's other open tabs on every save.
 *
 * @param {unknown} value
 * @param {{ mirror?: boolean }} [opts] `mirror: false` for a set that must not
 *   travel — adopting the account's own value, or a test.
 */
export function setAutoTranslate(value, opts = {}) {
    const pref = coercePref(value);
    autoTranslate.set(pref);

    if (opts.mirror === false || typeof window === 'undefined') return;
    if (mirrorTimer) clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(() => {
        mirrorTimer = null;
        void mirrorToProfile(pref);
    }, 700);
}

/**
 * Adopt the preference stored on the account, for a device that has not chosen
 * one yet.
 *
 * The order matters and it is the opposite of what "the account wins" would
 * suggest: a *local* choice is the reader's most recent statement of intent on
 * the device they are holding, so it is never overwritten by the profile.
 * The account value fills in only when this device is silent — a fresh browser,
 * a cleared cache, a second phone — which is the whole reason for mirroring.
 *
 * @param {unknown} serverValue `meData.autoTranslate` from the loader
 * @returns {boolean} whether the account value was adopted
 */
export function adoptFromProfile(serverValue) {
    if (!AUTO_TRANSLATE_VALUES.includes(/** @type {AutoTranslatePref} */ (serverValue))) return false;
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem(KEY) !== null) return false;
    } catch {
        // Storage is blocked: there is no local choice to defend, so adopt.
    }
    // `mirror: false` — this value came *from* the account; writing it back
    // would be a round-trip that can only ever say what the server already said.
    setAutoTranslate(serverValue, { mirror: false });
    return true;
}

/**
 * Mirror the preference to the user's Strapi profile so it follows the account
 * across devices (§4.4).
 *
 * Goes through `updateUserBasic` — the single write path for profile fields —
 * rather than a second endpoint of its own. Fail-soft on purpose: a reader who
 * is logged out, offline, or hitting a 403 has still had their choice honoured
 * on this device by the `localStorage` write above, and a toast about a failed
 * *preference sync* would be noise about something they never asked for.
 *
 * @param {unknown} [value] defaults to the store's current value
 * @returns {Promise<boolean>} whether anything was actually mirrored
 */
export async function mirrorToProfile(value) {
    const pref = coercePref(value ?? get(autoTranslate));
    try {
        const { executeAction } = await import('$lib/client/actionClient');
        const res = await executeAction(
            'updateUserBasic',
            { autoTranslate: pref },
            // No toast: see above. No update strategy either — the strategy
            // invalidates `app:meProfile`, and re-running that loader to learn
            // a value this device already decided is a round-trip for nothing.
            { showErrorToast: false, skipUpdateStrategy: true }
        );
        return res?.success === true;
    } catch {
        return false;
    }
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
