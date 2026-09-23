import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { RateLimiter, p2pRoom, sameRoom, verifyP2pTicket } from './p2p.js';

const KEY = 'a-long-enough-test-secret';

/** Same derivation as 1.0main/src/lib/server/p2p/ticket.ts mintTicket. */
function mint(payload: Record<string, unknown>, key = KEY): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${b64}.${createHmac('sha256', key).update(b64).digest('base64url')}`;
}

describe('verifyP2pTicket', () => {
  const good = { v: 1, u: '7', p: '82', exp: 10_000 };

  it('accepts a ticket minted by the main app', () => {
    expect(verifyP2pTicket(mint(good), KEY, 5_000)).toEqual({ uid: '7', projectId: '82', expiresAt: 10_000 });
  });

  it('fails closed without a secret', () => {
    expect(verifyP2pTicket(mint(good), null, 5_000)).toBeNull();
  });

  it('rejects expired, re-signed, forged and malformed tickets', () => {
    expect(verifyP2pTicket(mint(good), KEY, 10_000)).toBeNull();
    expect(verifyP2pTicket(mint(good, 'someone-elses-secret'), KEY, 5_000)).toBeNull();
    const [, mac] = mint(good).split('.');
    const swapped = Buffer.from(JSON.stringify({ ...good, p: '99' })).toString('base64url');
    expect(verifyP2pTicket(`${swapped}.${mac}`, KEY, 5_000)).toBeNull();
    expect(verifyP2pTicket(mint({ ...good, p: '82 OR 1' }), KEY, 5_000)).toBeNull();
    expect(verifyP2pTicket(mint({ ...good, v: 2 }), KEY, 5_000)).toBeNull();
    expect(verifyP2pTicket(42, KEY)).toBeNull();
    expect(verifyP2pTicket('x'.repeat(2000), KEY)).toBeNull();
  });
});

describe('sameRoom', () => {
  const room = p2pRoom('82');
  it('relays only when both ends sit in the rikma room', () => {
    expect(sameRoom(new Set([room]), new Set([room]), room)).toBe(true);
    expect(sameRoom(new Set([room]), new Set([p2pRoom('83')]), room)).toBe(false);
    expect(sameRoom(new Set(), new Set([room]), room)).toBe(false);
    expect(sameRoom(new Set([room]), undefined, room)).toBe(false);
  });
});

describe('RateLimiter', () => {
  it('allows the limit per window and recovers after it', () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.allow('s', 0)).toBe(true);
    expect(rl.allow('s', 10)).toBe(true);
    expect(rl.allow('s', 20)).toBe(false);
    expect(rl.allow('other', 20)).toBe(true);
    expect(rl.allow('s', 1500)).toBe(true);
  });
});
