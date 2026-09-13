import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadBackfillState, saveBackfillState } from './backfillStore.js';

let dir: string;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'backfill-'));
});

afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

describe('round trip', () => {
    it('saves and reloads a cursor', () => {
        const state = {
            sources: { openMission: { page: 4, pageCount: 12, passes: 1, lastRun: '2026-09-10T00:00:00.000Z' } }
        };
        expect(saveBackfillState(dir, state)).toBe(true);
        expect(loadBackfillState(dir)).toEqual(state);
    });

    it('reads an absent file as a fresh start', () => {
        expect(loadBackfillState(dir)).toEqual({ sources: {} });
        expect(loadBackfillState('')).toEqual({ sources: {} });
    });

    it('leaves no temp file behind', () => {
        saveBackfillState(dir, { sources: {} });
        expect(() => readFileSync(join(dir, 'cursor.json.tmp'), 'utf8')).toThrow();
    });
});

/**
 * A cursor is the only thing standing between "resume where you stopped" and
 * "silently skip half the corpus forever", so a file that has been hand-edited
 * or half-written must degrade to the start, never to a plausible-looking
 * wrong page.
 */
describe('a damaged file', () => {
    it('falls back to a fresh start rather than throwing', () => {
        writeFileSync(join(dir, 'cursor.json'), '{ not json', 'utf8');
        expect(loadBackfillState(dir)).toEqual({ sources: {} });
    });

    it('repairs a nonsense page number instead of trusting it', () => {
        writeFileSync(
            join(dir, 'cursor.json'),
            JSON.stringify({ sources: { openMission: { page: -3, passes: 'many' } } }),
            'utf8'
        );
        expect(loadBackfillState(dir).sources.openMission).toEqual({
            page: 1,
            pageCount: null,
            passes: 0,
            lastRun: undefined
        });
    });

    it('floors a fractional page', () => {
        writeFileSync(join(dir, 'cursor.json'), JSON.stringify({ sources: { s: { page: 2.7 } } }), 'utf8');
        expect(loadBackfillState(dir).sources.s.page).toBe(2);
    });
});

describe('failing soft', () => {
    it('reports rather than throws when there is nowhere to write', () => {
        expect(saveBackfillState('', { sources: {} })).toBe(false);
    });
});
