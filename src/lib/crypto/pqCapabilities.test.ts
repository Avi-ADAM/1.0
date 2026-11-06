// C0 — PQ capability detection. The round-trip tests run only where the
// runtime has the algorithm (Node ≥ 24.7); on Node 22 they are skipped, and
// the detection itself must still answer, not throw.

import { describe, it, expect, beforeAll } from 'vitest';
import { pqCapabilities, _resetPqCapabilities, type PqCapabilities } from './pqCapabilities';

let caps: PqCapabilities;
beforeAll(async () => {
  _resetPqCapabilities();
  caps = await pqCapabilities();
});

const nodeMajor = Number(process.versions.node.split('.')[0]);
const nodeMinor = Number(process.versions.node.split('.')[1]);

describe('pqCapabilities', () => {
  it('answers with two booleans, once', async () => {
    expect(typeof caps.mldsa65).toBe('boolean');
    expect(typeof caps.mlkem768).toBe('boolean');
    expect(await pqCapabilities()).toBe(caps); // memoised object
  });

  it('matches the runtime: Node ≥ 24.7 has both, Node 22 neither', () => {
    const modern = nodeMajor > 24 || (nodeMajor === 24 && nodeMinor >= 7);
    if (modern) expect(caps).toEqual({ mldsa65: true, mlkem768: true });
    if (nodeMajor <= 22) expect(caps).toEqual({ mldsa65: false, mlkem768: false });
  });

  it.skipIf(!caps?.mldsa65 && nodeMajor < 24)('ML-DSA-65 signs and verifies', async () => {
    if (!caps.mldsa65) return; // capability probe said no on this 24.x
    const kp = (await crypto.subtle.generateKey({ name: 'ML-DSA-65' } as AlgorithmIdentifier, true, ['sign', 'verify'])) as CryptoKeyPair;
    const msg = new TextEncoder().encode('1lev1');
    const sig = await crypto.subtle.sign({ name: 'ML-DSA-65' } as AlgorithmIdentifier, kp.privateKey, msg);
    expect(await crypto.subtle.verify({ name: 'ML-DSA-65' } as AlgorithmIdentifier, kp.publicKey, sig, msg)).toBe(true);
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey));
    expect(spki.length).toBeGreaterThan(1900); // why B4 exists: ~1,974 bytes
  });
});
