/**
 * The five-locale contract for the words added in PLAN_EN_READINESS stages 4–5.
 *
 * `check:i18n` proves a namespace is loaded; it does not prove that every
 * locale actually has the key, that the placeholders match, or that a " English "
 * branch silently fell back to Hebrew. This does, for the new namespaces and
 * for the order-note subtree of `shop`.
 */
import { describe, expect, it } from 'vitest';

import heServer from '$lib/translations/he/server.json';
import enServer from '$lib/translations/en/server.json';
import arServer from '$lib/translations/ar/server.json';
import ruServer from '$lib/translations/ru/server.json';
import esServer from '$lib/translations/es/server.json';

import heAbout from '$lib/translations/he/about.json';
import enAbout from '$lib/translations/en/about.json';
import arAbout from '$lib/translations/ar/about.json';
import ruAbout from '$lib/translations/ru/about.json';
import esAbout from '$lib/translations/es/about.json';

import heTikun from '$lib/translations/he/tikunolam.json';
import enTikun from '$lib/translations/en/tikunolam.json';
import arTikun from '$lib/translations/ar/tikunolam.json';
import ruTikun from '$lib/translations/ru/tikunolam.json';
import esTikun from '$lib/translations/es/tikunolam.json';

import heShop from '$lib/translations/he/shop.json';
import enShop from '$lib/translations/en/shop.json';
import arShop from '$lib/translations/ar/shop.json';
import ruShop from '$lib/translations/ru/shop.json';
import esShop from '$lib/translations/es/shop.json';

import heBot from '$lib/translations/he/bot.json';
import enBot from '$lib/translations/en/bot.json';
import arBot from '$lib/translations/ar/bot.json';
import ruBot from '$lib/translations/ru/bot.json';
import esBot from '$lib/translations/es/bot.json';

const HEBREW = /[\u0590-\u05FF]/;

const BUNDLES = {
    he: { server: heServer, about: heAbout, tikunolam: heTikun, 'shop.order.note': heShop.order.note, 'bot.card': heBot.card },
    en: { server: enServer, about: enAbout, tikunolam: enTikun, 'shop.order.note': enShop.order.note, 'bot.card': enBot.card },
    ar: { server: arServer, about: arAbout, tikunolam: arTikun, 'shop.order.note': arShop.order.note, 'bot.card': arBot.card },
    ru: { server: ruServer, about: ruAbout, tikunolam: ruTikun, 'shop.order.note': ruShop.order.note, 'bot.card': ruBot.card },
    es: { server: esServer, about: esAbout, tikunolam: esTikun, 'shop.order.note': esShop.order.note, 'bot.card': esBot.card }
} as const;

const LOCALES = ['he', 'en', 'ar', 'ru', 'es'] as const;
type Locale = (typeof LOCALES)[number];

/** Flatten an object to `{ 'a.b.c': 'text' }`. */
function flatten(node: unknown, trail = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof node === 'string') {
        out[trail] = node;
        return out;
    }
    if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            Object.assign(out, flatten(v, trail ? `${trail}.${k}` : k));
        }
    }
    return out;
}

// The set of names a string reads. A plural block — `{{count; 1:…; default:…;}}`
// or `{{count:plural; …}}` — reads its head name, and may repeat it inside its
// forms any number of times; a locale may use a block where Hebrew has none.
function placeholders(text: string): string[] {
    return [...new Set([...text.matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]))].sort();
}

describe('five-locale parity of the stage 4–5 words', () => {
    for (const ns of ['server', 'about', 'tikunolam', 'shop.order.note', 'bot.card'] as const) {
        it(`${ns}: every locale has the same keys and the same placeholders`, () => {
            const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(BUNDLES[l][ns])]));
            const keys = Object.keys(flat.he).sort();
            expect(keys.length).toBeGreaterThan(0);
            for (const locale of LOCALES) {
                expect(Object.keys(flat[locale]).sort(), `${ns}/${locale} keys`).toEqual(keys);
                for (const key of keys) {
                    expect(placeholders(flat[locale][key]), `${ns}/${locale}/${key} placeholders`).toEqual(
                        placeholders(flat.he[key])
                    );
                    expect(flat[locale][key].trim().length, `${ns}/${locale}/${key} is empty`).toBeGreaterThan(0);
                }
            }
        });

        it(`${ns}: no Hebrew outside the Hebrew file`, () => {
            for (const locale of LOCALES.filter((l) => l !== 'he') as Locale[]) {
                for (const [key, text] of Object.entries(flatten(BUNDLES[locale][ns]))) {
                    expect(text, `${ns}/${locale}/${key}`).not.toMatch(HEBREW);
                }
            }
        });
    }

    it('the about page and the declaration really are translated, not copied', () => {
        expect(enAbout.intro1).not.toBe(heAbout.intro1);
        expect(arAbout.prayerBody).not.toBe(heAbout.prayerBody);
        expect(ruTikun.decl1).not.toBe(heTikun.decl1);
        expect(esServer.error.priceRequired).not.toBe(heServer.error.priceRequired);
    });
});
