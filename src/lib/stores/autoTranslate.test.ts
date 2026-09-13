import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

/**
 * The mirror to Strapi goes through `updateUserBasic` and nothing else
 * (PLAN_UGC_TRANSLATION §4.4). Mocking the action client is also what keeps a
 * pending debounce from firing a real fetch after a test has finished.
 */
const executeAction = vi.fn(async () => ({ success: true }));
vi.mock('$lib/client/actionClient', () => ({
    executeAction: (...args: unknown[]) => executeAction(...(args as [])),
}));

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
        executeAction.mockClear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
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

    it('mirrors to the account through updateUserBasic, and nowhere else', async () => {
        const { mirrorToProfile } = await import('./autoTranslate.js');
        await expect(mirrorToProfile('always')).resolves.toBe(true);

        expect(executeAction).toHaveBeenCalledTimes(1);
        const [key, params, opts] = executeAction.mock.calls[0] as unknown as [string, any, any];
        expect(key).toBe('updateUserBasic');
        expect(params).toEqual({ autoTranslate: 'always' });
        // Silent by design: a failed *preference sync* is not the reader's
        // problem, and re-running the /me loader teaches this device nothing.
        expect(opts).toMatchObject({ showErrorToast: false, skipUpdateStrategy: true });
    });

    it('reports failure rather than throwing when the action fails', async () => {
        executeAction.mockResolvedValueOnce({ success: false } as never);
        const { mirrorToProfile } = await import('./autoTranslate.js');
        await expect(mirrorToProfile('off')).resolves.toBe(false);
    });

    it('debounces: three clicks in a second are one write', async () => {
        const { setAutoTranslate } = await import('./autoTranslate.js');
        setAutoTranslate('off');
        setAutoTranslate('always');
        setAutoTranslate('onDemand');
        expect(executeAction).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1000);
        expect(executeAction).toHaveBeenCalledTimes(1);
        expect((executeAction.mock.calls[0] as unknown as [string, any])[1]).toEqual({
            autoTranslate: 'onDemand'
        });
    });

    it('adopts the account value only on a device that never chose', async () => {
        const { adoptFromProfile, autoTranslate } = await import('./autoTranslate.js');
        expect(adoptFromProfile('always')).toBe(true);
        expect(get(autoTranslate)).toBe('always');

        // Adopting must not echo the value straight back to the server.
        await vi.advanceTimersByTimeAsync(1000);
        expect(executeAction).not.toHaveBeenCalled();
    });

    it('never overwrites a choice this device already made', async () => {
        localStorage.setItem('autoTranslate', 'off');
        const { adoptFromProfile, autoTranslate } = await import('./autoTranslate.js');
        expect(adoptFromProfile('always')).toBe(false);
        expect(get(autoTranslate)).toBe('off');
    });

    it('ignores a junk value from the profile', async () => {
        const { adoptFromProfile, autoTranslate } = await import('./autoTranslate.js');
        expect(adoptFromProfile('sure-why-not')).toBe(false);
        expect(adoptFromProfile(null)).toBe(false);
        expect(get(autoTranslate)).toBe('onDemand');
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
