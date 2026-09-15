import { describe, it, expect } from 'vitest';
import { createVerify, generateKeyPairSync } from 'node:crypto';
import { createAppJwt, normalizePrivateKey } from './appJwt';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});

describe('createAppJwt', () => {
  it('produces a verifiable RS256 token with GitHub’s claims', () => {
    const jwt = createAppJwt('12345', privateKey, 1_700_000_000);
    const [h, p, s] = jwt.split('.');

    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(JSON.parse(Buffer.from(p, 'base64url').toString())).toEqual({
      iat: 1_700_000_000 - 60,
      exp: 1_700_000_000 + 540,
      iss: '12345'
    });

    const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(publicKey, Buffer.from(s, 'base64url'));
    expect(ok).toBe(true);
  });

  it('accepts a PEM flattened into one env line', () => {
    const flat = privateKey.replace(/\n/g, '\\n');
    expect(normalizePrivateKey(flat)).toBe(privateKey.trim());
    expect(normalizePrivateKey(`"${flat}"`)).toBe(privateKey.trim());
    expect(() => createAppJwt('1', flat)).not.toThrow();
  });
});
