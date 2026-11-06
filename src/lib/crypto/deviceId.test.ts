// B4 (O-7) — the device fingerprint and how a reader tells the two forms apart.

import { describe, it, expect } from 'vitest';
import { b64urlEncode } from './b64';
import { deviceFingerprint, findDevice, isDeviceFingerprint, sameDevice, DEVICE_ID_LENGTH } from './deviceId';

async function spkiOf(params: AlgorithmIdentifier | EcKeyGenParams): Promise<string> {
  const kp = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  return b64urlEncode(await crypto.subtle.exportKey('spki', kp.publicKey));
}

describe('deviceFingerprint', () => {
  it('is b64url(SHA-256(SPKI DER)), 43 characters', async () => {
    const spki = await spkiOf({ name: 'Ed25519' });
    const fp = await deviceFingerprint(spki);
    expect(fp).toHaveLength(DEVICE_ID_LENGTH);
    const der = Uint8Array.from(atob(spki.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    expect(fp).toBe(b64urlEncode(await crypto.subtle.digest('SHA-256', der)));
    expect(await deviceFingerprint(spki)).toBe(fp); // memoised, same answer
  });
});

describe('isDeviceFingerprint', () => {
  it('no SPKI ever reads as a fingerprint', async () => {
    expect(isDeviceFingerprint(await spkiOf({ name: 'Ed25519' }))).toBe(false);
    expect(isDeviceFingerprint(await spkiOf({ name: 'ECDSA', namedCurve: 'P-256' }))).toBe(false);
  });

  it('only the canonical spelling of 32 bytes', async () => {
    const fp = await deviceFingerprint(await spkiOf({ name: 'Ed25519' }));
    expect(isDeviceFingerprint(fp)).toBe(true);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const last = alphabet.indexOf(fp[42]);
    expect(isDeviceFingerprint(fp.slice(0, 42) + alphabet[last | 1])).toBe(false); // trailing bits set
    expect(isDeviceFingerprint(fp.slice(0, 42))).toBe(false);
    expect(isDeviceFingerprint(fp + 'A')).toBe(false);
    expect(isDeviceFingerprint(fp.slice(0, 42) + '='.slice(0, 1))).toBe(false);
    expect(isDeviceFingerprint(null)).toBe(false);
    expect(isDeviceFingerprint(42)).toBe(false);
  });
});

describe('sameDevice / findDevice', () => {
  it('either form names the key; another key\'s fingerprint does not', async () => {
    const a = await spkiOf({ name: 'Ed25519' });
    const b = await spkiOf({ name: 'Ed25519' });
    expect(await sameDevice(a, a)).toBe(true);
    expect(await sameDevice(await deviceFingerprint(a), a)).toBe(true);
    expect(await sameDevice(await deviceFingerprint(b), a)).toBe(false);
    expect(await sameDevice(b, a)).toBe(false);
    expect(await sameDevice(await deviceFingerprint(a), 'not!b64')).toBe(false);
  });

  it('finds by SPKI or by fingerprint, and only among the candidates', async () => {
    const a = await spkiOf({ name: 'Ed25519' });
    const b = await spkiOf({ name: 'ECDSA', namedCurve: 'P-256' });
    const rows = [{ k: a, n: 1 }, { k: b, n: 2 }];
    expect((await findDevice(b, rows, (r) => r.k))?.n).toBe(2);
    expect((await findDevice(await deviceFingerprint(b), rows, (r) => r.k))?.n).toBe(2);
    expect(await findDevice(await deviceFingerprint(a), [rows[1]], (r) => r.k)).toBeUndefined();
    expect(await findDevice('MCowBQ', rows, (r) => r.k)).toBeUndefined();
  });
});
