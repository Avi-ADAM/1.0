import { describe, expect, it } from 'vitest';
import { assertTermsSeen, entryInput, signDigestOf, wishDigestOf, type WishProposal } from './proposal';
import { termsDigest } from './termsDigest';

/** PLAN_DIRECT_OFFER §4.3 — the terms a signature stands behind survive every rewrite of the log. */

describe('entryInput', () => {
  it('keeps the terms an earlier signature was made under', () => {
    const e = {
      user: { data: { id: '20' } },
      agree: false,
      note: 'עוד שעתיים',
      submittedAt: '2026-10-06T09:00:00.000Z',
      willingHours: 6,
      willingAmount: 680,
      termsDigest: 't1:abc'
    };
    expect(entryInput(e)).toEqual({
      user: '20',
      agree: false,
      note: 'עוד שעתיים',
      submittedAt: '2026-10-06T09:00:00.000Z',
      willingHours: 6,
      willingAmount: 680,
      termsDigest: 't1:abc'
    });
    expect(entryInput({ user: '20', agree: true })).not.toHaveProperty('termsDigest');
  });
});

describe('the digest a signature records', () => {
  const wish = { name: 'אתר', longDes: 'אתר תדמית', startDate: null, finnishDate: '2026-12-01T00:00:00.000Z' };

  it('is the stored one, or the terms as they stand while none is stored', () => {
    expect(signDigestOf({ ...wish, terms_digest: 't1:stored' })).toBe('t1:stored');
    expect(signDigestOf(wish)).toBe(termsDigest(wish));
  });

  it('only a stored digest can make a signature stale', () => {
    expect(wishDigestOf(wish)).toBeNull();
    expect(wishDigestOf({ ...wish, terms_digest: 't1:stored' })).toBe('t1:stored');
  });
});

describe('assertTermsSeen — approving from a notice after the wish changed', () => {
  const p = (termsChanged: boolean) =>
    ({ ratsonAttrs: { terms_digest: 't1:new' }, standing: { termsChanged } }) as unknown as WishProposal;

  it('refuses an approval from a notice that never showed the new terms', () => {
    expect(() => assertTermsSeen({ expectRound: 1 }, p(true))).toThrow(/changed/);
    expect(() => assertTermsSeen({ expectRound: 1, expectTerms: 't1:old' }, p(true))).toThrow(/changed/);
  });

  it('lets through one that names the terms now on the table, and anything from the wish page', () => {
    expect(() => assertTermsSeen({ expectRound: 1, expectTerms: 't1:new' }, p(true))).not.toThrow();
    expect(() => assertTermsSeen({}, p(true))).not.toThrow();
    expect(() => assertTermsSeen({ expectRound: 1 }, p(false))).not.toThrow();
  });
});
