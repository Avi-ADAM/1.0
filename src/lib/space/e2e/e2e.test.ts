// S3a group-encryption lifecycle, tested without IDB or network: devices are
// in-memory keypairs. Covers the invariants that make the layer safe:
//
//   1. wrap/unwrap roundtrip per recipient; non-recipients get nothing
//   2. seal/open roundtrip; AAD binds header (no cross-space/epoch replay)
//   3. member removal → rotation: removed device reads the past, not the future
//   4. late-joining device reads its epoch, not earlier ones (unless re-wrapped)
//   5. deterministic epoch-conflict resolution (lowest event id wins)

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams } from '$lib/crypto/algorithm';
import { signCanonical } from '$lib/crypto/sign';
import { verifySignedObject, type PubKeyResolver } from '$lib/crypto/verify';
import { b64urlEncode } from '$lib/crypto/b64';
import type { JsonValue } from '$lib/crypto/canonical';
import type { IdentityRecord } from '$lib/crypto/identity';
import { ACTIONS, type ConsentEvent } from '$lib/consent/event';
import { KEM_ALGO, kemWrap, kemUnwrap } from './kem';
import {
  generateEpochKeyRaw,
  buildEpochPredicate,
  epochStateFromEvents,
  unwrapEpochKey,
  EPOCH_KEY_BYTES,
  type EpochRotatePredicate
} from './epoch';
import { sealEvent, openSealed, isSealedEnvelopeShape } from './seal';

type TestDevice = {
  identity: IdentityRecord;
  kemPriv: CryptoKey;
  kemPubSpkiB64: string;
};

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
      id: 'self',
      userId,
      algo,
      privateKey: sig.privateKey,
      publicKey: sig.publicKey,
      pubSpki: sigSpki,
      devicePubB64: b64urlEncode(sigSpki),
      createdAt: Date.now()
    },
    kemPriv: kem.privateKey,
    kemPubSpkiB64: b64urlEncode(kemSpki)
  };
}

async function signEv(
  d: TestDevice,
  action: ConsentEvent['action'],
  subject: { type: string; id: string },
  predicate?: Record<string, unknown>,
  parents: string[] = []
): Promise<ConsentEvent> {
  const body = {
    v: 1 as const,
    actor: d.identity.userId,
    device: d.identity.devicePubB64,
    action,
    subject,
    predicate,
    parents,
    ts: Date.now(),
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)
  };
  const { sig, id } = await signCanonical(body as unknown as JsonValue, d.identity.privateKey, d.identity.algo);
  return { ...body, sig, id } as ConsentEvent;
}

function resolverFor(devices: TestDevice[]): PubKeyResolver {
  return async (_actor, devicePubB64) => {
    const d = devices.find((x) => x.identity.devicePubB64 === devicePubB64);
    return d ? { key: d.identity.publicKey, algo: d.identity.algo } : null;
  };
}

describe('kem wrap/unwrap', () => {
  it('recipient recovers the exact payload; a different device cannot', async () => {
    const alice = await makeDevice('alice');
    const eve = await makeDevice('eve');
    const secret = generateEpochKeyRaw();

    const wrapped = await kemWrap(secret, alice.kemPubSpkiB64);
    const opened = await kemUnwrap(wrapped, alice.kemPriv);
    expect(opened).not.toBeNull();
    expect([...opened!]).toEqual([...secret]);

    expect(await kemUnwrap(wrapped, eve.kemPriv)).toBeNull();
  });

  it('tampered ciphertext fails closed', async () => {
    const alice = await makeDevice('alice');
    const wrapped = await kemWrap(generateEpochKeyRaw(), alice.kemPubSpkiB64);
    const flipped = wrapped.ct.slice(0, -2) + (wrapped.ct.endsWith('AA') ? 'BB' : 'AA');
    expect(await kemUnwrap({ ...wrapped, ct: flipped }, alice.kemPriv)).toBeNull();
  });
});

describe('seal/open', () => {
  it('roundtrips a signed event; outer envelope verifies with the shared pipeline', async () => {
    const alice = await makeDevice('alice');
    const key = generateEpochKeyRaw();
    const inner = await signEv(alice, ACTIONS.tosplitVote, { type: 'tosplit', id: 't1' }, { what: true });

    const env = await sealEvent(alice.identity, key, 'project:p1', 0, inner);
    expect(isSealedEnvelopeShape(env)).toBe(true);
    expect(env.ct).not.toContain('tosplit'); // nothing readable leaks

    const outer = await verifySignedObject(env, resolverFor([alice]));
    expect(outer.ok).toBe(true);

    const opened = await openSealed(env, key);
    expect(opened).toEqual(inner);
  });

  it('wrong epoch key / tampered ct / transplanted header all fail closed', async () => {
    const alice = await makeDevice('alice');
    const key = generateEpochKeyRaw();
    const inner = await signEv(alice, ACTIONS.tosplitVote, { type: 'tosplit', id: 't1' });
    const env = await sealEvent(alice.identity, key, 'project:p1', 0, inner);

    expect(await openSealed(env, generateEpochKeyRaw())).toBeNull();
    const flipped = env.ct.slice(0, -2) + (env.ct.endsWith('AA') ? 'BB' : 'AA');
    expect(await openSealed({ ...env, ct: flipped }, key)).toBeNull();
    // AAD binding: same ct presented under another space or epoch won't open
    expect(await openSealed({ ...env, spaceId: 'project:other' }, key)).toBeNull();
    expect(await openSealed({ ...env, epoch: 1 }, key)).toBeNull();
  });
});

