// A0b — the first push after a relay restart offers a replica's whole
// history (the relay's heads are empty, so computeDiff returns everything).
// One request used to carry all of it, and past RELAY_MAX_BATCH the route
// answered 413 on every sync round. The client now splits; this drives the
// real relay log through a fetch stub that enforces the route's limit.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import type { SealedEnvelope } from '$lib/space/e2e/seal';
import { RELAY_MAX_BATCH } from '$lib/space/protocol';
import { pushEvents, pushSealed } from '$lib/space/relayClient';
import { relayAppend, relayRead, logEpoch, _resetRelayLogs } from './log';
import { relayRefusalReason, RELAY_WRONG_HOST } from './host';

const SPACE = 'project:a0b';

let n = 0;
function ev(id: string, parents: string[] = []): ConsentEvent {
  return {
    v: 1,
    id,
    actor: 'u1',
    device: 'd1',
    action: 'tosplit.vote',
    subject: { type: 'tosplit', id: 't1' },
    parents,
    ts: ++n,
    nonce: 'n' + id,
    sig: 's' + id
  } as ConsentEvent;
}

/** A linear chain — the shape computeDiff hands a replica's history in. */
function chain(count: number): ConsentEvent[] {
  const out: ConsentEvent[] = [];
  for (let i = 0; i < count; i++) out.push(ev('e' + i, i ? ['e' + (i - 1)] : []));
  return out;
}

type Sent = { events?: unknown[]; sealed?: unknown[] };
let sent: Sent[];
let failOnCall: number | null;

/** The relay route's POST, minus HTTP and signature checks. */
function stubRelayFetch() {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    // relayAppend's write-through to the Strapi mirror rides the same global
    // fetch; a down mirror is tolerated by design, so answer it with one.
    if (!String(url).startsWith('/api/relay/')) return new Response('', { status: 503 });
    const body = JSON.parse(String(init.body)) as Sent;
    sent.push(body);
    if (failOnCall === sent.length) return new Response('down', { status: 503 });
    const items = [...(body.events ?? []), ...(body.sealed ?? [])];
    if (items.length === 0) return new Response('empty', { status: 400 });
    if (items.length > RELAY_MAX_BATCH) return new Response('too big', { status: 413 });
    const results = [];
    for (const e of (body.events ?? []) as ConsentEvent[]) {
      const r = await relayAppend(SPACE, e);
      results.push({ id: e.id, ok: true, seq: r.seq, deduped: r.deduped });
    }
    for (const s of (body.sealed ?? []) as SealedEnvelope[]) {
      results.push({ id: s.id, ok: true, seq: 0, deduped: false });
    }
    const latestSeq = relayRead(SPACE, Number.MAX_SAFE_INTEGER).latestSeq;
    return Response.json({ ok: true, epoch: logEpoch, latestSeq, results });
  });
}

beforeEach(() => {
  _resetRelayLogs();
  sent = [];
  failOnCall = null;
  stubRelayFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pushEvents — chunked to RELAY_MAX_BATCH (A0b)', () => {
  it('a 450-event history goes out as 200 + 200 + 50 and lands whole', async () => {
    const history = chain(450);
    const res = await pushEvents(SPACE, history);

    expect(res.ok).toBe(true);
    expect(sent.map((b) => b.events?.length)).toEqual([200, 200, 50]);
    expect(res.data.results).toHaveLength(450);
    expect(res.data.results.every((r) => r.ok)).toBe(true);
    expect(res.data.latestSeq).toBe(450);

    const relay = relayRead(SPACE, 0);
    expect(relay.envelopes.map((e) => e.event?.id)).toEqual(history.map((e) => e.id));
    expect(relay.heads).toEqual(['e449']);
  });

  it('keeps the order it was given across chunk boundaries', async () => {
    await pushEvents(SPACE, chain(201));
    expect((sent[0].events as ConsentEvent[]).at(-1)?.id).toBe('e199');
    expect((sent[1].events as ConsentEvent[]).map((e) => e.id)).toEqual(['e200']);
  });

  it('exactly RELAY_MAX_BATCH is one request', async () => {
    await pushEvents(SPACE, chain(RELAY_MAX_BATCH));
    expect(sent).toHaveLength(1);
  });

  it('stops at the first failed chunk; what landed stays, a re-push dedupes it', async () => {
    failOnCall = 2;
    const history = chain(450);
    const res = await pushEvents(SPACE, history);

    expect(res.ok).toBe(false);
    expect(res.reason).toBe('http_503');
    expect(sent).toHaveLength(2);
    expect(relayRead(SPACE, 0).latestSeq).toBe(200);

    failOnCall = null;
    const again = await pushEvents(SPACE, history);
    expect(again.ok).toBe(true);
    expect(again.data.results.filter((r) => r.ok && r.deduped)).toHaveLength(200);
    expect(relayRead(SPACE, 0).latestSeq).toBe(450);
  });

  it('a single event is still a single request', async () => {
    const res = await pushEvents(SPACE, [ev('solo')]);
    expect(res.ok).toBe(true);
    expect(sent).toEqual([{ events: [expect.objectContaining({ id: 'solo' })] }]);
  });
});

describe('pushSealed — same split', () => {
  it('250 envelopes go out as 200 + 50 under the `sealed` key', async () => {
    const envelopes = Array.from({ length: 250 }, (_, i) => ({ id: 's' + i }) as SealedEnvelope);
    const res = await pushSealed(SPACE, envelopes);
    expect(res.ok).toBe(true);
    expect(sent.map((b) => [b.events, b.sealed?.length])).toEqual([
      [undefined, 200],
      [undefined, 50]
    ]);
    expect(res.data.results).toHaveLength(250);
  });
});

describe('relayRefusalReason — the relay runs only on the long-lived host', () => {
  it('refuses on Vercel', () => {
    expect(relayRefusalReason({ VERCEL: '1' })).toBe(RELAY_WRONG_HOST);
  });

  it('serves on the VPS container and in dev', () => {
    expect(relayRefusalReason({})).toBeNull();
    expect(relayRefusalReason({ VERCEL: '' })).toBeNull();
    expect(relayRefusalReason({ NODE_ENV: 'production', ORIGIN: 'https://api.1lev1.com' })).toBeNull();
  });
});
