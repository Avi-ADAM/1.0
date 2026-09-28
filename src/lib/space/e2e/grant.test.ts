// T9a acceptance — epoch.grant (PLAN_T9_SOCIAL_RECOVERY §3). In-memory
// devices, no IDB, no network (same harness as e2e.test.ts):
//
//   1. a grant shares an existing epoch key: the new device opens envelopes
//      sealed before it existed, without a rotation
//   2. a recovered device (scope 'all') reads every epoch its user was in
//   3. the key commitment makes a lying grant harmless — in BOTH arrival
//      orders the honest key wins (invariant 7)
//   4. grants never touch epoch selection (current / candidates / races)
//   5. legacy rotates (no kc) still accept grants

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { IdentityRecord } from '$lib/crypto/identity';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { KEM_ALGO, kemWrap } from './kem';
import {
  generateEpochKeyRaw,
  buildEpochPredicate,
  buildEpochGrantPredicate,
  unwrapEpochKeyWithGrants,
  epochKeysForOpen,
  epochStateFromEvents,
  epochCandidates,
  detectRotateRaces,
  isKeyDistributionEvent,
  keyCommitment,
  planHealGrants,
  coveredDevices,
  type EpochGrantPredicate,
  type EpochRotatePredicate
} from './epoch';
import { sealEvent, openSealed } from './seal';

type TestDevice = { identity: IdentityRecord; kemPriv: CryptoKey; kemPubSpkiB64: string };

async function makeDevice(userId: string): Promise<TestDevice> {
  const algo = await chooseAlgorithm();
  const sig = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const sigSpki = await crypto.subtle.exportKey('spki', sig.publicKey);
  const kem = (await crypto.subtle.generateKey(KEM_ALGO, false, ['deriveBits'])) as CryptoKeyPair;
  const kemSpki = await crypto.subtle.exportKey('spki', kem.publicKey);
  return {
    identity: {
      id: 'self', userId, algo,
      privateKey: sig.privateKey, publicKey: sig.publicKey,
      pubSpki: sigSpki, devicePubB64: b64urlEncode(sigSpki), createdAt: Date.now()
    },
    kemPriv: kem.privateKey,
    kemPubSpkiB64: b64urlEncode(kemSpki)
  };
}

async function signEv(
  d: TestDevice,
  action: ConsentEvent['action'],
  predicate: Record<string, unknown>,
  parents: string[] = []
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: d.identity.userId,
    device: d.identity.devicePubB64,
    action,
    subject: { type: 'space', id: SPACE },
    predicate,
    parents,
    ts: Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(body as unknown as JsonValue, d.identity.privateKey, d.identity.algo);
  return { ...body, sig, id } as ConsentEvent;
}

const SPACE = 'vault:p1';
const rcpt = (d: TestDevice) => ({ device: d.identity.devicePubB64, kemPubSpkiB64: d.kemPubSpkiB64 });

async function rotate(by: TestDevice, epoch: number, raw: Uint8Array, to: TestDevice[], parents: string[] = []) {
  const pred = await buildEpochPredicate(epoch, epoch === 0 ? 'genesis' : 'manual', raw, to.map(rcpt));
  return signEv(by, ACTIONS.epochRotate, pred as unknown as Record<string, unknown>, parents);
}

async function grant(by: TestDevice, rotateEv: ConsentEvent, raw: Uint8Array, to: TestDevice[]) {
  const pred = await buildEpochGrantPredicate(rotateEv, raw, to.map(rcpt));
  return signEv(by, ACTIONS.epochGrant, pred as unknown as Record<string, unknown>, [rotateEv.id]);
}

describe('epoch.grant — sharing an existing key', () => {
  it('a device added by grant opens what was sealed before it existed', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, raw, [a]);

    const secret = await signEv(a, 'message.post' as ConsentEvent['action'], { text: 'wifi: hunter2' }, [r0.id]);
    const env = await sealEvent(a.identity, raw, SPACE, 0, secret);

    // Before the grant B has nothing.
    expect(await unwrapEpochKeyWithGrants([r0], r0, b.identity.devicePubB64, b.kemPriv)).toBeNull();

    const g = await grant(a, r0, raw, [b]);
    const events = [r0, g];
    const bKey = await unwrapEpochKeyWithGrants(events, r0, b.identity.devicePubB64, b.kemPriv);
    expect(bKey).not.toBeNull();
    const opened = await openSealed(env, bKey!);
    expect(opened?.id).toBe(secret.id);

    // And through the T11 entry point readers actually use.
    const keys = await epochKeysForOpen(events, 0, b.identity.devicePubB64, b.kemPriv);
    expect(keys).toHaveLength(1);
  });

  it("a recovered device granted scope 'all' reads every epoch its user was in", async () => {
    const lost = await makeDevice('U');
    const partner = await makeDevice('P');
    const fresh = await makeDevice('U'); // same user, new keys
    const k0 = generateEpochKeyRaw();
    const k1 = generateEpochKeyRaw();
    const r0 = await rotate(partner, 0, k0, [partner, lost]);
    const r1 = await rotate(partner, 1, k1, [partner, lost], [r0.id]);

    const g0 = await grant(partner, r0, k0, [fresh]);
    const g1 = await grant(partner, r1, k1, [fresh]);
    const events = [r0, r1, g0, g1];

    for (const [epoch, key] of [[0, k0], [1, k1]] as const) {
      const got = await epochKeysForOpen(events, epoch, fresh.identity.devicePubB64, fresh.kemPriv);
      expect(got).toHaveLength(1);
      expect(b64urlEncode(got[0].buffer as ArrayBuffer)).toBe(b64urlEncode(key.buffer as ArrayBuffer));
    }
  });
});

