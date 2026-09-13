/**
 * `pageTranslations` is what seven pages now share, so its rules are tested
 * once here rather than trusted seven times: an identity row is never shown or
 * labelled as a translation, `off` and "show originals" win over the payload,
 * and warming only ever adds rows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushSync } from 'svelte';

const warmTranslations = vi.fn(async (_pending: unknown[], _locale: string) => ({}));
vi.mock('./warm.js', () => ({
    warmTranslations: (...args: unknown[]) => warmTranslations(...(args as [unknown[], string]))
}));

import { pageTranslations, type SurfaceData, type PageTranslations } from './pageTranslations.svelte';
import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';
import { hashSource } from './normalize.js';

const HE = 'פיתוח אתר הזמנות למרפאה קהילתית';
const EN = 'Development of a booking site for a community clinic';
const OWN = 'Logo design';

const DATA: SurfaceData = {
    translations: {
        locale: 'en',
        misses: [],
        hits: {
            [hashSource(HE)]: { text: EN, srcLang: 'he', mode: 'translate', engine: 'gemini', quality: 'machine' },
            // The reader's own language: a cache hit, not a translation (§2.2).
            [hashSource(OWN)]: { text: OWN, srcLang: 'en', mode: 'translate', engine: 'identity', quality: 'machine' }
        }
    } as never,
    pending: []
};

/** Run the helper inside an effect root, as a component would. */
function mount(data: SurfaceData, locale = 'en'): { tr: PageTranslations; stop: () => void } {
    let tr!: PageTranslations;
    const stop = $effect.root(() => {
        tr = pageTranslations(() => data, () => locale);
    });
    flushSync();
    return { tr, stop };
}

beforeEach(() => {
    autoTranslate.set('onDemand');
    showOriginals.set(false);
    warmTranslations.mockClear();
});

describe('resolving a row', () => {
    it('finds a row by the text as rendered — whitespace is normalized on both sides', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.hitFor(`  ${HE.replace(' ', '   ')} `)?.text).toBe(EN);
        expect(tr.hitFor('something nobody translated')).toBeUndefined();
        expect(tr.hitFor(null)).toBeUndefined();
        stop();
    });
});

describe('an identity row', () => {
    it('is never the row a group note is about', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.firstReal(OWN, HE)?.text).toBe(EN);
        expect(tr.firstReal(OWN)).toBeUndefined();
        stop();
    });

    it('is never shown as a translation', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.showsTranslation(OWN)).toBe(false);
        expect(tr.textFor(OWN)).toBe(OWN);
        stop();
    });
});

describe('the reader decides', () => {
    it('shows the translation by default', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.showsTranslation(HE)).toBe(true);
        expect(tr.textFor(HE)).toBe(EN);
        stop();
    });

    it('`off` sends every string back to its author', () => {
        autoTranslate.set('off');
        const { tr, stop } = mount(DATA);
        expect(tr.textFor(HE)).toBe(HE);
        stop();
    });

    it('"show original" does too, and reacts without a reload', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.textFor(HE)).toBe(EN);
        showOriginals.set(true);
        flushSync();
        expect(tr.textFor(HE)).toBe(HE);
        stop();
    });

    it('a string with no row renders as written', () => {
        const { tr, stop } = mount(DATA);
        expect(tr.textFor('משהו אחר')).toBe('משהו אחר');
        expect(tr.textFor(undefined)).toBe('');
        stop();
    });
});

describe('warming', () => {
    const PENDING = [{ hash: hashSource('טקסט חדש'), source: 'טקסט חדש', mode: 'translate', path: 'openMission.name' }];

    it('hands the pending strings and the locale over, and merges what comes back', async () => {
        const fresh = { [hashSource('טקסט חדש')]: { text: 'New text', srcLang: 'he', engine: 'gemini' } };
        warmTranslations.mockResolvedValueOnce(fresh as never);

        const { tr, stop } = mount({ ...DATA, pending: PENDING as never }, 'es');
        expect(warmTranslations).toHaveBeenCalledWith(PENDING, 'es');

        await Promise.resolve();
        await Promise.resolve();
        flushSync();
        expect(tr.textFor('טקסט חדש')).toBe('New text');
        // What was already there is kept.
        expect(tr.textFor(HE)).toBe(EN);
        stop();
    });

    it('asks nothing when nothing was missed', () => {
        const { stop } = mount(DATA);
        expect(warmTranslations).not.toHaveBeenCalled();
        stop();
    });
});
