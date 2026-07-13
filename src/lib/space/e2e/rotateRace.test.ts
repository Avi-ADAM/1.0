// T11 acceptance (HANDOFF_DISTRIBUTED_DB): two concurrent epoch.rotate
// events race for the same epoch; the test runs the race in BOTH arrival
// orders and verifies every sealed event stays readable to everyone at the
// end, the winner resolves identically everywhere, and post-race traffic
// converges on the single winner key.

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { IdentityRecord } from '$lib/crypto/identity';
import type { ConsentEvent } from '$lib/consent/event';
import { KEM_ALGO } from './kem';
import {
  generateEpochKeyRaw,
  buildEpochPredicate,
  epochStateFromEvents,
  epochCandidates,
  epochKeysForOpen,
  detectRotateRaces,
  unwrapEpochKey,
  type EpochRecipient
} from './epoch';
import { sealEvent, openSealed, type SealedEnvelope } from './seal';
import { validateEpochRotate } from '../rotateGuard';

const SPACE = 'project:race-1';

type TestDevice = {
  identity: IdentityRecord;
  kemPriv: CryptoKey;
  recipient: EpochRecipient;
};

async function makeDevice(userId: string): Promise<TestDevice> {
  const algo = await chooseAlgorithm();
  const sig = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const sigSpki = await crypto.subtle.exportKey('spki', sig.publicKey);
  const kem = (await crypto.subtle.generateKey(KEM_ALGO, false, ['deriveBits'])) as CryptoKeyPair;
  const kemSpki = await crypto.subtle.exportKey('spki', kem.publicKey);
  const devicePubB64 = b64urlEncode(sigSpki);
  return {
    identity: {
      id: 'self', userId, algo,
      privateKey: sig.privateKey, publicKey: sig.publicKey,
      pubSpki: sigSpki, devicePubB64, createdAt: Date.now()
    },
    kemPriv: kem.privateKey,
    recipient: { device: devicePubB64, kemPubSpkiB64: b64urlEncode(kemSpki) }
  };
}

async function signEv(
  d: TestDevice,
  action: string,
  subject: { type: string; id: string },
  predicate: Record<string, unknown> | undefined,
  ts: number
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: d.identity.userId,
    device: d.identity.devicePubB64,
    action, subject, predicate, parents: [],
    ts,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(
    body as unknown as JsonValue, d.identity.privateKey, d.identity.algo
  );
  return { ...body, sig, id } as ConsentEvent;
}

/** One side of the race: a device generates its own epoch-0 key, publishes
 *  a rotate wrapping it to `recipients`, and seals a marker event under it. */
async function raceSide(
  d: TestDevice,
  recipients: EpochRecipient[],
  marker: string,
  ts: number
): Promise<{ rotate: ConsentEvent; rawKey: Uint8Array; sealed: SealedEnvelope }> {
  const rawKey = generateEpochKeyRaw();
  const predicate = await buildEpochPredicate(0, 'genesis', rawKey, recipients);
  const rotate = await signEv(
    d, 'epoch.rotate', { type: 'space', id: SPACE },
    predicate as unknown as Record<string, unknown>, ts
  );
  const inner = await signEv(
    d, 'tosplit.create', { type: 'tosplit', id: marker }, { note: marker }, ts + 1
  );
  const sealed = await sealEvent(d.identity, rawKey, SPACE, 0, inner);
  return { rotate, rawKey, sealed };
}

/** What a replica does: try every candidate key for the envelope's epoch. */
async function openWithCandidates(
  events: ConsentEvent[],
  env: SealedEnvelope,
  d: TestDevice
): Promise<ConsentEvent | null> {
  const keys = await epochKeysForOpen(events, env.epoch, d.identity.devicePubB64, d.kemPriv);
  for (const k of keys) {
    const opened = await openSealed(env, k);
    if (opened) return opened;
  }
  return null;
}

