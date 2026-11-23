/**
 * Which home-page control a click landed on, as a short label for the
 * `home_cta` event (docs/tbd/PLAN_INHOUSE_ANALYTICS.md §2, step 2).
 *
 * One delegated listener on the home root calls this, instead of an onclick on
 * each of the ~50 links: a new CTA is counted the day it is added. A control
 * can name itself with `data-cta="demo"`; otherwise the label comes from where
 * it goes. Only the first path segment is ever used, so nothing in a query
 * string can leak through.
 *
 * @param {EventTarget | null} target
 * @returns {string | null} null when the click was not on a link or button
 */
export function homeCtaOf(target) {
  const el =
    target && typeof (/** @type {any} */ (target).closest) === 'function'
      ? /** @type {Element} */ (target).closest('a, button, [data-cta]')
      : null;
  if (!el) return null;

  const named = el.getAttribute('data-cta');
  if (named) return named;

  if (el.tagName === 'BUTTON') return 'button';

  const href = el.getAttribute('href') ?? '';
  if (href.startsWith('#')) return 'anchor';
  if (/^https?:\/\//i.test(href)) return 'external';

  const first = href.replace(/^\/+/, '').split(/[/?#]/)[0].toLowerCase();
  if (!first) return 'home';
  if (first === 'hascama' || first === 'convention' || first === 'aitifaqia') return 'join';
  return /^[a-z0-9-]{1,32}$/.test(first) ? first : 'internal';
}
