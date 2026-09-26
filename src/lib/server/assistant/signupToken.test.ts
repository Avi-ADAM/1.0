import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { mintSignupToken, openSignupToken, SIGNUP_TOKEN_TTL_MS } from './signupToken.js';

const key = crypto.randomBytes(32);
const other = crypto.randomBytes(32);
const input = { sid: '7', name: 'דנה', email: 'dana@x.co', countryIds: [104], intent: 'business' as const, lang: 'he' };

describe('signup token', () => {
  it('round-trips within its day', () => {
    const t = mintSignupToken(input, 1000, key);
    expect(openSignupToken(t, 1000 + SIGNUP_TOKEN_TTL_MS - 1, key)).toEqual({ ...input, exp: 1000 + SIGNUP_TOKEN_TTL_MS });
  });

  it('is null when expired, tampered, from another key, or not a token', () => {
    const t = mintSignupToken(input, 1000, key);
    expect(openSignupToken(t, 1000 + SIGNUP_TOKEN_TTL_MS, key)).toBeNull();
    expect(openSignupToken(t, 1000, other)).toBeNull();
    const [iv, ct, tag] = t.split('.');
    const flipped = Buffer.from(ct, 'base64url');
    flipped[0] ^= 1;
    expect(openSignupToken(`${iv}.${flipped.toString('base64url')}.${tag}`, 1000, key)).toBeNull();
    for (const junk of [undefined, 42, '', 'a.b', 'a.b.c', 'x'.repeat(5000)]) {
      expect(openSignupToken(junk, 1000, key)).toBeNull();
    }
  });

  it('carries nothing a stranger reading the URL could not already see on the screen', () => {
    const t = mintSignupToken(input, 1000, key);
    expect(t).not.toContain('dana');
    expect(Buffer.from(t.split('.')[1], 'base64url').toString('utf8')).not.toContain('dana');
  });
});
