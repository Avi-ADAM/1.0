// T3 acceptance (HANDOFF_DISTRIBUTED_DB): sealed envelopes survive a relay
// restart via the Strapi mirror. The mirror module is mocked in-memory —
// the contract under test is log.ts's write-through + lazy hydration, not
// Strapi's REST API.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SealedEnvelope } from '$lib/space/e2e/seal';
import {
  relayAppendSealed,
  relayRead,
  relayEnsureHydrated,
  _resetRelayLogs
} from './log';

// In-memory stand-in for the sealed-envelope Strapi collection.
const mirrorRows: SealedEnvelope[] = [];
vi.mock('./sealedMirror', () => ({
  sealedMirrorEnabled: () => true,
  mirrorSaveSealed: async (sealed: SealedEnvelope) => {
    if (!mirrorRows.some((r) => r.id === sealed.id)) mirrorRows.push(sealed);
  },
  mirrorSealedForSpace: async (spaceId: string) =>
    mirrorRows.filter((r) => r.spaceId === spaceId)
}));

const SPACE = 'project:persist-1';

function fakeSealed(id: string, ts: number): SealedEnvelope {
  return {
    v: 1, kind: 'sealed', id, actor: 'dana', device: 'dev-1',
    spaceId: SPACE, epoch: 0, iv: 'aXY', ct: 'Y3Q', ts, nonce: 'n', sig: 's'
  };
}

beforeEach(() => {
  _resetRelayLogs();
  mirrorRows.length = 0;
});

describe('T3 — sealed envelopes survive a relay restart', () => {
  it('write-through + lazy hydration restores the space after _resetRelayLogs', async () => {
    const a = fakeSealed('env-a', 100);
    const b = fakeSealed('env-b', 200);

    expect((await relayAppendSealed(SPACE, a)).ok).toBe(true);
    expect((await relayAppendSealed(SPACE, b)).ok).toBe(true);
    // fire-and-forget write-through has landed (mock resolves synchronously)
    await Promise.resolve();
    expect(mirrorRows).toHaveLength(2);

    // Simulated restart: in-memory log gone, hydration marks cleared.
    _resetRelayLogs();
    expect(relayRead(SPACE).envelopes).toHaveLength(0);

    // First touch after restart reloads from the mirror.
    await relayEnsureHydrated(SPACE);
    const r = relayRead(SPACE);
    expect(r.envelopes.map((e) => e.sealed?.id)).toEqual(['env-a', 'env-b']);
    expect(r.latestSeq).toBe(2);
  });

  it('a client re-pushing after restart dedupes against the hydrated history', async () => {
    const a = fakeSealed('env-a', 100);
    await relayAppendSealed(SPACE, a);
    await Promise.resolve();

    _resetRelayLogs();
    await relayEnsureHydrated(SPACE);

    const again = await relayAppendSealed(SPACE, a);
    expect(again).toMatchObject({ ok: true, deduped: true, seq: 1 });
    expect(relayRead(SPACE).envelopes).toHaveLength(1);
    expect(mirrorRows).toHaveLength(1); // mirror not duplicated either
  });

  it('hydration runs once per space per process and tolerates an empty mirror', async () => {
    await relayEnsureHydrated('project:empty-9');
    await relayEnsureHydrated('project:empty-9'); // second call is a no-op
    expect(relayRead('project:empty-9').envelopes).toHaveLength(0);
  });
});
