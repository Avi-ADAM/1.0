// T7 — DeviceCert sign/verify (PLAN_user_sovereign_consent §Multi-device).
// Real WebCrypto keys, in-memory resolver — same approach as sealedRelay.test.

import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams } from './algorithm';
import { b64urlEncode } from './b64';
import type { IdentityRecord } from './identity';
import type { PubKeyResolver } from './verify';
import { signDeviceCert, verifyDeviceCert, isDeviceCertShape } from './deviceCert';

async function makeIdentity(userId: string): Promise<IdentityRecord> {
  const algo = await chooseAlgorithm();
  const pair = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm, true, ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
  return {
    id: 'self', userId, algo,
    privateKey: pair.privateKey, publicKey: pair.publicKey,
    pubSpki: spki, devicePubB64: b64urlEncode(spki), createdAt: Date.now()
  };
}

function resolverFor(...identities: IdentityRecord[]): PubKeyResolver {
  return async (actor, device) => {
    const d = identities.find(
      (x) => x.userId === actor && x.devicePubB64 === device
    );
    return d ? { key: d.publicKey, algo: d.algo } : null;
  };
}

describe('DeviceCert sign → verify roundtrip', () => {
  it('a parent-signed cert for a new device verifies', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    expect(isDeviceCertShape(cert)).toBe(true);
    const res = await verifyDeviceCert(cert, resolverFor(laptop), {
      userId: 'dana', devicePubKey: phone.devicePubB64
    });
    expect(res.ok).toBe(true);
  });

  it('refuses to sign for a different user than the parent identity', async () => {
    const laptop = await makeIdentity('dana');
    await expect(
      signDeviceCert(laptop, { userId: 'mallory', devicePubKey: 'x', deviceLabel: 'x' })
    ).rejects.toThrow();
  });
});

describe('verifyDeviceCert — rejections', () => {
  it('a cert pinned to another device does not authorize this one', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    const res = await verifyDeviceCert(cert, resolverFor(laptop), {
      userId: 'dana', devicePubKey: 'some-other-device'
    });
    expect(res).toMatchObject({ ok: false, reason: 'cert_wrong_device' });
  });

  it("a cert for another user's device is rejected", async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    const res = await verifyDeviceCert(cert, resolverFor(laptop), {
      userId: 'mallory', devicePubKey: phone.devicePubB64
    });
    expect(res).toMatchObject({ ok: false, reason: 'cert_wrong_user' });
  });

  it('a self-signed cert authorizes nothing', async () => {
    const rogue = await makeIdentity('dana');
    const cert = await signDeviceCert(rogue, {
      userId: 'dana', devicePubKey: rogue.devicePubB64, deviceLabel: 'rogue'
    });
    const res = await verifyDeviceCert(cert, resolverFor(rogue), {
      userId: 'dana', devicePubKey: rogue.devicePubB64
    });
    expect(res).toMatchObject({ ok: false, reason: 'cert_self_signed' });
  });

  it('an expired cert is rejected; a future notBefore is rejected', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const now = Date.now();

    const expired = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone',
      notBefore: now - 1000 * 60 * 60 * 24, notAfter: now - 1000 * 60 * 60
    });
    expect((await verifyDeviceCert(expired, resolverFor(laptop), {
      userId: 'dana', devicePubKey: phone.devicePubB64
    }, now)).reason).toBe('cert_expired');

    const future = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone',
      notBefore: now + 1000 * 60 * 60
    });
    expect((await verifyDeviceCert(future, resolverFor(laptop), {
      userId: 'dana', devicePubKey: phone.devicePubB64
    }, now)).reason).toBe('cert_not_yet_valid');
  });

  it('a tampered field breaks the signature', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    const tampered = { ...cert, capabilities: ['sign', 'admin'] as ('sign' | 'admin')[] };
    const res = await verifyDeviceCert(tampered, resolverFor(laptop), {
      userId: 'dana', devicePubKey: phone.devicePubB64
    });
    expect(res.ok).toBe(false);
  });

  it('a parent unknown to the resolver (revoked/foreign) is rejected', async () => {
    const laptop = await makeIdentity('dana');
    const phone = await makeIdentity('dana');
    const cert = await signDeviceCert(laptop, {
      userId: 'dana', devicePubKey: phone.devicePubB64, deviceLabel: 'phone'
    });
    // resolver knows nothing — same behavior resolveFromStore has for revoked keys
    const res = await verifyDeviceCert(cert, async () => null, {
      userId: 'dana', devicePubKey: phone.devicePubB64
    });
    expect(res).toMatchObject({ ok: false, reason: 'unknown_or_revoked_device' });
  });
});
