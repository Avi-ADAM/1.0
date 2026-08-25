import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// `levStores` and `theme` both branch on `browser`; happy-dom gives us a real
// window, so tell them we are in one — otherwise the theme never reaches the
// store and every assertion below passes trivially.
vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));

/*
 * The rule this covers: the coins' face is the *theme's* until the member picks
 * one, and theirs for good afterwards. It matters because the two facts it
 * balances pull opposite ways — "the professional identity opens quiet" and
 * "never overrule a member's explicit choice" — and the module has to tell them
 * apart from a single localStorage key.
 *
 * Each case re-imports the module, because the decision is made once, at module
 * load, off whatever is in storage then.
 */

const KEY = 'lev:coinSkin:chosen';

/** src/test-setup.js replaces localStorage with bare `vi.fn()`s that store
 *  nothing, which would make every persistence assertion here vacuous. */
function realStorage() {
  const cells = new Map<string, string>();
  const shim = {
    getItem: (k: string) => (cells.has(k) ? /** @type {string} */ (cells.get(k)) : null),
    setItem: (k: string, v: string) => void cells.set(k, String(v)),
    removeItem: (k: string) => void cells.delete(k),
    clear: () => cells.clear()
  };
  // @ts-expect-error — deliberately swapping the test harness's stub
  window.localStorage = shim;
  return shim;
}

async function loadStores() {
  vi.resetModules();
  const themeMod = await import('./theme.js');
  const levMod = await import('./levStores');
  return { ...themeMod, coinSkin: levMod.coinSkin, chooseCoinSkin: levMod.chooseCoinSkin };
}

describe('coinSkin', () => {
  let storage: ReturnType<typeof realStorage>;

  beforeEach(() => {
    storage = realStorage();
    document.cookie = 'theme=personal; path=/';
  });

  it('opens on the painted coins in the personal identity', async () => {
    const { coinSkin } = await loadStores();
    expect(get(coinSkin)).toBe('classic');
  });

  it('opens on the plate in the professional identity', async () => {
    document.cookie = 'theme=business; path=/';
    const { coinSkin } = await loadStores();
    expect(get(coinSkin)).toBe('plate');
  });

  it('follows the theme while the member has not chosen a face', async () => {
    const { coinSkin, theme, THEMES } = await loadStores();
    expect(get(coinSkin)).toBe('classic');

    theme.set(THEMES.business);
    expect(get(coinSkin)).toBe('plate');

    theme.set(THEMES.personal);
    expect(get(coinSkin)).toBe('classic');
  });

  it('writes no key while the face is only the theme default', async () => {
    const { theme, THEMES } = await loadStores();
    theme.set(THEMES.business);
    // The whole design rests on this: a stored value means "chosen". If the
    // default were written here it would be indistinguishable from a pick and
    // the theme would never get to decide again.
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('remembers a chosen face and stops listening to the theme', async () => {
    const { coinSkin, chooseCoinSkin, theme, THEMES } = await loadStores();

    chooseCoinSkin('plate');
    expect(get(coinSkin)).toBe('plate');
    expect(storage.getItem(KEY)).toBe('plate');

    theme.set(THEMES.business);
    expect(get(coinSkin)).toBe('plate');

    theme.set(THEMES.personal);
    expect(get(coinSkin)).toBe('plate');
  });

  /* The regression that shaped the implementation: a theme flip must not be
     mistaken for a pick. `coinSkin.set` from inside the theme's subscriber is
     queued, not delivered, so any "am I the one writing?" flag is already down
     when the write lands. */
  it('does not turn a theme flip into a choice', async () => {
    const { coinSkin, theme, THEMES } = await loadStores();

    theme.set(THEMES.business);
    expect(storage.getItem(KEY)).toBeNull();

    theme.set(THEMES.personal);
    expect(get(coinSkin)).toBe('classic');
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('restores a chosen face over the theme default on the next load', async () => {
    storage.setItem(KEY, 'classic');
    document.cookie = 'theme=business; path=/';

    const { coinSkin, theme, THEMES } = await loadStores();
    expect(get(coinSkin)).toBe('classic');

    theme.set(THEMES.personal);
    theme.set(THEMES.business);
    expect(get(coinSkin)).toBe('classic');
  });

  it('ignores a junk value in storage and falls back to the theme', async () => {
    storage.setItem(KEY, 'holographic');
    document.cookie = 'theme=business; path=/';

    const { coinSkin } = await loadStores();
    expect(get(coinSkin)).toBe('plate');
  });
});
