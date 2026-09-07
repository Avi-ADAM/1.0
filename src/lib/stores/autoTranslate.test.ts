import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

/**
 * `src/test-setup.js` installs a `localStorage` whose methods are bare
 * `vi.fn()`s — they record calls and store nothing. That is fine for code that
 * only writes, but this module's whole point is *reading back* what it wrote,
 * so these tests need a real one.
 */
function installRealLocalStorage() {
    const data = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (k: string) => (data.has(k) ? data.get(k) : null),
            setItem: (k: string, v: string) => void data.set(k, String(v)),
            removeItem: (k: string) => void data.delete(k),
            clear: () => data.clear()
        }
    });
}

describe('autoTranslate — the reader preference', () => {
    beforeEach(() => {
        installRealLocalStorage();
        vi.resetModules();
    });

    it('defaults to onDemand — show what exists, never buy anything', async () => {
        const { autoTranslate, AUTO_TRANSLATE_DEFAULT } = await import('./autoTranslate.js');
        expect(get(autoTranslate)).toBe('onDemand');
        expect(AUTO_TRANSLATE_DEFAULT).toBe('onDemand');
    });

    it('reads the stored value synchronously at import, before the first paint', async () => {
        localStorage.setItem('autoTranslate', 'off');
        const { autoTranslate } = await import('./autoTranslate.js');
        expect(get(autoTranslate)).toBe('off');
    });

    it('persists a change', async () => {
        const { setAutoTranslate } = await import('./autoTranslate.js');
        setAutoTranslate('always');
        expect(localStorage.getItem('autoTranslate')).toBe('always');
    });

    it('falls back to the default rather than trusting a junk stored value', async () => {
        localStorage.setItem('autoTranslate', 'yes-please');
        const { autoTranslate } = await import('./autoTranslate.js');
        expect(get(autoTranslate)).toBe('onDemand');
    });

    it('coerces anything unrecognised', async () => {
        const { coercePref } = await import('./autoTranslate.js');
        expect(coercePref('off')).toBe('off');
        expect(coercePref(null)).toBe('onDemand');
        expect(coercePref(7)).toBe('onDemand');
    });

    it('does not mirror to Strapi yet — the column does not exist', async () => {
        const { mirrorToProfile } = await import('./autoTranslate.js');
        await expect(mirrorToProfile()).resolves.toBe(false);
    });
});

describe('showOriginals — the per-reader toggle', () => {
    beforeEach(() => {
        installRealLocalStorage();
        vi.resetModules();
    });

    it('starts off — a reader sees the translation first', async () => {
        const { showOriginals } = await import('./autoTranslate.js');
        expect(get(showOriginals)).toBe(false);
    });

    it('remembers the choice across a reload', async () => {
        const { showOriginals } = await import('./autoTranslate.js');
        showOriginals.set(true);
        expect(localStorage.getItem('showOriginals')).toBe('1');

        vi.resetModules();
        const again = await import('./autoTranslate.js');
        expect(get(again.showOriginals)).toBe(true);
    });
});

describe('a browser that blocks storage', () => {
    const real = globalThis.localStorage;

    afterEach(() => {
        Object.defineProperty(globalThis, 'localStorage', { value: real, configurable: true });
        vi.resetModules();
    });

    it('still works, at the default, without throwing', async () => {
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem() {
                    throw new Error('blocked');
                },
                setItem() {
                    throw new Error('blocked');
                }
            }
        });
        vi.resetModules();
        const { autoTranslate, setAutoTranslate } = await import('./autoTranslate.js');
        expect(get(autoTranslate)).toBe('onDemand');
        expect(() => setAutoTranslate('always')).not.toThrow();
        expect(get(autoTranslate)).toBe('always');
    });
});
