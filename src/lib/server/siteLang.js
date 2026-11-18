/**
 * Which language a request is answered in, before the reader has chosen one.
 *
 * Split out of `hooks.server.js` so the precedence can be tested without
 * booting SvelteKit (and without patching global fetch). The order is:
 *   1. `?lang=` — an explicit, validated choice;
 *   2. a bare `/he`, `/en`, … path — the legacy locale URLs;
 *   3. the visitor's own `lang` cookie — also validated, it is user-writable;
 *   4. the browser's `Accept-Language`, parsed by q-order;
 *   5. the site default, Hebrew, when the browser sends no signal at all.
 *
 * A header that names none of the five supported languages still means "not
 * Hebrew", so an English reader gets English — the same answer the old code
 * gave, now for the right reason.
 */

import { localeFromAcceptLanguage } from '../i18n/acceptLanguage.js';

/** Every locale the site can actually render. */
export const SUPPORTED_LANGS = ['he', 'en', 'ar', 'ru', 'es'];

/** The legacy per-locale homepage paths, 301'd to `?lang=` in hooks. */
export const LOCALE_PATHS = new Set(SUPPORTED_LANGS.map((l) => `/${l}`));

/**
 * @param {{
 *   url: { searchParams: { get(name: string): string | null }, pathname: string },
 *   cookies: { get(name: string): string | undefined },
 *   request: { headers: { get(name: string): string | null } }
 * }} event
 * @returns {string}
 */
export function getLanguage(event) {
    const qlang = event.url.searchParams.get('lang');
    if (qlang && SUPPORTED_LANGS.includes(qlang)) return qlang;

    const fromPath = event.url.pathname.slice(1);
    if (SUPPORTED_LANGS.includes(fromPath)) return fromPath;

    const cookieLang = event.cookies.get('lang');
    if (!cookieLang) {
        const acceptLanguage = event.request.headers.get('accept-language');
        // No header at all is not "not Hebrew" — it is no signal, and the
        // answer to no signal is the site's default. Crawlers are exactly who
        // must see Hebrew at the bare address: the hreflang table and the
        // sitemap both declare it to be the Hebrew one.
        if (!acceptLanguage) return 'he';
        return localeFromAcceptLanguage(acceptLanguage, SUPPORTED_LANGS) ?? 'en';
    }

    return SUPPORTED_LANGS.includes(cookieLang) ? cookieLang : 'he';
}
