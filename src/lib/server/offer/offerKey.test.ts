import { describe, expect, it } from 'vitest';
import { checkOfferKey, emailLock, emailMayClaim, mintOfferKey, nextLinkAt, offerKeyId } from './offerKey.js';
import { mintShareKey } from '$lib/server/assistant/shareKey.js';

const secret = Buffer.alloc(32, 3);
const other = Buffer.alloc(32, 4);
const at = '2026-10-06T09:00:00.000Z';
const row = { id: '16', offer_link_at: at };

describe('direct-offer link keys', () => {
  it('open the wish they were signed for, while the link is the current one', () => {
    const key = mintOfferKey('16', at, secret);
    expect(key).toMatch(/^16\.[A-Za-z0-9_-]{43}$/);
    expect(offerKeyId(key)).toBe('16');
    expect(checkOfferKey(key, row, new Date(), secret)).toBe('ok');
    // Strapi may hand the same instant back in another spelling.
    expect(checkOfferKey(key, { id: '16', offer_link_at: '2026-10-06T09:00:00.000+00:00' }, new Date(), secret)).toBe('ok');
  });

  it('a new link, a revoked one, another wish or another secret: invalid, all alike', () => {
    const key = mintOfferKey('16', at, secret);
    expect(checkOfferKey(key, { id: '16', offer_link_at: nextLinkAt(at, new Date(at)) }, new Date(), secret)).toBe('invalid');
    expect(checkOfferKey(key, { id: '16', offer_link_at: null }, new Date(), secret)).toBe('invalid');
    expect(checkOfferKey(key, { id: '17', offer_link_at: at }, new Date(), secret)).toBe('invalid');
    expect(checkOfferKey(key, row, new Date(), other)).toBe('invalid');
    expect(checkOfferKey('16.' + 'A'.repeat(43), row, new Date(), secret)).toBe('invalid');
    expect(checkOfferKey('nonsense', row, new Date(), secret)).toBe('invalid');
    expect(offerKeyId(42)).toBeNull();
  });

  it('a key signed under another derived key (a rikma preview link) never opens an offer', () => {
    const preview = mintShareKey('16', at, other);
    expect(checkOfferKey(preview, row, new Date(), secret)).toBe('invalid');
  });

  it('expires only when an expiry is set (none is, for now — decision 3)', () => {
    const key = mintOfferKey('16', at, secret);
    const later = new Date('2027-01-01T00:00:00.000Z');
    expect(checkOfferKey(key, { ...row, offer_expires_at: null }, later, secret)).toBe('ok');
    expect(checkOfferKey(key, { ...row, offer_expires_at: '2026-12-01T00:00:00.000Z' }, later, secret)).toBe('expired');
  });

  it('a new link is always later than the current one', () => {
    const now = new Date(at);
    expect(nextLinkAt(null, now)).toBe(at);
    expect(nextLinkAt(at, now)).toBe('2026-10-06T09:00:00.001Z');
    expect(nextLinkAt('2026-10-07T00:00:00.000Z', now)).toBe('2026-10-07T00:00:00.001Z');
  });
});

describe('the email lock', () => {
  it('stores no address, and matches the same address in any case or spacing', () => {
    const lock = emailLock('Dana@Example.com', secret);
    expect(lock).toMatch(/^e1:/);
    expect(lock.toLowerCase()).not.toContain('dana');
    expect(emailMayClaim(lock, ' dana@example.com ', secret)).toBe(true);
    expect(emailMayClaim(lock, 'other@example.com', secret)).toBe(false);
    expect(emailMayClaim(lock, null, secret)).toBe(false);
    expect(emailMayClaim(lock, 'dana@example.com', other)).toBe(false);
  });

  it('no lock: whoever has the link may claim', () => {
    expect(emailMayClaim(null, 'anyone@example.com', secret)).toBe(true);
    expect(emailMayClaim('', null, secret)).toBe(true);
  });
});
