/**
 * The `theme` axis of the appearance system, as data — no stores, no DOM, no
 * `$app/*` imports, so `hooks.server.js`, `src/lib/stores/theme.js` and the
 * inline script's server-side twin can all agree on one spelling table.
 *
 * The theme can arrive from three places, in this order of authority:
 *   1. `?theme=` in the URL   — a shared link ("show this visitor the clean,
 *                               business look"). It PINS: the value is written
 *                               to the cookie, so the choice survives the rest
 *                               of the visit and every later navigation.
 *   2. the `theme` cookie     — the visitor's own choice from the appearance
 *                               menu, or a previously pinned link.
 *   3. DEFAULT_THEME          — no parameter, no cookie ⇒ the regular look.
 *
 * Everything the URL can carry is public and user-writable, which is why
 * nothing here trusts the input: `normalizeTheme` returns `undefined` for
 * anything it does not recognise, and callers fall back rather than stamping a
 * stranger's string into the markup.
 */

/** @typedef {'personal' | 'business'} ThemeName */

/** @type {readonly ThemeName[]} */
export const THEME_NAMES = /** @type {const} */ (['personal', 'business']);

/** @type {ThemeName} */
export const DEFAULT_THEME = 'personal';

/** The query-string key. */
export const THEME_PARAM = 'theme';

export const THEME_COOKIE = 'theme';

/** A pinned theme outlives the session — same horizon as the client's writes. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Words a link may use for each theme. The internal name is `business`, but a
 * link handed to a person is written by a person: `?theme=professional` is the
 * spelling anyone would reach for first, and the doubled-f typo is common
 * enough that rejecting it would only produce links that silently do nothing.
 * @type {Record<string, ThemeName>}
 */
const ALIASES = {
  personal: 'personal',
  default: 'personal',
  classic: 'personal',
  business: 'business',
  professional: 'business',
  proffesional: 'business',
  pro: 'business'
};

/**
 * @param {unknown} raw
 * @returns {ThemeName | undefined} the theme, or `undefined` when `raw` is
 * absent/unrecognised — never a guess.
 */
export function normalizeTheme(raw) {
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim().toLowerCase();
  // hasOwnProperty, not a bare lookup: `?theme=constructor` would otherwise
  // hand back a function off Object.prototype and pass every truthiness check
  // between here and `classList.add()`.
  return Object.prototype.hasOwnProperty.call(ALIASES, key) ? ALIASES[key] : undefined;
}
