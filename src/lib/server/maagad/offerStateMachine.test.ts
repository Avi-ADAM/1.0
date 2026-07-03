import { describe, expect, it } from 'vitest';
import {
  applySignature,
  applyUnsign,
  canConfirm,
  canSign,
  resolveTierPrice,
  shouldExpire,
  type OfferState
} from './offerStateMachine.js';

const base = (over: Partial<OfferState> = {}): OfferState => ({
  status: 'open',
  signedCount: 0,
  minParticipants: 3,
  maxParticipants: null,
  signDeadline: null,
  ...over
});

const HOUR = 3600_000;

describe('canSign', () => {
  it('allows signing an open offer with no deadline', () => {
    expect(canSign(base()).ok).toBe(true);
  });
  it('still allows signing after quorum (toward capacity)', () => {
    expect(canSign(base({ status: 'quorum_reached', signedCount: 3 })).ok).toBe(true);
  });
  it('rejects a passed deadline', () => {
    const r = canSign(base({ signDeadline: Date.now() - HOUR }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/deadline/);
  });
  it('rejects when full', () => {
    expect(canSign(base({ signedCount: 5, maxParticipants: 5 })).ok).toBe(false);
  });
  it('rejects activated/expired/withdrawn offers', () => {
    for (const status of ['activated', 'expired', 'withdrawn'] as const) {
      expect(canSign(base({ status })).ok).toBe(false);
    }
  });
});

describe('applySignature', () => {
  it('increments the count without reaching quorum', () => {
    expect(applySignature(base({ signedCount: 1 }))).toEqual({ signedCount: 2, status: 'open' });
  });
  it('flips to quorum_reached on the threshold signature', () => {
    expect(applySignature(base({ signedCount: 2 }))).toEqual({
      signedCount: 3,
      status: 'quorum_reached'
    });
  });
  it('never downgrades an already-reached quorum', () => {
    expect(applySignature(base({ status: 'quorum_reached', signedCount: 3 })).status).toBe(
      'quorum_reached'
    );
  });
});

describe('applyUnsign', () => {
  it('drops back to open when falling below min after quorum', () => {
    expect(applyUnsign(base({ status: 'quorum_reached', signedCount: 3 }))).toEqual({
      signedCount: 2,
      status: 'open'
    });
  });
  it('keeps quorum when still at or above min', () => {
    expect(applyUnsign(base({ status: 'quorum_reached', signedCount: 4 }))).toEqual({
      signedCount: 3,
      status: 'quorum_reached'
    });
  });
  it('never goes below zero', () => {
    expect(applyUnsign(base({ signedCount: 0 })).signedCount).toBe(0);
  });
});

describe('shouldExpire', () => {
  it('expires an open offer past its deadline', () => {
    expect(shouldExpire(base({ signDeadline: Date.now() - HOUR }))).toBe(true);
  });
  it('expires a quorum_reached offer the supplier never confirmed', () => {
    expect(shouldExpire(base({ status: 'quorum_reached', signDeadline: Date.now() - HOUR }))).toBe(
      true
    );
  });
  it('does not expire before the deadline', () => {
    expect(shouldExpire(base({ signDeadline: Date.now() + HOUR }))).toBe(false);
  });
  it('does not expire an activated offer', () => {
    expect(shouldExpire(base({ status: 'activated', signDeadline: Date.now() - HOUR }))).toBe(false);
  });
});

describe('canConfirm', () => {
  it('allows confirming a reached quorum', () => {
    expect(canConfirm(base({ status: 'quorum_reached', signedCount: 3 })).ok).toBe(true);
  });
  it('allows the supplier to activate below min while still open (their right, §7.3)', () => {
    expect(canConfirm(base({ status: 'open', signedCount: 2, signDeadline: Date.now() + HOUR })).ok).toBe(
      true
    );
  });
  it('rejects when there are no signatures', () => {
    expect(canConfirm(base({ signedCount: 0 })).ok).toBe(false);
  });
  it('rejects an already-activated offer', () => {
    expect(canConfirm(base({ status: 'activated', signedCount: 3 })).ok).toBe(false);
  });
});

describe('resolveTierPrice', () => {
  const tiers = [
    { min: 10, price: 100 },
    { min: 20, price: 80 }
  ];
  it('falls back to unit price with no tiers', () => {
    expect(resolveTierPrice(120, null, 15)).toBe(120);
  });
  it('picks the highest qualifying tier', () => {
    expect(resolveTierPrice(120, tiers, 25)).toBe(80);
    expect(resolveTierPrice(120, tiers, 12)).toBe(100);
  });
  it('falls back to unit price below the first tier', () => {
    expect(resolveTierPrice(120, tiers, 5)).toBe(120);
  });
});
