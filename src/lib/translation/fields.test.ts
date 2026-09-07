import { describe, it, expect } from 'vitest';
import { TRANSLATABLE, ENTITY_KEYS, fieldSpec, flatFields } from './fields.js';

describe('the translatable-field manifest', () => {
    it('declares a Strapi entity and at least one field per key', () => {
        for (const key of ENTITY_KEYS) {
            expect(TRANSLATABLE[key].entity, key).toBeTruthy();
            expect(Object.keys(TRANSLATABLE[key].fields).length, key).toBeGreaterThan(0);
        }
    });

    it('gives every field a mode and a positive max length', () => {
        for (const f of flatFields()) {
            expect(['translate', 'transliterate']).toContain(f.mode);
            expect(f.max).toBeGreaterThan(0);
        }
    });

    it('transliterates names and places, never translating them', () => {
        // בָּרוּךְ must not become "Blessed", Хлеб must not become "Bread" (§4.3).
        expect(fieldSpec('user', 'username')?.mode).toBe('transliterate');
        expect(fieldSpec('user', 'city')?.mode).toBe('transliterate');
        // …but a bio is prose.
        expect(fieldSpec('user', 'bio')?.mode).toBe('translate');
    });

    it('covers the public discovery surfaces §7 rolls out first', () => {
        expect(fieldSpec('project', 'publicDescription')).toBeTruthy();
        expect(fieldSpec('openMission', 'descrip')).toBeTruthy();
        expect(fieldSpec('openMashaabim', 'descrip')).toBeTruthy();
        expect(fieldSpec('matanot', 'name')).toBeTruthy();
    });

    it('excludes the fields that must never be translated', () => {
        // URLs have no language.
        expect(fieldSpec('project', 'githublink')).toBeNull();
        expect(fieldSpec('project', 'linkToWebsite')).toBeNull();
        // A JSON rich-text column is not plain text.
        expect(fieldSpec('matanot', 'desc')).toBeNull();
        // Chat is deliberately last and on-demand only (§7).
        expect(fieldSpec('forum', 'subject')).toBeNull();
    });

    it('answers null for an unknown entity rather than throwing', () => {
        expect(fieldSpec('nope', 'name')).toBeNull();
        expect(fieldSpec('project', 'nope')).toBeNull();
    });

    it('flattens to one row per entity.field', () => {
        const flat = flatFields();
        const ids = flat.map((f) => `${f.entityKey}.${f.field}`);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain('openMission.hearotMeyuchadot');
    });
});
