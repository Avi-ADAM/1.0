import { describe, it, expect, beforeEach } from 'vitest';
import type { ConsentEvent } from '$lib/consent/event';
import { relayAppend, relayRead, relayHeads, logEpoch, _resetRelayLogs } from './log';

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
    nonce: 'x',
    sig: 'x'
  };
}

beforeEach(() => _resetRelayLogs());

describe('relay log', () => {
  it('assigns dense monotonic seq starting at 1', async () => {
    const r1 = await relayAppend('project:1', ev('a'));
    const r2 = await relayAppend('project:1', ev('b', ['a']));
    expect(r1).toMatchObject({ ok: true, seq: 1, deduped: false });
    expect(r2).toMatchObject({ ok: true, seq: 2, deduped: false });
  });

  it('dedupes by event id, returning the original seq', async () => {
    await relayAppend('project:1', ev('a'));
    const dup = await relayAppend('project:1', ev('a'));
    expect(dup).toMatchObject({ ok: true, seq: 1, deduped: true });
    expect(relayRead('project:1').envelopes).toHaveLength(1);
  });

  it('spaces are isolated', async () => {
    await relayAppend('project:1', ev('a'));
    await relayAppend('project:2', ev('b'));
    expect(relayRead('project:1').envelopes.map((e) => e.event.id)).toEqual(['a']);
    expect(relayRead('project:2').envelopes.map((e) => e.event.id)).toEqual(['b']);
  });

  it('since-cursor returns only newer envelopes', async () => {
    await relayAppend('project:1', ev('a'));
    await relayAppend('project:1', ev('b', ['a']));
    await relayAppend('project:1', ev('c', ['b']));
    const page = relayRead('project:1', 1);
    expect(page.envelopes.map((e) => e.event.id)).toEqual(['b', 'c']);
    expect(page.latestSeq).toBe(3);
    expect(relayRead('project:1', 3).envelopes).toEqual([]);
  });

  it('reports heads of the stored DAG', async () => {
    await relayAppend('project:1', ev('a'));
    await relayAppend('project:1', ev('b', ['a']));
    await relayAppend('project:1', ev('c', ['a']));
    expect(relayHeads('project:1')).toEqual(['b', 'c']);
    expect(relayRead('project:1').heads).toEqual(['b', 'c']);
  });

  it('unknown space reads as empty, epoch always present', () => {
    const page = relayRead('project:none');
    expect(page).toMatchObject({ latestSeq: 0, heads: [], envelopes: [] });
    expect(page.epoch).toBe(logEpoch);
    expect(logEpoch.length).toBeGreaterThan(8);
  });
});
