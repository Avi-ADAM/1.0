// B2 (PLAN_DISTRIBUTED_EXECUTION, O-2): the signer emits low-S ECDSA; the
// verifier keeps accepting both forms.

import { describe, it, expect } from 'vitest';
import { signCanonical } from './sign';
import { verifySignedObject } from './verify';
import { b64urlDecode, b64urlEncode } from './b64';
import { canonicalBytes } from './canonical';
import { isLowS, mirrorS, normalizeLowS, p256S, P256_N } from './lowS';

async function p256() {
  const kp = (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair;
  const spki = b64urlEncode(await crypto.subtle.exportKey('spki', kp.publicKey));
  return { kp, spki };
}

const body = (device: string, i: number) => ({
  v: 1 as const,
  actor: 'u-dave',
  device,
  action: 'test.action',
  subject: { type: 'test', id: `s-${i}` },
  parents: [] as string[],
  ts: 1_700_000_000_000 + i,
  nonce: `n${i}`
});

describe('low-S normalisation (pure)', () => {
  it('mirror is an involution and flips the half', () => {
    const sig = new Uint8Array(64);
    sig[31] = 1; // r = 1
    sig[63] = 5; // s = 5 — low
    expect(isLowS(sig)).toBe(true);
    const hi = mirrorS(sig);
    expect(isLowS(hi)).toBe(false);
    expect(p256S(hi)).toBe(P256_N - 5n);
    expect(mirrorS(hi)).toEqual(sig);
    expect(normalizeLowS(hi)).toEqual(sig);
    expect(normalizeLowS(sig)).toEqual(sig);
    expect(hi.subarray(0, 32)).toEqual(sig.subarray(0, 32)); // r untouched
  });

  it('rejects anything that is not a 64-byte P1363 signature', () => {
    expect(() => p256S(new Uint8Array(70))).toThrow('p256_sig_not_p1363');
  });
});

describe('signCanonical with ECDSA-P256', () => {
  it('always emits s ≤ n/2 (50 signatures)', async () => {
    const { kp, spki } = await p256();
    for (let i = 0; i < 50; i++) {
      const { sig } = await signCanonical(body(spki, i), kp.privateKey, 'ECDSA-P256');
      expect(isLowS(b64urlDecode(sig)), `signature ${i}`).toBe(true);
    }
  });

  it('a high-S signature still verifies — old events stay valid', async () => {
    const { kp, spki } = await p256();
    const b = body(spki, 0);
    const raw = new Uint8Array(
      await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, canonicalBytes(b))
    );
    const high = isLowS(raw) ? mirrorS(raw) : raw;
    const sig = b64urlEncode(high);
    const idBuf = await crypto.subtle.digest('SHA-256', canonicalBytes({ ...b, sig }));
    const ev = { ...b, sig, id: b64urlEncode(idBuf) };
    const res = await verifySignedObject(ev, async () => ({ key: kp.publicKey, algo: 'ECDSA-P256' }));
    expect(res).toEqual({ ok: true });
  });
});
