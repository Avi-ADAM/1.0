import { describe, it, expect } from 'vitest';
import { parseArgs, buildUrl } from './backfill-translations.js';

const BASE = 'http://127.0.0.1:3000';

describe('parseArgs', () => {
    it('reads the flags §8 promised', () => {
        expect(parseArgs(['--budget', '400', '--only', 'openMission', '--locales', 'ru,es'])).toMatchObject({
            budget: 400,
            only: 'openMission',
            locales: 'ru,es'
        });
    });

    it('defaults to a real run', () => {
        expect(parseArgs([])).toEqual({ status: false, dry: false, help: false });
    });

    it('reads --status and --dry', () => {
        expect(parseArgs(['--status'])).toMatchObject({ status: true });
        expect(parseArgs(['--dry'])).toMatchObject({ dry: true });
    });
});

describe('buildUrl', () => {
    it('sends nothing it was not asked for — an empty flag set is a plain run', () => {
        expect(buildUrl(BASE, parseArgs([]), '')).toBe(`${BASE}/api/cron/translate-backfill`);
    });

    it('carries the cron secret when there is one', () => {
        expect(buildUrl(BASE, parseArgs([]), 's3cret')).toContain('key=s3cret');
    });

    it('passes the budget through as a number', () => {
        expect(buildUrl(BASE, parseArgs(['--budget', '25']), '')).toContain('budget=25');
    });

    it('drops a budget that is not a number rather than sending NaN', () => {
        expect(buildUrl(BASE, parseArgs(['--budget', 'lots']), '')).not.toContain('budget');
    });

    it('sends budget=0 — "decide, but buy nothing" is a real request', () => {
        expect(buildUrl(BASE, parseArgs(['--budget', '0']), '')).toContain('budget=0');
    });
});
