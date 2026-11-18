/**
 * PLAN_EN_READINESS stage 5.3. The old `accept-language.includes('he')` test
 * served Hebrew to an English browser that merely listed Hebrew as a third
 * choice, and gave an Arabic/Russian/Spanish browser English instead of its
 * own language. `getLanguage` now honours q-order and all five locales.
 */
import { describe, expect, it } from 'vitest';
import { getLanguage, SUPPORTED_LANGS } from './siteLang';
import { localeFromAcceptLanguage } from '$lib/i18n/acceptLanguage';

function event({ query = '', path = '/', cookie = undefined, header = null } = {}) {
    return {
        url: {
            searchParams: new URLSearchParams(query),
            pathname: path
        },
        cookies: { get: (name) => (name === 'lang' ? cookie : undefined) },
        request: { headers: { get: (name) => (name === 'accept-language' ? header : null) } }
    };
}

describe('localeFromAcceptLanguage', () => {
    it('reads the q-order, not a substring', () => {
        expect(localeFromAcceptLanguage('en-US,en;q=0.9,he;q=0.8', SUPPORTED_LANGS)).toBe('en');
        expect(localeFromAcceptLanguage('he-IL,he;q=0.9,en;q=0.8', SUPPORTED_LANGS)).toBe('he');
        expect(localeFromAcceptLanguage('ar,en;q=0.7', SUPPORTED_LANGS)).toBe('ar');
        expect(localeFromAcceptLanguage('ru-RU,ru;q=0.9', SUPPORTED_LANGS)).toBe('ru');
        expect(localeFromAcceptLanguage('es-ES,es;q=0.9,en;q=0.8', SUPPORTED_LANGS)).toBe('es');
    });

    it('skips q=0, wildcards and unsupported tags, then keeps header order for ties', () => {
        expect(localeFromAcceptLanguage('he;q=0,en;q=0.9', SUPPORTED_LANGS)).toBe('en');
        expect(localeFromAcceptLanguage('*,fr-FR,es;q=0.5', SUPPORTED_LANGS)).toBe('es');
        expect(localeFromAcceptLanguage('de-DE,fr;q=0.9', SUPPORTED_LANGS)).toBeNull();
        expect(localeFromAcceptLanguage('ru,ar', SUPPORTED_LANGS)).toBe('ru');
        expect(localeFromAcceptLanguage(null, SUPPORTED_LANGS)).toBeNull();
    });
});

describe('getLanguage', () => {
    it('?lang= wins, but only for a supported locale', () => {
        expect(getLanguage(event({ query: '?lang=es', cookie: 'he', header: 'ru' }))).toBe('es');
        expect(getLanguage(event({ query: '?lang=xx', cookie: 'ar' }))).toBe('ar');
    });

    it('the legacy /<locale> path wins over the cookie', () => {
        expect(getLanguage(event({ path: '/ru', cookie: 'he' }))).toBe('ru');
    });

    it('a validated cookie wins over the header', () => {
        expect(getLanguage(event({ cookie: 'ar', header: 'en-US,en;q=0.9' }))).toBe('ar');
        expect(getLanguage(event({ cookie: 'xx', header: 'es' }))).toBe('he');
    });

    it('no cookie: the browser gets its own language, including ar/ru/es', () => {
        expect(getLanguage(event({ header: 'en-US,en;q=0.9,he;q=0.8' }))).toBe('en');
        expect(getLanguage(event({ header: 'ar,en;q=0.8' }))).toBe('ar');
        expect(getLanguage(event({ header: 'ru-RU,ru;q=0.9' }))).toBe('ru');
        expect(getLanguage(event({ header: 'es-ES,es;q=0.9,en;q=0.5' }))).toBe('es');
        expect(getLanguage(event({ header: 'he-IL,he;q=0.9' }))).toBe('he');
    });

    it('no signal at all is Hebrew; a foreign-only header is English', () => {
        expect(getLanguage(event())).toBe('he');
        expect(getLanguage(event({ header: 'de-DE,fr;q=0.9' }))).toBe('en');
    });
});
