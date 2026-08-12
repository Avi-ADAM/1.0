import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Appearance is two independent axes, not one four-way choice:
 *
 *   theme  personal | business   — the visual identity (hue, radius, motion)
 *   mode   light | dark | system — the brightness
 *
 * Both are expressed as classes on <html> and read by CSS alone. This module
 * deliberately does NOT write CSS variables from JS: the previous version set
 * `--color-gold`, `--color-lturk`… while the whole app consumes `--gold`,
 * `--lturk`…, so every value it wrote landed on a variable nobody reads. The
 * palette now lives entirely in the appearance layer at the end of app.postcss
 * and is selected by these classes.
 *
 * The chosen values are persisted in cookies (not localStorage) so
 * hooks.server.js can stamp the same classes into the server-rendered HTML —
 * without that the first paint is always the default theme.
 */

/** @typedef {'personal' | 'business'} ThemeName */
/** @typedef {'light' | 'dark' | 'system'} ModeName */

/** @type {Record<ThemeName, ThemeName>} */
export const THEMES = {
  personal: 'personal',
  business: 'business'
};

/** @type {Record<ModeName, ModeName>} */
export const MODES = {
  light: 'light',
  dark: 'dark',
  system: 'system'
};

export const THEME_COOKIE = 'theme';
export const MODE_COOKIE = 'mode';

const DEFAULT_THEME = THEMES.personal;
const DEFAULT_MODE = MODES.system;

/**
 * Descriptive metadata. `labelKey` points at a translation key — the label
 * text itself must not live here, it belongs in the i18n namespaces.
 * @type {Record<ThemeName, { labelKey: string, descKey: string, swatch: [string, string] }>}
 */
export const themeMeta = {
  personal: {
    labelKey: 'ui.appearance.themePersonal',
    descKey: 'ui.appearance.themePersonalDesc',
    swatch: ['#eee8aa', '#ff0092']
  },
  business: {
    labelKey: 'ui.appearance.themeBusiness',
    descKey: 'ui.appearance.themeBusinessDesc',
    swatch: ['#f8fafc', '#1d4ed8']
  }
};

/**
 * Kept for backwards compatibility with `+layout.svelte`, which imports
 * `themeConfig`. Layout-level switches (sidebar/footer) stay data-driven.
 * @type {Record<ThemeName, { layout: { headerStyle: string, cardStyle: string } }>}
 */
export const themeConfigs = {
  personal: { layout: { headerStyle: 'gradient', cardStyle: 'rounded' } },
  business: { layout: { headerStyle: 'minimal', cardStyle: 'square' } }
};

/**
 * @param {string} name
 * @returns {string | undefined}
 */
function readCookie(name) {
  if (!browser) return undefined;
  const hit = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/**
 * @param {string} name
 * @param {string} value
 */
function writeCookie(name, value) {
  if (!browser) return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

/** @returns {ThemeName} */
function initialTheme() {
  const fromCookie = readCookie(THEME_COOKIE);
  if (fromCookie === 'personal' || fromCookie === 'business') return fromCookie;
  return DEFAULT_THEME;
}

/** @returns {ModeName} */
function initialMode() {
  const fromCookie = readCookie(MODE_COOKIE);
  if (fromCookie === 'light' || fromCookie === 'dark' || fromCookie === 'system') {
    return fromCookie;
  }
  return DEFAULT_MODE;
}

/** @returns {boolean} */
function osPrefersDark() {
  return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const theme = writable(/** @type {ThemeName} */ (initialTheme()));
export const mode = writable(/** @type {ModeName} */ (initialMode()));

/**
 * Bumped whenever the OS preference changes, so `resolvedMode` recomputes
 * while the user is sitting on `system`.
 */
const osDark = writable(osPrefersDark());

/** The mode actually in force: `system` collapsed to light or dark. */
export const resolvedMode = derived([mode, osDark], ([$mode, $osDark]) =>
  $mode === MODES.system ? ($osDark ? 'dark' : 'light') : $mode
);

export const themeConfig = derived(theme, ($theme) => themeConfigs[$theme]);

/** True when the business identity is active — handy for `{#if}` branches. */
export const isBusiness = derived(theme, ($theme) => $theme === THEMES.business);

/**
 * Mirrors the two stores onto <html>. Mode becomes the single `dark` class
 * because Tailwind's `darkMode: 'selector'` looks for exactly that.
 * @param {ThemeName} themeName
 * @param {'light' | 'dark'} effectiveMode
 */
function applyToDocument(themeName, effectiveMode) {
  if (!browser) return;
  const root = document.documentElement;

  root.classList.remove(THEMES.personal, THEMES.business);
  root.classList.add(themeName);
  root.classList.toggle('dark', effectiveMode === 'dark');

  root.setAttribute('data-theme', themeName);
  root.setAttribute('data-mode', effectiveMode);
  // Lets form controls, scrollbars and the URL bar follow the choice.
  root.style.colorScheme = effectiveMode;
}

if (browser) {
  theme.subscribe((value) => {
    writeCookie(THEME_COOKIE, value);
    applyToDocument(value, /** @type {'light' | 'dark'} */ (get(resolvedMode)));
  });

  mode.subscribe((value) => {
    writeCookie(MODE_COOKIE, value);
    applyToDocument(get(theme), /** @type {'light' | 'dark'} */ (get(resolvedMode)));
  });

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onOsChange = () => {
    osDark.set(mq.matches);
    if (get(mode) === MODES.system) {
      applyToDocument(get(theme), mq.matches ? 'dark' : 'light');
    }
  };
  // Safari < 14 only has the deprecated listener API.
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onOsChange);
  else mq.addListener(onOsChange);
}

/** @param {ThemeName} next */
export const setTheme = (next) => {
  if (next in THEMES) theme.set(next);
};

export const toggleTheme = () => {
  theme.update((t) => (t === THEMES.personal ? THEMES.business : THEMES.personal));
};

/** @param {ModeName} next */
export const setMode = (next) => {
  if (next in MODES) mode.set(next);
};

/** light → dark → system → light */
export const cycleMode = () => {
  mode.update((m) =>
    m === MODES.light ? MODES.dark : m === MODES.dark ? MODES.system : MODES.light
  );
};
