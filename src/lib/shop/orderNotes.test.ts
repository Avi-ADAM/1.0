/**
 * The order's system notes are stored as language-neutral markers and read in
 * the reader's language (PLAN_EN_READINESS stage 4.2). These tests hold both
 * halves down: the server never writes Hebrew into `Order.note`, and all five
 * locales can render every marker.
 */
import { describe, expect, it } from 'vitest';

import heShop from '$lib/translations/he/shop.json';
import enShop from '$lib/translations/en/shop.json';
import arShop from '$lib/translations/ar/shop.json';
import ruShop from '$lib/translations/ru/shop.json';
import esShop from '$lib/translations/es/shop.json';

import { noteLine, renderOrderNote, type OrderNoteTranslate } from './orderNotes';

const BUNDLES = {
    he: { shop: heShop },
    en: { shop: enShop },
    ar: { shop: arShop },
    ru: { shop: ruShop },
    es: { shop: esShop }
} as const;

type Locale = keyof typeof BUNDLES;
const LOCALES: Locale[] = ['he', 'en', 'ar', 'ru', 'es'];

function makeT(locale: Locale): OrderNoteTranslate {
    const bundle = BUNDLES[locale];
    return (key, payload) => {
        const raw = key
            .split('.')
            .reduce<unknown>((cur, seg) => (cur && typeof cur === 'object' ? (cur as any)[seg] : undefined), bundle);
        if (typeof raw !== 'string') throw new Error(`Missing key [${locale}] ${key}`);
        if (!payload) return raw;
        return raw.replace(/\{\{(\w+)\}\}/g, (_m, k) => String((payload as Record<string, unknown>)[k] ?? ''));
    };
}

const HEBREW = /[\u0590-\u05FF]/;

const ALL_NOTES = [
    noteLine('variantOff', { line: 3 }),
    noteLine('belowMin', { line: 1, quantity: 2, min: 5 }),
    noteLine('aboveMax', { line: 2, quantity: 9, max: 8 }),
    noteLine('oversold', { line: 4, remaining: 3, quantity: 5 }),
    noteLine('shippingFeeSeparate', { fee: 20, id: '900' }),
    noteLine('amountMismatch', { charged: 650, computed: 620 }),
    noteLine('belowCatalog', { paid: 380, catalog: 760, gap: 380, pct: 50, currency: 'ILS' }),
    noteLine('belowCatalogOverArranged', { paid: 380, catalog: 760, gap: 380, pct: 50, currency: 'ILS' }),
    noteLine('shippingOptionMissing', { optionId: 'm:north:post' }),
    noteLine('shippingFeeDifferent', { charged: 20, methodName: 'Courier', configured: 30 }),
    noteLine('arrangedPaid', { amount: 380, method: 'cash', under: true, catalog: 760, currency: 'ILS' })
].join('\n');

describe('order note markers', () => {
    it('are language-neutral: no Hebrew in anything the server writes', () => {
        expect(ALL_NOTES).not.toMatch(HEBREW);
        expect(ALL_NOTES).toContain('[[order.note.oversold|');
    });

    it('render every note in all five locales, with no missing keys and no Hebrew outside he', () => {
        for (const locale of LOCALES) {
            const out = renderOrderNote(ALL_NOTES, makeT(locale), locale);
            expect(out).not.toBeNull();
            expect(out).not.toContain('[[order.note.');
            expect(out).not.toContain('{{');
            if (locale !== 'he') expect(out).not.toMatch(HEBREW);
        }
    });

    it('keeps the buyer\'s own words verbatim, next to the marker', () => {
        const note = `${noteLine('arrangedPaid', { amount: 380, method: 'cash' })}: הנחת חבר`;
        expect(renderOrderNote(note, makeT('en'), 'en')).toContain('הנחת חבר');
        expect(renderOrderNote('בלי בצל', makeT('en'), 'en')).toBe('בלי בצל');
    });

    it('formats amounts for the reader, never freezes them into the marker', () => {
        const marker = noteLine('amountMismatch', { charged: 650, computed: 620 });
        const en = renderOrderNote(marker, makeT('en'), 'en') ?? '';
        expect(en).toContain('650');
        expect(en).toContain('620');
        // A currency gets the reader's symbol, not the writer's.
        const withCurrency = noteLine('belowCatalog', {
            paid: 1200, catalog: 1500, gap: 300, pct: 20, currency: 'USD'
        });
        expect(renderOrderNote(withCurrency, makeT('en'), 'en')).toContain('$');
        expect(renderOrderNote(withCurrency, makeT('he'), 'he')).toContain('$');
    });

    it('never shows a raw marker to a person — unknown name or a truncated note', () => {
        expect(renderOrderNote(noteLine('fromTheFuture'), makeT('en'), 'en')).toBe('System note');
        expect(renderOrderNote(noteLine('variantOff', { line: 2 }).slice(0, 24), makeT('en'), 'en')).toBe('');
    });

    it('a user string with brackets cannot break the marker', () => {
        const marker = noteLine('shippingFeeDifferent', {
            charged: 20,
            methodName: 'odd]] [[name | pipe',
            configured: 30
        });
        const out = renderOrderNote(marker, makeT('en'), 'en') ?? '';
        expect(out).toContain('odd]] [[name | pipe');
        expect(out).not.toContain('[[order.note.');
    });
});
