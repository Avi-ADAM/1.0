// B3 (O-1) — the strict Ed25519 rule, and what the platform's WebCrypto does
// without it. The second block documents the runtime, not the format: if a
// Node upgrade changes it, update SPEC §3's table — the vectors stay as they are.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { b64urlEncode } from './b64';
import { signCanonical } from './sign';
import { verifySignedObject } from './verify';
import type { JsonValue } from './canonical';
import {
  ed25519KeyStatus,
  ed25519SigStatus,
  ed25519SpkiAcceptable,
  ed25519RawFromSpki,
  ED25519_L
} from './ed25519Strict';

const unhex = (s: string) => Uint8Array.from(Buffer.from(s, 'hex'));
const buf = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
type Edge = { name: string; publicKeyHex: string; messageHex: string; signatureHex: string; expect: string };
const edges: Edge[] = JSON.parse(
  readFileSync(resolve(process.cwd(), 'spec/consent-v1/signatures.json'), 'utf8')
).ed25519Edge;

describe('ed25519KeyStatus', () => {
  it('honest keys pass; the 8 torsion points (and their second spellings) do not', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign'])) as CryptoKeyPair;
    expect(ed25519KeyStatus(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)))).toBe('ok');
    for (const h of [
      '0100000000000000000000000000000000000000000000000000000000000000',
      'ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f',
      '0000000000000000000000000000000000000000000000000000000000000000',
      '0000000000000000000000000000000000000000000000000000000000000080',
      'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
      '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05'
    ]) expect(ed25519KeyStatus(unhex(h)), h).toBe('small_order');
    expect(ed25519KeyStatus(unhex('eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f'))).toBe('non_canonical');
    expect(ed25519KeyStatus(unhex('0100000000000000000000000000000000000000000000000000000000000080'))).toBe('non_canonical');
    expect(ed25519KeyStatus(new Uint8Array(31))).toBe('bad_length');
  });

  it('the SPKI gate reads only an Ed25519 SPKI', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign'])) as CryptoKeyPair;
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey));
    expect(ed25519SpkiAcceptable(b64urlEncode(spki))).toBe(true);
    const weak = new Uint8Array(spki);
    weak.set(unhex('0100000000000000000000000000000000000000000000000000000000000000'), 12);
    expect(ed25519SpkiAcceptable(b64urlEncode(weak))).toBe(false);
    const p256 = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])) as CryptoKeyPair;
    expect(ed25519RawFromSpki(new Uint8Array(await crypto.subtle.exportKey('spki', p256.publicKey)))).toBeNull();
    expect(ed25519SpkiAcceptable('!!')).toBe(false);
  });
});

describe('ed25519SigStatus', () => {
  it('S must be below L, R must not be the identity', () => {
    const sig = new Uint8Array(64);
    sig[0] = 2;
    expect(ed25519SigStatus(sig)).toBe('ok');
    let l = ED25519_L;
    for (let i = 32; i < 64; i++) { sig[i] = Number(l & 0xffn); l >>= 8n; }
    expect(ed25519SigStatus(sig)).toBe('non_canonical_s');
    const idR = new Uint8Array(64);
    idR[0] = 1;
    expect(ed25519SigStatus(idR)).toBe('identity_r');
    expect(ed25519SigStatus(new Uint8Array(63))).toBe('bad_length');
  });
});

describe('verifySignedObject applies the rule', () => {
  it('a small-order key names no device, even though the equation holds', async () => {
    const identity = unhex('0100000000000000000000000000000000000000000000000000000000000000');
    const key = await crypto.subtle.importKey('raw', buf(identity), { name: 'Ed25519' }, true, ['verify']);
    const body = { v: 1, actor: 'u-x', device: 'whatever', note: 'any message at all' };
    // R = O, S = 0 — no private key involved.
    const sig = b64urlEncode(new Uint8Array([...identity, ...new Uint8Array(32)]));
    const id = 'x';
    const res = await verifySignedObject({ ...body, sig, id }, async () => ({ key, algo: 'Ed25519' }));
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown_or_revoked_device: weak_key small_order');
  });

  it('an honest signature still verifies', async () => {
    const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const body = { v: 1, actor: 'u-y', device: 'd', note: 'שלום' };
    const { sig, id } = await signCanonical(body as unknown as JsonValue, kp.privateKey, 'Ed25519');
    expect(await verifySignedObject({ ...body, sig, id }, async () => ({ key: kp.publicKey, algo: 'Ed25519' }))).toEqual({ ok: true });
  });
});

describe('what this runtime\'s WebCrypto does with the edge vectors on its own', () => {
  // Node 22 / OpenSSL, observed 2026-11-06 — SPEC §3. Every "reject" case except
  // s-plus-l passes raw WebCrypto: that is why rules 1 and 3 run before it.
  const OBSERVED: Record<string, boolean> = {
    honest: true,
    's-plus-l': false,
    'identity-key': true,
    'order-2-key': true,
    'non-canonical-identity-key': true,
    'mixed-order-key': true,
    'identity-r': true
  };
  it.each(edges.map((e) => [e.name, e] as const))('%s', async (_name, e) => {
    const key = await crypto.subtle.importKey('raw', buf(unhex(e.publicKeyHex)), { name: 'Ed25519' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'Ed25519' }, key, buf(unhex(e.signatureHex)), buf(unhex(e.messageHex)));
    expect(ok).toBe(OBSERVED[e.name]);
  });
});
