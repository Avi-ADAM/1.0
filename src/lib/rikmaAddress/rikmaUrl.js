/**
 * The one place a rikma's public address is built
 * (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §2.3).
 *
 * With a slug the address is `/r/<slug>`; without one it is the old
 * `/project/<id>`, which in turn 301s to `/r/<slug>` the moment a slug exists —
 * so a caller that only has the id still lands on the right page, one hop later.
 */

import { slugFromPath } from './slug.js';

export const SITE_ORIGIN = 'https://www.1lev1.com';

/**
 * @param {{ id?: string | number | null, slug?: string | null } | null | undefined} rikma
 * @returns {string}
 */
export function rikmaPath(rikma) {
  const slug = slugFromPath(rikma?.slug);
  if (slug) return `/r/${slug}`;
  return `/project/${rikma?.id ?? ''}`;
}

/**
 * Absolute, for sharing and for `<link rel="canonical">`. Hebrew is the bare
 * path, every other language `?lang=xx` — the same rule app.html's hreflang
 * table and the sitemap follow.
 *
 * @param {{ id?: string | number | null, slug?: string | null } | null | undefined} rikma
 * @param {{ lang?: string, origin?: string }} [opts]
 * @returns {string}
 */
export function rikmaUrl(rikma, { lang, origin = SITE_ORIGIN } = {}) {
  const path = rikmaPath(rikma);
  return `${origin}${path}${lang && lang !== 'he' ? `?lang=${lang}` : ''}`;
}

/**
 * How the address is shown to a person: no scheme, no `www`.
 *
 * @param {string} slug
 */
export const displayAddress = (slug) => `1lev1.com/r/${slug}`;
