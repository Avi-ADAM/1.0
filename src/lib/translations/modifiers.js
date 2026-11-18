/**
 * Custom modifiers for `@sveltekit-i18n/parser-default`, shared by the page
 * parser (`./index.js`) and the server translator
 * (`$lib/server/notices/translate.ts`) so a string renders the same in both.
 *
 * `plural` picks a form by the locale's own plural rules (`Intl.PluralRules`):
 *
 *   {{count:plural; one:{{count}} час; few:{{count}} часа; many:{{count}} часов; other:{{count}} часа;}}
 *
 * Keys are the CLDR categories — zero, one, two, few, many, other. A missing
 * category falls back to `other`, then to `default`. Use it where a language
 * has more than singular/plural (ru: 1 / 2-4 / 5+, ar: 0/1/2/3-10/11+); for
 * English the built-in `{{count; 1:…; default:…;}}` (the `eq` modifier) is
 * enough and reads more plainly.
 */

/** @type {Record<string, Intl.PluralRules>} */
const rulesByLocale = {};

/**
 * @param {{ value: any, options?: { key: string, value: string }[], defaultValue?: string, locale?: string }} p
 */
function plural({ value, options = [], defaultValue = '', locale = '' }) {
    const n = Number(value);
    let category = 'other';
    if (Number.isFinite(n)) {
        try {
            const rules = (rulesByLocale[locale || 'en'] ??= new Intl.PluralRules(locale || 'en'));
            category = rules.select(n);
        } catch {
            category = 'other';
        }
    }
    const pick = (/** @type {string} */ k) => options.find((o) => o.key === k)?.value;
    return pick(category) ?? pick('other') ?? defaultValue;
}

export const customModifiers = { plural };
