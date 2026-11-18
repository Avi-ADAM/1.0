/**
 * PLAN_EN_READINESS stage 5.4: every agent, in every site language, gets an
 * explicit instruction about the language it answers in. A `he ? Hebrew :
 * ar ? Arabic : English` chain used to tell a Russian or Spanish member they
 * speak English — and then the model answered in Hebrew.
 */
import { describe, expect, it } from 'vitest';
import {
    AGENT_LANGS,
    agentLanguageDirective,
    agentLanguageName
} from './agentLanguage';

const HEBREW = /[\u0590-\u05FF]/;

describe('agent language instructions', () => {
    it('names all five site languages, each in its own endonym', () => {
        for (const lang of AGENT_LANGS) {
            expect(typeof agentLanguageName(lang)).toBe('string');
            expect(agentLanguageName(lang).length).toBeGreaterThan(3);
        }
        expect(agentLanguageName('ru')).toContain('Russian');
        expect(agentLanguageName('es')).toContain('Spanish');
        expect(agentLanguageName('ar')).toContain('Arabic');
        expect(agentLanguageName('he')).toContain('Hebrew');
        expect(new Set(AGENT_LANGS.map(agentLanguageName)).size).toBe(5);
    });

    it('gives each language its own directive, and only Hebrew contains Hebrew', () => {
        const directives = AGENT_LANGS.map(agentLanguageDirective);
        expect(new Set(directives).size).toBe(5);
        for (const lang of AGENT_LANGS) {
            const text = agentLanguageDirective(lang);
            expect(text.length).toBeGreaterThan(80);
            expect(text.toLowerCase()).toContain('json');
            if (lang === 'he') expect(text).toMatch(HEBREW);
            else expect(text).not.toMatch(HEBREW);
        }
    });

    it('never tells a non-Hebrew reader to answer in Hebrew', () => {
        for (const lang of AGENT_LANGS.filter((l) => l !== 'he')) {
            expect(agentLanguageDirective(lang)).not.toContain('עברית');
        }
    });
});
