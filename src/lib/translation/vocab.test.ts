import { describe, it, expect, afterEach } from 'vitest';
import { vocabName, _setVocabMap } from './vocab.svelte';
import { applyLocalization } from '$lib/utils/localizationUtils';

afterEach(() => _setVocabMap('ar', undefined));

describe('vocabName', () => {
    it('falls back to the English base name when there is no row', () => {
        expect(vocabName('Web development', 'ar')).toBe('Web development');
    });

    it('returns the catalog translation for ar/ru/es, by normalised base name', () => {
        _setVocabMap('ar', { 'Web development': 'تطوير المواقع' });
        expect(vocabName(' Web  development', 'ar')).toBe('تطوير المواقع');
    });

    it('never touches he or en — those keep Strapi rows', () => {
        _setVocabMap('ar', { 'Web development': 'تطوير المواقع' });
        expect(vocabName('Web development', 'he')).toBe('Web development');
        expect(vocabName('Web development', 'en')).toBe('Web development');
    });
});

describe('applyLocalization', () => {
    const rows = {
        data: [
            {
                id: '1',
                attributes: {
                    skillName: 'Web development',
                    localizations: { data: [{ attributes: { skillName: 'פיתוח אתרים' } }] }
                }
            }
        ]
    };

    it('ar reads the catalog, not the Hebrew localization', () => {
        _setVocabMap('ar', { 'Web development': 'تطوير المواقع' });
        expect(applyLocalization(rows, 'ar').data[0].attributes.skillName).toBe('تطوير المواقع');
    });

    it('he still reads the Hebrew localization', () => {
        expect(applyLocalization(rows, 'he').data[0].attributes.skillName).toBe('פיתוח אתרים');
    });
});
