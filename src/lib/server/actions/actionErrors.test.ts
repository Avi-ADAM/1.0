/**
 * PLAN_EN_READINESS stage 4.1: an `ActionError` message reaches the screen
 * verbatim. It must be in the caller's language, in all five locales, not in
 * Hebrew (and not an empty string when the server namespace is missing).
 */
import { describe, expect, it } from 'vitest';
import { actionTranslator, moderationReasons } from './actionErrors';

const HEBREW = /[\u0590-\u05FF]/;

describe('actionTranslator', () => {
    it('resolves the server namespace in all five languages', () => {
        const keys = [
            'server.error.priceRequired',
            'server.error.rikmaMembersOnly',
            'server.error.productCreateFailed',
            'server.error.wishConsentClosed'
        ];
        for (const key of keys) {
            const values = ['he', 'en', 'ar', 'ru', 'es'].map((l) => actionTranslator(l)(key));
            expect(values.every((v) => v.length > 0), key).toBe(true);
            expect(new Set(values).size, `${key} is a real translation in every locale`).toBe(5);
            for (const v of values.slice(1)) expect(v).not.toMatch(HEBREW);
        }
    });

    it('interpolates and translates moderation reasons', () => {
        const t = actionTranslator('en');
        const reasons = moderationReasons(['link', 'contact'], t);
        expect(reasons).toContain('link');
        expect(reasons).toContain('contact details');
        const text = t('server.error.nameRejected', { reasons });
        expect(text).toContain(reasons);
        expect(text).not.toContain('{{');
        expect(actionTranslator('es')('server.error.nameRejected', { reasons: 'enlace' })).toContain('enlace');
    });

    it('falls back to Hebrew for an unknown language and to nothing for an unknown key', () => {
        expect(actionTranslator('xx')('server.error.priceRequired')).toMatch(HEBREW);
        expect(actionTranslator('en')('server.error.doesNotExist')).toBe('');
    });
});
