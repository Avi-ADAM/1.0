import { describe, it, expect } from 'vitest';
import { chooseAlgorithm, algoParams, resetAlgorithmCache } from './algorithm';
import { signCanonical, bodyForSigning } from './sign';
import { verifySignedObject } from './verify';
import { b64urlEncode } from './b64';

async function makeKeyPair() {
  resetAlgorithmCache();
  const algo = await chooseAlgorithm();
  const kp = (await crypto.subtle.generateKey(
    algoParams(algo) as Algorithm,
    true, // extractable so tests can re-import the public key
    ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  return { algo, kp, devicePubB64: b64urlEncode(spki) };
}

describe('signCanonical / verifySignedObject round-trip', () => {
  it('signs and verifies a minimal event', async () => {
    const { algo, kp, devicePubB64 } = await makeKeyPair();
    const partial = {
      v: 1 as const,
      actor: 'user-1',
      device: devicePubB64,
      action: 'test.action',
      subject: { type: 'test', id: 'subj-1' },
      parents: [] as string[],
      ts: 1700000000000,
      nonce: 'aaaa'
    };
    const { sig, id } = await signCanonical(partial, kp.privateKey, algo);
    const ev = { ...partial, sig, id };

    const res = await verifySignedObject(ev, async () => ({ key: kp.publicKey, algo }));
    expect(res.ok).toBe(true);
  });

  it('rejects tampered body', async () => {
    const { algo, kp, devicePubB64 } = await makeKeyPair();
    const partial = {
      v: 1 as const,
      actor: 'user-1',
      device: devicePubB64,
      action: 'test.action',
      subject: { type: 'test', id: 'subj-1' },
      parents: [] as string[],
      ts: 1700000000000,
      nonce: 'aaaa'
    };
    const { sig, id } = await signCanonical(partial, kp.privateKey, algo);
    const tampered = { ...partial, sig, id, ts: partial.ts + 1 };

    const res = await verifySignedObject(tampered, async () => ({ key: kp.publicKey, algo }));
    expect(res.ok).toBe(false);
  });

  it('rejects wrong public key', async () => {
    const { algo, kp, devicePubB64 } = await makeKeyPair();
    const other = await makeKeyPair();
    const partial = {
      v: 1 as const,
      actor: 'user-1',
      device: devicePubB64,
      action: 'test.action',
      subject: { type: 'test', id: 'subj-1' },
      parents: [] as string[],
      ts: 1700000000000,
      nonce: 'aaaa'
    };
    const { sig, id } = await signCanonical(partial, kp.privateKey, algo);
    const ev = { ...partial, sig, id };

    const res = await verifySignedObject(ev, async () => ({ key: other.kp.publicKey, algo: other.algo }));
    expect(res.ok).toBe(false);
  });

  it('rejects unknown device (resolver returns null)', async () => {
    const { algo, kp, devicePubB64 } = await makeKeyPair();
    const partial = {
      v: 1 as const,
      actor: 'user-1',
      device: devicePubB64,
      action: 'test.action',
      subject: { type: 'test', id: 'subj-1' },
      parents: [] as string[],
      ts: 1700000000000,
      nonce: 'aaaa'
    };
    const { sig, id } = await signCanonical(partial, kp.privateKey, algo);
    const ev = { ...partial, sig, id };

    const res = await verifySignedObject(ev, async () => null);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('unknown_or_revoked_device');
  });

  it('rejects tampered id', async () => {
    const { algo, kp, devicePubB64 } = await makeKeyPair();
    const partial = {
      v: 1 as const,
      actor: 'user-1',
      device: devicePubB64,
      action: 'test.action',
      subject: { type: 'test', id: 'subj-1' },
      parents: [] as string[],
      ts: 1700000000000,
      nonce: 'aaaa'
    };
    const { sig, id } = await signCanonical(partial, kp.privateKey, algo);
    void id;
    const ev = { ...partial, sig, id: 'AAAA' };

    const res = await verifySignedObject(ev, async () => ({ key: kp.publicKey, algo }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('bad_id');
  });
});

describe('bodyForSigning', () => {
  it('strips id and sig', () => {
    const body = bodyForSigning({ id: 'x', sig: 'y', a: 1 } as { id: string; sig: string; a: number });
    expect(body).toEqual({ a: 1 });
  });
});
