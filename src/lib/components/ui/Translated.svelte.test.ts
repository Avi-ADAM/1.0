/**
 * The provenance rules of §9.1 are not styling — they are the promise the
 * feature makes to the person who wrote the text. So they are tested:
 * a translation always says it is one, the original is always reachable, and
 * with no translation the component renders exactly what the site renders
 * today.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { readable } from 'svelte/store';

// A `t` that returns the key plus its payload, so assertions can see both the
// key that was asked for and the language name interpolated into it.
vi.mock('$lib/translations', () => ({
    t: readable((key: string, payload?: Record<string, unknown>) =>
        payload ? `${key}:${Object.values(payload).join(',')}` : key
    )
}));

import Translated from './Translated.svelte';
import { autoTranslate, showOriginals } from '$lib/stores/autoTranslate.js';
import { hashSource } from '$lib/translation/normalize.js';

const SOURCE = 'פיתוח אתר הזמנות למרפאה קהילתית';
const ENGLISH = 'Development of a booking site for a community clinic';

const payload = (over = {}) => ({
    locale: 'en',
    misses: [],
    hits: {
        [hashSource(SOURCE)]: {
            text: ENGLISH,
            srcLang: 'he',
            mode: 'translate',
            engine: 'gemini',
            quality: 'machine',
            ...over
        }
    }
});

beforeEach(() => {
    autoTranslate.set('onDemand');
    showOriginals.set(false);
});

describe('Translated — with no translation available', () => {
    it('renders the source and nothing else', () => {
        const { container } = render(Translated, { props: { text: SOURCE } });
        expect(container.textContent?.trim()).toBe(SOURCE);
        expect(container.querySelector('button')).toBeNull();
    });

    it('renders nothing at all for empty text', () => {
        const { container } = render(Translated, { props: { text: '' } });
        expect(container.textContent?.trim()).toBe('');
    });

    it('renders the source when the payload has a row for a different string', () => {
        const { container } = render(Translated, {
            props: { text: 'טקסט אחר לגמרי', translations: payload() }
        });
        expect(container.textContent?.trim()).toBe('טקסט אחר לגמרי');
    });
});

describe('Translated — with a translation', () => {
    it('shows the translation and says where it came from', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload() }
        });
        expect(container.textContent).toContain(ENGLISH);
        // "translated.from" interpolated with the *reader's* name for Hebrew.
        expect(container.textContent).toContain('translated.from:translated.lang.he');
    });

    it('labels a machine translation as one', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload() }
        });
        expect(container.textContent).toContain('translated.machineNotice');
    });

    it('drops the "machine" wording for a human-reviewed row but still names the language', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload({ quality: 'reviewed', engine: 'human' }) }
        });
        expect(container.textContent).not.toContain('translated.machineNotice');
        expect(container.textContent).toContain('translated.from:translated.lang.he');
    });

    it('never destroys the original — one click brings it back, and back again', async () => {
        const { container, getByRole } = render(Translated, {
            props: { text: SOURCE, translations: payload() }
        });
        await fireEvent.click(getByRole('button'));
        expect(container.textContent).toContain(SOURCE);
        expect(container.textContent).not.toContain(ENGLISH);

        await fireEvent.click(getByRole('button'));
        expect(container.textContent).toContain(ENGLISH);
    });

    it('sets dir="auto" — an LTR translation in an RTL page reorders without it', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload() }
        });
        expect(container.querySelector('span')?.getAttribute('dir')).toBe('auto');
    });

    it('honours a reader who turned translation off', () => {
        autoTranslate.set('off');
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload() }
        });
        expect(container.textContent?.trim()).toBe(SOURCE);
        expect(container.querySelector('button')).toBeNull();
    });

    it('accepts a pre-resolved row instead of a payload', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, hit: payload().hits[hashSource(SOURCE)] }
        });
        expect(container.textContent).toContain(ENGLISH);
    });

    it('renders into the element the caller asked for', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload(), as: 'p', class: 'text-sm' }
        });
        const p = container.querySelector('p');
        expect(p?.textContent).toBe(ENGLISH);
        expect(p?.className).toBe('text-sm');
    });

    it('can suppress the note for a caller that shows one for a whole group', () => {
        const { container } = render(Translated, {
            props: { text: SOURCE, translations: payload(), showNote: false }
        });
        expect(container.textContent?.trim()).toBe(ENGLISH);
    });
});
