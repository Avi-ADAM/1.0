/**
 * Where "start now" goes.
 *
 * Registration lives behind the agreement, and which agreement depends on the
 * language. The mapping was copied inline into fpage and then into every
 * track page, which is exactly how a fourth locale gets forgotten in one of
 * them - so it lives here once.
 *
 * Returned as an href rather than performed as a `goto`, because these are
 * navigations and belong in an `<a>`: crawlable, middle-clickable, and
 * usable with the keyboard without any of the handlers a button would need.
 *
 * @param {string} locale The active locale ('he' | 'en' | 'ar' | 'ru' | 'es').
 * @param {string} [from] Optional destination to return to after signing up.
 * @returns {string}
 */
export function registerHref(locale, from) {
  const base =
    locale === 'he' ? '/hascama' : locale === 'ar' ? '/aitifaqia' : '/convention';
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}
