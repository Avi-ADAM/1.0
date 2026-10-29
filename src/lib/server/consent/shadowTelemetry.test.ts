// A3 — shadow-projection telemetry: the shape gate, the endpoint's rules,
// the client's once-per-snapshot send, and the exit-criterion report.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateShadowReport,
  shadowReportKey,
  MAX_MISMATCHES_PER_REPORT,
  SHADOW_TELEMETRY_TAG,
  type ShadowReport
} from '$lib/consent/shadowTelemetry';
import { recordShadowReport, SHADOW_TELEMETRY_LIMIT } from './shadowTelemetry';
import { RateLimiter } from '$lib/server/translation/rateLimit';
import { sendShadowReport, _resetShadowReports } from '$lib/client/shadowTelemetry';
// A plain node script, imported for its pure functions.
import { parseLines, summarize, EXIT_DAYS, EXIT_EVENTS } from '../../../../scripts/space-shadow-report.mjs';

const clean: ShadowReport = { v: 1, pid: '45', events: 12, compared: 3, mismatches: [] };
const red: ShadowReport = {
  v: 1,
  pid: '45',
  events: 14,
  compared: 3,
  mismatches: [{ kind: 'balance', member: '256', chain: '1500', strapi: '1450' }]
};

describe('validateShadowReport', () => {
  it('passes a clean and a red snapshot through unchanged', () => {
    expect(validateShadowReport(clean)).toEqual(clean);
    expect(validateShadowReport(red)).toEqual(red);
  });

  it('strips fields that are not in the shape', () => {
    const out = validateShadowReport({ ...red, email: 'a@b.c', name: 'x', uid: '9' });
    expect(out).toEqual(red);
    const m = validateShadowReport({ ...red, mismatches: [{ ...red.mismatches[0], note: 'hi' }] });
    expect(m?.mismatches[0]).toEqual(red.mismatches[0]);
  });

  it('refuses malformed input', () => {
    for (const bad of [
      null,
      { ...clean, v: 2 },
      { ...clean, pid: 'abc' },
      { ...clean, pid: '' },
      { ...clean, events: -1 },
      { ...clean, compared: 'x' },
      { ...clean, mismatches: 'none' },
      { ...red, mismatches: [{ ...red.mismatches[0], kind: 'members' }] },
      { ...red, mismatches: [{ ...red.mismatches[0], member: 'alice' }] },
      { ...red, mismatches: [{ ...red.mismatches[0], chain: '1.5' }] },
      { ...red, mismatches: [{ ...red.mismatches[0], strapi: '1e9' }] }
    ]) {
      expect(validateShadowReport(bad)).toBeNull();
    }
  });

  it('keeps negative agorot (a member can owe)', () => {
    const neg = { ...red, mismatches: [{ ...red.mismatches[0], chain: '-300' }] };
    expect(validateShadowReport(neg)?.mismatches[0].chain).toBe('-300');
  });

  it('truncates a flood of mismatches', () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ kind: 'balance', member: String(i), chain: '1', strapi: '2' }));
    expect(validateShadowReport({ ...red, mismatches: many })?.mismatches).toHaveLength(MAX_MISMATCHES_PER_REPORT);
  });
});

describe('shadowReportKey', () => {
  it('ignores mismatch order, not content', () => {
    const a = { kind: 'balance' as const, member: '1', chain: '1', strapi: '2' };
    const b = { kind: 'balance' as const, member: '2', chain: '3', strapi: '4' };
    expect(shadowReportKey({ ...red, mismatches: [a, b] })).toBe(shadowReportKey({ ...red, mismatches: [b, a] }));
    expect(shadowReportKey({ ...red, mismatches: [a] })).not.toBe(shadowReportKey({ ...red, mismatches: [b] }));
    expect(shadowReportKey(clean)).not.toBe(shadowReportKey({ ...clean, events: 13 }));
  });
});

