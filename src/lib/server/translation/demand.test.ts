import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    DemandLog,
    MAX_BUFFERED,
    compactDemand,
    demandByLocale,
    readDemand,
    resetServerDemandLog,
    serverDemandLog
} from './demand.js';
import type { TranslatableString } from '$lib/translation/types.js';

let dir: string;

beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'demand-'));
    resetServerDemandLog();
});

afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

const s = (hash: string, source: string, path = 'openMission.name'): TranslatableString => ({
    path,
    field: 'name',
    entityKey: 'openMission',
    id: '1',
    mode: 'translate',
    source,
    hash
});

describe('recording', () => {
    it('buffers in memory and writes nothing until it is flushed', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);

        expect(existsSync(join(dir, 'demand.jsonl'))).toBe(false);
        expect(log.snapshot()).toHaveLength(1);
    });

    it('counts repeats of the same (locale, hash) rather than duplicating them', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.record('es', [s('a', 'פיתוח אתר')]);

        expect(log.snapshot()).toHaveLength(1);
        expect(log.snapshot()[0].count).toBe(3);
    });

    it('keeps the same string separate per locale — the locale IS the signal', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.record('ru', [s('a', 'פיתוח אתר')]);

        expect(log.snapshot().map((e) => e.locale).sort()).toEqual(['es', 'ru']);
    });

    it('drops nothing silently below the cap, and drops rather than grows above it', () => {
        const log = new DemandLog(dir);
        const many = Array.from({ length: MAX_BUFFERED + 50 }, (_, i) => s(`h${i}`, `text ${i}`));
        log.record('en', many);

        expect(log.snapshot()).toHaveLength(MAX_BUFFERED);
        expect(log.droppedCount()).toBe(50);
    });

    it('ignores entries with no hash or no source — they could never be filled', () => {
        const log = new DemandLog(dir);
        log.record('en', [
            { hash: '', source: 'x', mode: 'translate' },
            { hash: 'b', source: '', mode: 'translate' }
        ] as never);

        expect(log.snapshot()).toHaveLength(0);
    });
});

describe('flushing and reading back', () => {
    it('round-trips through the file', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.record('ru', [s('b', 'עיצוב לוגו')]);
        expect(log.flush()).toBe(2);

        const back = readDemand(dir);
        expect(back).toHaveLength(2);
        expect(back.map((e) => e.hash).sort()).toEqual(['a', 'b']);
        expect(back.find((e) => e.hash === 'a')?.source).toBe('פיתוח אתר');
    });

    it('clears the buffer on flush, so a second flush writes nothing', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.flush();

        expect(log.flush()).toBe(0);
        expect(readDemand(dir)).toHaveLength(1);
    });

    it('aggregates counts across appends — a server flushes many times a day', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.flush();
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.record('es', [s('a', 'פיתוח אתר')]);
        log.flush();

        const back = readDemand(dir);
        expect(back).toHaveLength(1);
        expect(back[0].count).toBe(3);
    });

    it('orders by demand, then by recency', () => {
        const log = new DemandLog(dir, { now: () => 1000 });
        log.record('es', [s('quiet', 'one ask')]);
        log.record('es', [s('loud', 'many asks'), s('loud', 'many asks'), s('loud', 'many asks')]);
        log.flush();

        expect(readDemand(dir).map((e) => e.hash)).toEqual(['loud', 'quiet']);
    });

    it('skips malformed lines rather than failing — the file is appended to live', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'good')]);
        log.flush();
        writeFileSync(join(dir, 'demand.jsonl'), readFileSync(join(dir, 'demand.jsonl'), 'utf8') + '{"half\n', 'utf8');

        expect(readDemand(dir)).toHaveLength(1);
    });

    it('rejects a line whose locale is not one of the five', () => {
        writeFileSync(
            join(dir, 'demand.jsonl'),
            JSON.stringify({ locale: 'de', hash: 'a', source: 'x', count: 1, seen: 1 }) + '\n',
            'utf8'
        );
        expect(readDemand(dir)).toEqual([]);
    });
});

describe('failing soft', () => {
    it('is a no-op with no directory — the documented default', () => {
        const log = new DemandLog('');
        log.record('es', [s('a', 'x')]);

        expect(log.flush()).toBe(0);
        expect(log.snapshot()).toHaveLength(1);
    });

    it('reads an absent file as no demand at all', () => {
        expect(readDemand(join(dir, 'nope'))).toEqual([]);
        expect(readDemand('')).toEqual([]);
    });

    it('clears the buffer even when the write fails, so a broken path is not a leak', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // A path whose parent is a file cannot be created as a directory.
        const file = join(dir, 'blocker');
        writeFileSync(file, 'x', 'utf8');
        const log = new DemandLog(join(file, 'sub'));
        log.record('es', [s('a', 'x')]);

        expect(log.flush()).toBe(0);
        expect(log.snapshot()).toHaveLength(0);
        warn.mockRestore();
    });
});

describe('compaction', () => {
    it('keeps only what the predicate accepts', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('filled', 'a'), s('outstanding', 'b')]);
        log.flush();

        expect(compactDemand(dir, (e) => e.hash !== 'filled')).toBe(1);
        expect(readDemand(dir).map((e) => e.hash)).toEqual(['outstanding']);
    });

    it('writes an empty file when nothing survives, rather than leaving the old one', () => {
        const log = new DemandLog(dir);
        log.record('es', [s('a', 'x')]);
        log.flush();

        expect(compactDemand(dir, () => false)).toBe(0);
        expect(readDemand(dir)).toEqual([]);
    });
});

describe('demandByLocale', () => {
    it('totals the asks per locale, most-wanted first', () => {
        const entries = [
            { locale: 'es', hash: 'a', source: 'x', mode: 'translate', count: 5, seen: 1 },
            { locale: 'ru', hash: 'b', source: 'y', mode: 'translate', count: 2, seen: 1 },
            { locale: 'es', hash: 'c', source: 'z', mode: 'translate', count: 1, seen: 1 }
        ] as never;

        expect(demandByLocale(entries)).toEqual([
            { locale: 'es', count: 6 },
            { locale: 'ru', count: 2 }
        ]);
    });
});

describe('the shared log', () => {
    it('is null without a directory, and one instance with one', () => {
        expect(serverDemandLog('')).toBeNull();
        expect(serverDemandLog(dir)).toBe(serverDemandLog(dir));
    });
});
