/**
 * Which translation namespaces are route-gated, and to which routes.
 *
 * Kept in a Vite-free module so `scripts/check-i18n-routes.mjs` can import the
 * real gates under plain node instead of re-parsing `index.js`. A gate that
 * does not cover a route where the namespace is actually used makes every key
 * in it render as an **empty string** on that page — silently, in every
 * language. That is what happened to `me` (no loader at all) and to `deals`
 * (gated to `/deals`, but `lev/cards/dowegeot.svelte` uses it on `/lev`).
 */

export const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];

/** Matches `/foo` and the locale-prefixed `/he/foo`, `/es/foo`, … */
const at = (...paths) =>
    paths.map((p) =>
        p instanceof RegExp ? p : new RegExp(`^(?:/${LOCALES.join('|/')})?${p}`)
    );

/**
 * Namespaces fetched only on the routes that use them. Anything not listed
 * here is loaded globally on every page.
 *
 * Run `npm run check:i18n` after moving a component between routes.
 *
 * @type {Record<string, RegExp[]>}
 */
export const ROUTED = {
    onboard: at('/onboard'),
    tasks: at('/myacts', /\/moach\/[^/]+\/acts/),
    deals: at('/deals', '/lev', '/newlev'),
    negotiation: at('/negotiation'),
    guide: at('/guid'),
    faq: at('/faq'),
    love: at('/love'),
    countries: at('/love'),
    me: at('/me'),
    demand: at('/demand', '/lev', '/maagad', /\/moach\/[^/]+\/demand/),
    discover: at('/demand', '/project', '/gift', '/availableMission', '/availiableResorce'),
    concierge: at('/concierge', '/wish'),
    offerings: at('/me', '/onboard', '/gift', '/user', '/deals/sales-center', /\/moach\/[^/]+\/sales/),
    consensus: at('/consensus')
};
