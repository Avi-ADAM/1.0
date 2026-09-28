import { describe, expect, it } from 'vitest';
import { mintShareKey, nextShareExpiry, shareKeyId, verifyShareKey } from './shareKey.js';

const secret = Buffer.alloc(32, 7);
const other = Buffer.alloc(32, 8);
const exp = '2026-10-28T21:09:16.629Z';

describe('preview share keys', () => {
  it('verify for the row they were signed for, and only while its expiry is the one signed', () => {
    const key = mintShareKey('2', exp, secret);
    expect(key).toMatch(/^2\.[A-Za-z0-9_-]{43}$/);
    expect(shareKeyId(key)).toBe('2');
    expect(verifyShareKey(key, { id: '2', shareExpiresAt: exp }, secret)).toBe(true);
    // Strapi may hand the same instant back in another spelling.
    expect(verifyShareKey(key, { id: '2', shareExpiresAt: '2026-10-28T21:09:16.629+00:00' }, secret)).toBe(true);

    // A new link (new expiry), a revoked one (no expiry), another row, another secret.
    expect(verifyShareKey(key, { id: '2', shareExpiresAt: '2026-10-28T21:09:16.630Z' }, secret)).toBe(false);
    expect(verifyShareKey(key, { id: '2', shareExpiresAt: null }, secret)).toBe(false);
    expect(verifyShareKey(key, { id: '3', shareExpiresAt: exp }, secret)).toBe(false);
    expect(verifyShareKey(key, { id: '2', shareExpiresAt: exp }, other)).toBe(false);
  });

  it('a key moved to another id, a tampered signature, and the old random format all fail', () => {
    const key = mintShareKey('2', exp, secret);
    const sig = key.split('.')[1];
    expect(verifyShareKey(`3.${sig}`, { id: '3', shareExpiresAt: exp }, secret)).toBe(false);
    const flipped = sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A');
    expect(verifyShareKey(`2.${flipped}`, { id: '2', shareExpiresAt: exp }, secret)).toBe(false);
    for (const bad of ['DD_O5sx49kUoh7De_K-v3UfoLtwERCHZ', 'x"} or {', '2.', `.${sig}`, `2.${sig}.x`, 42]) {
      expect(shareKeyId(bad)).toBeNull();
    }
  });

  it('a new link always expires later than the current one, so it always replaces it', () => {
    const now = new Date('2026-09-28T21:09:16.629Z');
    expect(nextShareExpiry(null, now, 30)).toBe(exp);
    expect(nextShareExpiry(exp, now, 30)).toBe('2026-10-28T21:09:16.630Z');
    expect(nextShareExpiry('2026-10-01T00:00:00.000Z', now, 30)).toBe(exp);
  });
});