describe('epoch.grant — the key commitment', () => {
  it('new rotates commit to their key', async () => {
    const a = await makeDevice('A');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, raw, [a]);
    expect((r0.predicate as unknown as EpochRotatePredicate).kc).toBe(await keyCommitment(raw));
  });

  it('refuses to build a grant for a key the rotate does not commit to', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const r0 = await rotate(a, 0, generateEpochKeyRaw(), [a]);
    await expect(grant(a, r0, generateEpochKeyRaw(), [b])).rejects.toThrow(/commitment/);
  });

  it('a lying grant is discarded and the honest one wins, in both arrival orders', async () => {
    const a = await makeDevice('A');
    const m = await makeDevice('M'); // a member acting in bad faith
    const b = await makeDevice('B');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, raw, [a, m]);

    // Hand-crafted grant: wraps a DIFFERENT key to B under r0's name.
    const bogus = generateEpochKeyRaw();
    const lie = await signEv(m, ACTIONS.epochGrant, {
      rotateId: r0.id,
      epoch: 0,
      wraps: { [b.identity.devicePubB64]: await kemWrap(bogus, b.kemPubSpkiB64) }
    } satisfies EpochGrantPredicate as unknown as Record<string, unknown>, [r0.id]);
    const honest = await grant(a, r0, raw, [b]);

    for (const events of [[r0, lie, honest], [r0, honest, lie]]) {
      const got = await unwrapEpochKeyWithGrants(events, r0, b.identity.devicePubB64, b.kemPriv);
      expect(b64urlEncode(got!.buffer as ArrayBuffer)).toBe(b64urlEncode(raw.buffer as ArrayBuffer));
    }
    // With only the lie on the table B gets nothing rather than a wrong key.
    expect(await unwrapEpochKeyWithGrants([r0, lie], r0, b.identity.devicePubB64, b.kemPriv)).toBeNull();
  });

  it('a legacy rotate (no kc) still accepts a grant', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const raw = generateEpochKeyRaw();
    const pred = await buildEpochPredicate(0, 'genesis', raw, [rcpt(a)]);
    delete (pred as Partial<EpochRotatePredicate>).kc;
    const r0 = await signEv(a, ACTIONS.epochRotate, pred as unknown as Record<string, unknown>);
    const g = await grant(a, r0, raw, [b]);
    expect(await unwrapEpochKeyWithGrants([r0, g], r0, b.identity.devicePubB64, b.kemPriv)).not.toBeNull();
  });
});

describe('epoch.grant — never an epoch', () => {
  it('does not move current, add candidates, or look like a race', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, raw, [a]);
    const g1 = await grant(a, r0, raw, [b]);
    const g2 = await grant(a, r0, raw, [b]);
    const events = [r0, g1, g2];

    expect(epochStateFromEvents(events).current).toBe(0);
    expect(epochCandidates(events).get(0)).toEqual([r0]);
    expect(detectRotateRaces(events)).toEqual([]);
    expect(events.every(isKeyDistributionEvent)).toBe(true);
  });

  it('a grant naming the wrong epoch for its rotate is ignored by readers', async () => {
    const a = await makeDevice('A');
    const b = await makeDevice('B');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(a, 0, raw, [a]);
    const off = await signEv(a, ACTIONS.epochGrant, {
      rotateId: r0.id,
      epoch: 3,
      wraps: { [b.identity.devicePubB64]: await kemWrap(raw, b.kemPubSpkiB64) }
    }, [r0.id]);
    expect(await unwrapEpochKeyWithGrants([r0, off], r0, b.identity.devicePubB64, b.kemPriv)).toBeNull();
  });
});

describe('planHealGrants — a user reads what that user could read (plan §8 steps 7–8)', () => {
  const member = (all: TestDevice[], active: TestDevice[]) => ({
    devices: all.map((d) => d.identity.devicePubB64),
    recipients: active.map(rcpt)
  });

  it('a recovered device gets every epoch its lost device held — and nothing else', async () => {
    const lost = await makeDevice('U');
    const fresh = await makeDevice('U');
    const partner = await makeDevice('P');
    const late = await makeDevice('L'); // joined at epoch 1
    const r0 = await rotate(partner, 0, generateEpochKeyRaw(), [partner, lost]);
    const r1 = await rotate(partner, 1, generateEpochKeyRaw(), [partner, lost, late], [r0.id]);

    const plan = planHealGrants([r0, r1], [
      member([lost, fresh], [fresh]),
      member([partner], [partner]),
      member([late], [late])
    ]);
    expect(plan.get(r0.id)?.map((r) => r.device)).toEqual([fresh.identity.devicePubB64]);
    expect(plan.get(r1.id)?.map((r) => r.device)).toEqual([fresh.identity.devicePubB64]);
  });

  it('a member whose devices were never reached gets no history', async () => {
    const partner = await makeDevice('P');
    const newcomer = await makeDevice('N');
    const r0 = await rotate(partner, 0, generateEpochKeyRaw(), [partner]);
    expect(planHealGrants([r0], [member([newcomer], [newcomer])]).size).toBe(0);
  });

  it('converges: once granted, the plan is empty', async () => {
    const lost = await makeDevice('U');
    const fresh = await makeDevice('U');
    const partner = await makeDevice('P');
    const raw = generateEpochKeyRaw();
    const r0 = await rotate(partner, 0, raw, [partner, lost]);
    const g = await grant(partner, r0, raw, [fresh]);
    expect(coveredDevices([r0, g], r0).has(fresh.identity.devicePubB64)).toBe(true);
    expect(planHealGrants([r0, g], [member([lost, fresh], [fresh])]).size).toBe(0);
  });
});