describe('T11 — concurrent rotate race, both arrival orders', () => {
  it('everything sealed in the race window stays readable to everyone; winner is order-independent', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const everyone = [dana.recipient, avi.recipient];

    // Neither side has seen the other's rotate — a genuine race.
    const sideD = await raceSide(dana, everyone, 'marker-dana', 100);
    const sideA = await raceSide(avi, everyone, 'marker-avi', 100);

    const orders: ConsentEvent[][] = [
      [sideD.rotate, sideA.rotate],
      [sideA.rotate, sideD.rotate]
    ];

    let winnerAcrossOrders: string | null = null;
    for (const rotates of orders) {
      // Deterministic winner: lowest event id, independent of arrival order.
      const es = epochStateFromEvents(rotates);
      const winner = es.byEpoch.get(0)!;
      if (winnerAcrossOrders === null) winnerAcrossOrders = winner.id;
      expect(winner.id).toBe(winnerAcrossOrders);
      expect(detectRotateRaces(rotates)).toEqual([
        { epoch: 0, winnerId: winner.id,
          loserIds: [winner.id === sideD.rotate.id ? sideA.rotate.id : sideD.rotate.id] }
      ]);

      // BOTH devices read BOTH sealed events — including the loser's.
      for (const device of [dana, avi]) {
        const openedD = await openWithCandidates(rotates, sideD.sealed, device);
        const openedA = await openWithCandidates(rotates, sideA.sealed, device);
        expect(openedD?.subject.id).toBe('marker-dana');
        expect(openedA?.subject.id).toBe('marker-avi');
      }
    }
  });

  it('post-race traffic converges on the single winner key for both sides', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const everyone = [dana.recipient, avi.recipient];
    const sideD = await raceSide(dana, everyone, 'marker-dana', 100);
    const sideA = await raceSide(avi, everyone, 'marker-avi', 100);
    const rotates = [sideD.rotate, sideA.rotate];

    // Sealing must use candidates[0] (the winner) — verify both devices
    // derive the SAME winner key, and an envelope sealed with it opens with
    // the FIRST candidate key on the other side.
    const winner = epochCandidates(rotates).get(0)![0];
    const danaWinnerKey = await unwrapEpochKey(winner, dana.identity.devicePubB64, dana.kemPriv);
    const aviWinnerKey = await unwrapEpochKey(winner, avi.identity.devicePubB64, avi.kemPriv);
    expect(danaWinnerKey).not.toBeNull();
    expect(aviWinnerKey).not.toBeNull();

    const post = await signEv(dana, 'tosplit.vote',
      { type: 'tosplit', id: 'post-race' }, { what: true }, 200);
    const sealedPost = await sealEvent(dana.identity, danaWinnerKey!, SPACE, 0, post);
    const aviKeys = await epochKeysForOpen(rotates, 0, avi.identity.devicePubB64, avi.kemPriv);
    expect(await openSealed(sealedPost, aviKeys[0])).toMatchObject({
      subject: { id: 'post-race' }
    });
  });

  it('a loser excluded from the winner wraps still reads the race window (the needsReRotate condition)', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');

    // dana's rotate wraps ONLY to dana (stale registry); avi's wraps to both.
    const sideD = await raceSide(dana, [dana.recipient], 'marker-dana', 100);
    const sideA = await raceSide(avi, [dana.recipient, avi.recipient], 'marker-avi', 100);
    const rotates = [sideD.rotate, sideA.rotate];
    const winner = epochCandidates(rotates).get(0)![0];

    const aviKeys = await epochKeysForOpen(rotates, 0, avi.identity.devicePubB64, avi.kemPriv);
    if (winner.id === sideD.rotate.id) {
      // avi lost AND is excluded from the winner's wraps: exactly one
      // readable key (its own) — reads the race window, must re-rotate for
      // the future. (This is what replica.needsReRotate() surfaces.)
      expect(aviKeys).toHaveLength(1);
      expect(await openSealed(sideA.sealed, aviKeys[0])).not.toBeNull();
      expect(await openSealed(sideD.sealed, aviKeys[0])).toBeNull();
      expect(
        await unwrapEpochKey(winner, avi.identity.devicePubB64, avi.kemPriv)
      ).toBeNull();
    } else {
      // avi won — it reads its own traffic; dana reads both (wrapped in both).
      expect(aviKeys).toHaveLength(1);
      const danaKeys = await epochKeysForOpen(rotates, 0, dana.identity.devicePubB64, dana.kemPriv);
      expect(danaKeys).toHaveLength(2);
    }
  });

  it('the T5 guard accepts race records in both orders (set convergence)', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const everyone = [dana.recipient, avi.recipient];
    const sideD = await raceSide(dana, everyone, 'x', 100);
    const sideA = await raceSide(avi, everyone, 'y', 100);

    // Whichever arrives second must ALSO be accepted, or replicas diverge.
    expect(validateEpochRotate(SPACE, [sideD.rotate], sideA.rotate).ok).toBe(true);
    expect(validateEpochRotate(SPACE, [sideA.rotate], sideD.rotate).ok).toBe(true);
    // Forward skips still rejected.
    const skip = await signEv(dana, 'epoch.rotate', { type: 'space', id: SPACE },
      { epoch: 5, reason: 'manual', wraps: {} }, 300);
    expect(validateEpochRotate(SPACE, [sideD.rotate, sideA.rotate], skip).ok).toBe(false);
  });
});
