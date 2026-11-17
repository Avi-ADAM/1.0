import { describe, it, expect } from 'vitest';
import {
    BOT_LANGS,
    BOT_TEXTS,
    botText,
    resolveBotLang,
    isCancelWord,
    relativeDayWord
} from './botTexts.js';

const placeholders = (s) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe('bot texts', () => {
    const enKeys = Object.keys(BOT_TEXTS.en).sort();

    it.each(BOT_LANGS)('%s has exactly the English keys', (lang) => {
        expect(Object.keys(BOT_TEXTS[lang]).sort()).toEqual(enKeys);
    });

    it.each(BOT_LANGS)('%s keeps every placeholder', (lang) => {
        for (const key of enKeys) {
            expect(placeholders(BOT_TEXTS[lang][key]), `${lang}.${key}`).toEqual(
                placeholders(BOT_TEXTS.en[key])
            );
        }
    });

    it('no text is empty', () => {
        for (const lang of BOT_LANGS)
            for (const [key, value] of Object.entries(BOT_TEXTS[lang]))
                expect(value.trim(), `${lang}.${key}`).not.toBe('');
    });

    it('substitutes every occurrence of a placeholder', () => {
        expect(botText('taskCreated', 'ru', { name: 'X' })).toBe('✅ Поручение «X» создано!');
    });

    it('an unknown language falls back to English, not Hebrew', () => {
        expect(botText('welcome', 'de')).toBe(BOT_TEXTS.en.welcome);
    });
});

describe('resolveBotLang', () => {
    it("the account's choice wins over Telegram's", () => {
        expect(resolveBotLang('en', 'he')).toBe('en');
        expect(resolveBotLang('ar', 'en-US')).toBe('ar');
    });

    it("an account that never chose, or no account, takes Telegram's language", () => {
        expect(resolveBotLang(null, 'ru')).toBe('ru');
        expect(resolveBotLang(undefined, 'es-419')).toBe('es');
        expect(resolveBotLang('', 'iw')).toBe('he');
    });

    it('Hebrew only when nothing is known or supported', () => {
        expect(resolveBotLang(null, undefined)).toBe('he');
        expect(resolveBotLang(null, 'de')).toBe('he');
    });
});

describe('typed words', () => {
    it('cancel in every bot language', () => {
        for (const w of ['ביטול', 'Cancel', 'إلغاء', 'Отмена', 'cancelar']) expect(isCancelWord(w)).toBe(true);
        expect(isCancelWord('hello')).toBe(false);
    });

    it('today / yesterday in every bot language', () => {
        for (const w of ['היום', 'today', 'اليوم', 'сегодня', 'Hoy']) expect(relativeDayWord(w)).toBe('today');
        for (const w of ['אתמול', 'yesterday', 'أمس', 'Вчера', 'ayer']) expect(relativeDayWord(w)).toBe('yesterday');
        expect(relativeDayWord('29/06/2026')).toBe(null);
    });
});