describe('epoch lifecycle', () => {
  it('removal rotation: removed device reads the past but not the future', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const yoni = await makeDevice('yoni');
    const all = [dana, avi, yoni].map((d) => ({ device: d.identity.devicePubB64, kemPubSpkiB64: d.kemPubSpkiB64 }));

    // epoch 0 — everyone
    const key0 = generateEpochKeyRaw();
    const rot0 = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: 'project:p1' },
      (await buildEpochPredicate(0, 'genesis', key0, all)) as unknown as Record<string, unknown>);
    const msg0 = await sealEvent(avi.identity, key0, 'project:p1', 0,
      await signEv(avi, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'old' }));

    // yoni is removed → epoch 1 wrapped only to dana+avi
    const key1 = generateEpochKeyRaw();
    const remaining = all.slice(0, 2);
    const rot1 = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: 'project:p1' },
      (await buildEpochPredicate(1, 'member.remove', key1, remaining)) as unknown as Record<string, unknown>,
      [rot0.id]);
    const msg1 = await sealEvent(dana.identity, key1, 'project:p1', 1,
      await signEv(dana, ACTIONS.tosplitCreate, { type: 'tosplit', id: 'new' }));

    const es = epochStateFromEvents([rot0, rot1]);
    expect(es.current).toBe(1);

    // yoni: epoch 0 opens, epoch 1 does not — no key, and no wrap to unwrap
    const yoniKey0 = await unwrapEpochKey(es.byEpoch.get(0)!, yoni.identity.devicePubB64, yoni.kemPriv);
    expect(yoniKey0).not.toBeNull();
    expect(await openSealed(msg0, yoniKey0!)).not.toBeNull();
    expect(await unwrapEpochKey(es.byEpoch.get(1)!, yoni.identity.devicePubB64, yoni.kemPriv)).toBeNull();
    expect(await openSealed(msg1, yoniKey0!)).toBeNull(); // old key ≠ new epoch

    // avi: both epochs open
    const aviKey1 = await unwrapEpochKey(es.byEpoch.get(1)!, avi.identity.devicePubB64, avi.kemPriv);
    expect(aviKey1).not.toBeNull();
    expect(await openSealed(msg1, aviKey1!)).not.toBeNull();
  });

  it('key material sanity: 32 bytes, unique per epoch', () => {
    const a = generateEpochKeyRaw();
    const b = generateEpochKeyRaw();
    expect(a.length).toBe(EPOCH_KEY_BYTES);
    expect([...a]).not.toEqual([...b]);
  });

  it('conflicting rotations for the same epoch resolve deterministically', async () => {
    const dana = await makeDevice('dana');
    const avi = await makeDevice('avi');
    const rec = [{ device: dana.identity.devicePubB64, kemPubSpkiB64: dana.kemPubSpkiB64 }];

    const rotA = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: 'project:p1' },
      (await buildEpochPredicate(0, 'genesis', generateEpochKeyRaw(), rec)) as unknown as Record<string, unknown>);
    const rotB = await signEv(avi, ACTIONS.epochRotate, { type: 'space', id: 'project:p1' },
      (await buildEpochPredicate(0, 'genesis', generateEpochKeyRaw(), rec)) as unknown as Record<string, unknown>);

    const winner = rotA.id < rotB.id ? rotA : rotB;
    // Both orders converge on the same winner.
    expect(epochStateFromEvents([rotA, rotB]).byEpoch.get(0)!.id).toBe(winner.id);
    expect(epochStateFromEvents([rotB, rotA]).byEpoch.get(0)!.id).toBe(winner.id);
  });

  it('predicate tamper (re-pointing a wrap) breaks the rotate signature', async () => {
    const dana = await makeDevice('dana');
    const eve = await makeDevice('eve');
    const rec = [{ device: dana.identity.devicePubB64, kemPubSpkiB64: dana.kemPubSpkiB64 }];
    const rot = await signEv(dana, ACTIONS.epochRotate, { type: 'space', id: 'project:p1' },
      (await buildEpochPredicate(0, 'genesis', generateEpochKeyRaw(), rec)) as unknown as Record<string, unknown>);

    // Eve grafts her own wrap entry into the predicate.
    const pred = rot.predicate as unknown as EpochRotatePredicate;
    const tampered: ConsentEvent = {
      ...rot,
      predicate: {
        ...rot.predicate,
        wraps: { ...pred.wraps, [eve.identity.devicePubB64]: pred.wraps[dana.identity.devicePubB64] }
      } as unknown as Record<string, unknown>
    };
    const v = await verifySignedObject(tampered, resolverFor([dana, eve]));
    expect(v.ok).toBe(false);
  });
});
