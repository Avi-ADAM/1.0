import { describe, expect, it } from 'vitest';
import { checkOwnName, displayName, memberName, nameFieldsOf, namedUserOf, NAME_FIELD, scriptsToAsk } from './displayName';
import type { TranslationHit } from './types';

const hit = (over: Partial<TranslationHit> = {}): TranslationHit =>
    ({ text: 'Barukh Babayov', engine: 'gemini', mode: 'transliterate', ...over }) as TranslationHit;

describe('displayName (PLAN_UGC_TRANSLATION §18)', () => {
    const baruch = { username: 'ברוך בבאיוף', nameLatin: 'Baruch Babayof' };

    it("shows the member's own spelling to a reader of that script", () => {
        expect(displayName(baruch, 'en')).toEqual({ text: 'Baruch Babayof', source: 'own' });
    });

    it('serves en and es from the same Latin spelling', () => {
        expect(displayName(baruch, 'es').text).toBe('Baruch Babayof');
    });

    it('keeps the name as typed for a reader of its own script', () => {
        expect(displayName(baruch, 'he')).toEqual({ text: 'ברוך בבאיוף', source: 'native' });
    });

    it("own spelling beats the engine, even when the engine may be used", () => {
        expect(displayName(baruch, 'en', { hit: hit(), allowEngine: true }).source).toBe('own');
    });

    it('own spelling beats native — a Latin login handle with a Hebrew name', () => {
        const u = { username: 'bbaba77', nameHebrew: 'ברוך' };
        expect(displayName(u, 'he')).toEqual({ text: 'ברוך', source: 'own' });
        expect(displayName(u, 'en')).toEqual({ text: 'bbaba77', source: 'native' });
    });

    it('falls back to the engine only when the reader allows it', () => {
        const u = { username: 'ברוך בבאיוף' };
        expect(displayName(u, 'en', { hit: hit(), allowEngine: true })).toEqual({
            text: 'Barukh Babayov',
            source: 'engine'
        });
        expect(displayName(u, 'en', { hit: hit(), allowEngine: false }).source).toBe('raw');
    });

    it('an identity row is not a transliteration', () => {
        const u = { username: 'ברוך' };
        expect(displayName(u, 'en', { hit: hit({ engine: 'identity' }), allowEngine: true }).source).toBe('raw');
    });

    it('never renders empty while a username exists, and tolerates no user', () => {
        expect(displayName({ username: 'ברוך', nameLatin: '   ' }, 'en')).toEqual({ text: 'ברוך', source: 'raw' });
        expect(displayName(null, 'en')).toEqual({ text: '', source: 'raw' });
    });
});

describe('checkOwnName', () => {
    it('accepts a name in its own script, with spaces, hyphens and apostrophes', () => {
        expect(checkOwnName("  Ben-David  O'Neil ", 'latin')).toEqual({ ok: true, value: "Ben-David O'Neil" });
        expect(checkOwnName('Барух', 'cyrillic')).toEqual({ ok: true, value: 'Барух' });
        expect(checkOwnName('باروخ', 'arabic')).toEqual({ ok: true, value: 'باروخ' });
    });

    it('treats empty as clearing the field', () => {
        expect(checkOwnName('', 'latin')).toEqual({ ok: true, value: null });
        expect(checkOwnName(undefined, 'latin')).toEqual({ ok: true, value: null });
    });

    it('refuses a name in another script', () => {
        expect(checkOwnName('ברוך', 'latin')).toEqual({ ok: false, reason: 'wrongScript' });
        expect(checkOwnName('Baruch ברוך', 'latin').ok).toBe(false);
    });

    it('refuses a word that mixes alphabets', () => {
        // A Cyrillic a (U+0430) inside a Latin word, built so check:script stays clean.
        const cyrillicA = String.fromCharCode(0x430);
        expect(checkOwnName(`B${cyrillicA}ruch`, 'latin').ok).toBe(false);
    });

    it('refuses more than 60 characters', () => {
        expect(checkOwnName('a'.repeat(61), 'latin')).toEqual({ ok: false, reason: 'tooLong' });
    });
});

describe('scriptsToAsk', () => {
    it("asks about every script except the username's own", () => {
        expect(scriptsToAsk('ברוך')).toEqual(['latin', 'arabic', 'cyrillic']);
        expect(scriptsToAsk('bbaba77')).toEqual(['arabic', 'cyrillic', 'hebrew']);
        expect(scriptsToAsk('')).toHaveLength(4);
    });

    it('maps each script to its schema field', () => {
        expect(NAME_FIELD.latin).toBe('nameLatin');
    });
});

describe('memberName / namedUserOf / nameFieldsOf (§18 S3)', () => {
    const attrs = { username: 'ברוך בבאיוף', nameLatin: 'Baruch Babayof' };

    it('reads every user shape the app passes around', () => {
        expect(namedUserOf({ data: { id: '1', attributes: attrs } })).toBe(attrs);
        expect(namedUserOf({ id: '1', attributes: attrs })).toBe(attrs);
        expect(namedUserOf(attrs)).toBe(attrs);
        expect(namedUserOf(null)).toBeNull();
        expect(namedUserOf({ data: null })).toBeNull();
    });

    it("resolves in the reader's locale, raw for an unknown one", () => {
        expect(memberName({ attributes: attrs }, 'en')).toBe('Baruch Babayof');
        expect(memberName({ attributes: attrs }, 'es')).toBe('Baruch Babayof');
        expect(memberName({ attributes: attrs }, 'he')).toBe('ברוך בבאיוף');
        expect(memberName({ attributes: attrs }, 'ar')).toBe('ברוך בבאיוף');
        expect(memberName({ attributes: attrs }, 'fr')).toBe('ברוך בבאיוף');
        expect(memberName(undefined, 'en')).toBe('');
    });

    it('a flat shape built with nameFieldsOf still resolves', () => {
        const flat = { id: '1', ...nameFieldsOf({ attributes: { ...attrs, nameArabic: '  ', nameCyrillic: null } }), username: attrs.username };
        expect(flat).toEqual({ id: '1', nameLatin: 'Baruch Babayof', username: 'ברוך בבאיוף' });
        expect(memberName(flat, 'en')).toBe('Baruch Babayof');
        expect(nameFieldsOf(undefined)).toEqual({});
    });
});
