import i18n from 'sveltekit-i18n';
import { derived } from 'svelte/store';
import lang from './lang.json';
import { LOCALES, ROUTED } from './routes.js';

/**
 * The loader table is *generated*, not hand-written.
 *
 * It used to be ~1200 lines of one hand-written block per (locale, namespace)
 * pair. That drifted: `me.json` had no loader at all (so every `$t('me.…')`
 * rendered empty), and several namespaces were route-gated to routes that no
 * longer matched where their components are actually mounted — `deals` was
 * gated to `/deals` but `lev/cards/dowegeot.svelte` uses it on `/lev`.
 *
 * Here every locale gets the same namespace list and the same route gate, so a
 * new JSON file is picked up automatically and a route gate can only be wrong
 * in all locales at once. `npm run check:i18n` verifies the gates against the
 * component import graph.
 */

export { LOCALES };

// Every ./<locale>/<namespace>.json. (`lang.json` sits at the root, so the
// glob does not match it — it stays an eager import above.)
const modules = /** @type {Record<string, () => Promise<{ default: Record<string, any> }>>} */ (
    /** @type {unknown} */ (import.meta.glob('./*/*.json'))
);

const NAMESPACES = [
    ...new Set(Object.keys(modules).map((p) => p.split('/')[2].replace(/\.json$/, '')))
].sort();

const loaders = [];
for (const locale of LOCALES) {
    for (const key of NAMESPACES) {
        const routes = ROUTED[key];
        loaders.push({
            locale,
            key,
            ...(routes ? { routes } : {}),
            loader: async () => (await modules[`./${locale}/${key}.json`]()).default
        });
    }
}

export const config = {
    translations: Object.fromEntries(LOCALES.map((l) => [l, { lang }])),
    loaders
};

// The parser's default payload type only permits a `default` key, so any named
// interpolation — `$t('lev.cards.didiget.waitingConfirmation', { name })` —
// would be a type error. Widen the payload once, here, instead of casting at
// every call site.
/** @type {import('sveltekit-i18n').default<[payload?: Record<string, any>, props?: Record<string, any>], Record<string, any>>} */
const instance = new i18n(config);

export const { t, loading, locales, locale, loadTranslations } = instance;

export const isRtl = derived(locale, ($locale) => $locale === 'he' || $locale === 'ar');

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
