import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * a11y.js — the visitor's display preferences, the ones an accessibility
 * toolbar exists to offer.
 *
 * The site vendored NagishLi (`static/nagishli.js`, v2.3, 2019) and loaded it
 * from a single route, but it never ran on any page: the library needs a
 * `<nagishli>` element in the body, which no page has, and it pulls jQuery
 * 1.8.0 (2012) off a CDN when none is present. Rather than adopt a
 * seven-year-old dependency with known advisories on every page, these are the
 * controls it would have offered, implemented natively:
 *
 *   textScale       three steps of body text size
 *   contrast        a high-contrast pass over the palette
 *   highlightLinks  makes links visible as links, not just as coloured words
 *   readableFont    swaps the decorative display face for a plain one
 *
 * Motion lives in its own module (`$lib/stores/motion.js`) because the 3D scene
 * reads it per animation frame; the panel surfaces both together.
 *
 * Everything is expressed as attributes/classes on <html> and consumed by CSS
 * alone — the same division theme.js uses, and the reason those styles can live
 * in app.postcss instead of being written from JS.
 *
 * Persisted in a cookie rather than localStorage, again following theme.js: a
 * cookie is the only form the server can read, which leaves the door open to
 * stamping these onto the server-rendered HTML later and avoiding a flash of
 * unstyled preference.
 */

export const A11Y_COOKIE = 'a11y';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Body-text steps. 1 is the site's own size, so "off" costs nothing. */
export const TEXT_SCALES = [1, 1.15, 1.3];

/**
 * @typedef {Object} A11ySettings
 * @property {number} textScale index into TEXT_SCALES
 * @property {boolean} contrast
 * @property {boolean} highlightLinks
 * @property {boolean} readableFont
 */

/** @type {A11ySettings} */
const DEFAULTS = {
  textScale: 0,
  contrast: false,
  highlightLinks: false,
  readableFont: false
};

/** @param {string} name */
function readCookie(name) {
  if (!browser) return undefined;
  const hit = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/**
 * Stored as a short positional string ("t1c0l1f0") rather than JSON: it has to
 * survive a round trip through a cookie value, and this needs no escaping.
 * @param {A11ySettings} s
 */
function encode(s) {
  return `t${s.textScale}c${s.contrast ? 1 : 0}l${s.highlightLinks ? 1 : 0}f${
    s.readableFont ? 1 : 0
  }`;
}

/**
 * @param {string | undefined} raw
 * @returns {A11ySettings}
 */
function decode(raw) {
  const m = /^t(\d)c([01])l([01])f([01])$/.exec(String(raw ?? ''));
  if (!m) return { ...DEFAULTS };
  const step = Number(m[1]);
  return {
    // A cookie is user-writable, so an out-of-range index must not index past
    // the end of TEXT_SCALES and produce `undefined` in a CSS variable.
    textScale: step >= 0 && step < TEXT_SCALES.length ? step : 0,
    contrast: m[2] === '1',
    highlightLinks: m[3] === '1',
    readableFont: m[4] === '1'
  };
}

export const a11y = writable(
  /** @type {A11ySettings} */ (browser ? decode(readCookie(A11Y_COOKIE)) : { ...DEFAULTS })
);

/** True when the visitor has changed anything — drives the "reset" affordance. */
export const a11yTouched = derived(
  a11y,
  ($s) =>
    $s.textScale !== DEFAULTS.textScale ||
    $s.contrast !== DEFAULTS.contrast ||
    $s.highlightLinks !== DEFAULTS.highlightLinks ||
    $s.readableFont !== DEFAULTS.readableFont
);

/** @param {A11ySettings} s */
function applyToDocument(s) {
  if (!browser) return;
  const root = document.documentElement;
  root.style.setProperty('--a11y-text-scale', String(TEXT_SCALES[s.textScale]));
  root.classList.toggle('a11y-contrast', s.contrast);
  root.classList.toggle('a11y-links', s.highlightLinks);
  root.classList.toggle('a11y-font', s.readableFont);
}

if (browser) {
  a11y.subscribe((value) => {
    document.cookie = `${A11Y_COOKIE}=${encode(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    applyToDocument(value);
  });
}

/** Step through the text sizes, wrapping back to the site's own size. */
export function cycleTextScale() {
  a11y.update((s) => ({ ...s, textScale: (s.textScale + 1) % TEXT_SCALES.length }));
}

/** @param {'contrast' | 'highlightLinks' | 'readableFont'} key */
export function toggleA11y(key) {
  a11y.update((s) => ({ ...s, [key]: !s[key] }));
}

export function resetA11y() {
  a11y.set({ ...DEFAULTS });
}