describe('recordShadowReport — POST /api/consent/telemetry', () => {
  const json = 'application/json; charset=utf-8';
  let logged: string[];
  let appended: string[];
  let limiter: RateLimiter;
  const deps = () => ({
    limiter,
    log: (l: string) => logged.push(l),
    append: async (l: string) => {
      appended.push(l);
    },
    now: () => new Date('2026-10-30T10:00:00Z')
  });

  beforeEach(() => {
    logged = [];
    appended = [];
    limiter = new RateLimiter();
  });

  it('signed-in only', async () => {
    const r = await recordShadowReport({ uid: undefined, contentType: json, body: clean }, deps());
    expect(r.status).toBe(401);
    // locals.uid is `false` for a guest
    expect((await recordShadowReport({ uid: false, contentType: json, body: clean }, deps())).status).toBe(401);
    expect(logged).toEqual([]);
  });

  it('JSON only', async () => {
    const r = await recordShadowReport({ uid: '256', contentType: 'text/plain', body: clean }, deps());
    expect(r.status).toBe(415);
  });

  it('refuses a malformed report without writing', async () => {
    const r = await recordShadowReport({ uid: '256', contentType: json, body: { ...clean, pid: 'x' } }, deps());
    expect(r.status).toBe(400);
    expect(logged).toEqual([]);
    expect(appended).toEqual([]);
  });

  it('writes one tagged line, and the same JSONL line to the file', async () => {
    const r = await recordShadowReport({ uid: '256', contentType: json, body: red }, deps());
    expect(r.status).toBe(200);
    expect(logged).toHaveLength(1);
    expect(logged[0].startsWith(SHADOW_TELEMETRY_TAG + ' ')).toBe(true);
    const row = JSON.parse(appended[0]);
    expect(row).toEqual({ at: '2026-10-30T10:00:00.000Z', ...red });
    expect(appended[0].endsWith('\n')).toBe(true);
    // the reporter's id is not in the line
    expect(logged[0]).not.toContain('"uid"');
  });

  it('without a file it only logs', async () => {
    const r = await recordShadowReport(
      { uid: '256', contentType: json, body: clean },
      { limiter, log: (l) => logged.push(l) }
    );
    expect(r.status).toBe(200);
    expect(logged).toHaveLength(1);
  });

  it(`limits one user to ${SHADOW_TELEMETRY_LIMIT} per minute, others unaffected`, async () => {
    for (let i = 0; i < SHADOW_TELEMETRY_LIMIT; i++) {
      expect((await recordShadowReport({ uid: '256', contentType: json, body: clean }, deps())).status).toBe(200);
    }
    expect((await recordShadowReport({ uid: '256', contentType: json, body: clean }, deps())).status).toBe(429);
    expect((await recordShadowReport({ uid: '258', contentType: json, body: clean }, deps())).status).toBe(200);
  });

  it('a failing file append does not fail the request', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await recordShadowReport(
      { uid: '256', contentType: json, body: clean },
      { limiter, log: () => {}, append: () => Promise.reject(new Error('disk full')) }
    );
    expect(r.status).toBe(200);
    errSpy.mockRestore();
  });
});

describe('sendShadowReport — once per snapshot', () => {
  beforeEach(() => _resetShadowReports());

  it('sends a new snapshot, skips a repeat, sends again when it changes', () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response('{}'))) as unknown as typeof fetch;
    expect(sendShadowReport(clean, fetchFn)).toBe(true);
    expect(sendShadowReport({ ...clean }, fetchFn)).toBe(false);
    expect(sendShadowReport({ ...clean, events: 13 }, fetchFn)).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/consent/telemetry');
    expect(JSON.parse(init.body)).toEqual(clean);
  });

  it('a network failure stays inside', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchFn = vi.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    expect(sendShadowReport(red, fetchFn)).toBe(true);
    await Promise.resolve();
    warn.mockRestore();
  });
});

describe('space-shadow-report.mjs — the exit criterion', () => {
  const at = (day: number) => new Date(Date.UTC(2026, 9, 1) + day * 86_400_000).toISOString();
  const line = (o: Record<string, unknown>) => `${SHADOW_TELEMETRY_TAG} ${JSON.stringify(o)}`;

  it('picks tagged lines out of a raw log and reads plain JSONL', () => {
    const text = [
      'some other log line',
      `2026-10-30T10:00:00Z stdout ${line({ at: at(0), ...clean })}`,
      JSON.stringify({ at: at(1), ...red }),
      '{"not":"telemetry"}',
      '[space-shadow-telemetry] {broken'
    ].join('\n');
    expect(parseLines(text)).toHaveLength(2);
  });

  it('met: 30+ days, 1,000+ events, nothing differs', () => {
    const rows = [
      { at: at(0), ...clean, events: 10 },
      { at: at(EXIT_DAYS), ...clean, events: EXIT_EVENTS }
    ];
    const [r] = summarize(rows).rikmas;
    expect(r.exitReady).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('the later of the two: long enough but too few events is not met', () => {
    const rows = [
      { at: at(0), ...clean, events: 10 },
      { at: at(45), ...clean, events: 400 }
    ];
    const [r] = summarize(rows).rikmas;
    expect(r.exitReady).toBe(false);
    expect(r.missing).toEqual([`400/${EXIT_EVENTS} events`]);
  });

  it('one mismatch seen by three members is one mismatch, and it blocks the exit', () => {
    const rows = [
      { at: at(0), ...clean, events: 10 },
      { at: at(5), ...red },
      { at: at(5), ...red },
      { at: at(6), ...red },
      { at: at(40), ...clean, events: 2000 }
    ];
    const [r] = summarize(rows).rikmas;
    expect(r.mismatches).toHaveLength(1);
    expect(r.mismatches[0]).toMatchObject({ member: '256', chain: '1500', strapi: '1450' });
    expect(r.cleanReports).toBe(2);
    expect(r.exitReady).toBe(false);
    expect(r.missing).toEqual(['1 mismatch(es) to explain']);
  });

  it('separates rikmas', () => {
    const s = summarize([
      { at: at(0), ...clean },
      { at: at(0), ...clean, pid: '46' }
    ]);
    expect(s.rikmas.map((r: { pid: string }) => r.pid)).toEqual(['45', '46']);
  });
});
