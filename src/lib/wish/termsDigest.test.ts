import { describe, expect, it } from 'vitest';
import { signedUnderOtherTerms, termsCanonical, type WishTerms } from './termsDigest';
import { termsDigest } from '$lib/server/wish/termsDigest';

const base: WishTerms = {
  name: 'אתר לסטודיו',
  longDes: '<p>אתר תדמית עם   גלריה</p>',
  startDate: '2026-11-01T00:00:00.000Z',
  finnishDate: '2026-12-01T10:00:00.000Z',
  isOnline: false,
  location_hint: 'חיפה',
  lat: 32.794044,
  lng: 34.989571,
  radius: 10,
  location: [{ lat: 32.794044, lng: 34.989571, radius: 10, location_hint: 'חיפה' }]
};

describe('termsDigest — what the signatures are on', () => {
  it('the same terms in another spelling give the same digest', () => {
    const same: WishTerms = {
      ...base,
      longDes: 'אתר תדמית עם גלריה',
      finnishDate: '2026-12-01T12:00:00.000+02:00', // the same day, re-saved in another zone
      location: [null, { lat: 32.7940441, lng: 34.9895712, radius: 10, location_hint: ' חיפה ' }]
    };
    expect(termsDigest(same)).toBe(termsDigest(base));
    expect(termsDigest(base)).toMatch(/^t1:[A-Za-z0-9_-]{22}$/);
  });

  it('every term that defines the work changes it', () => {
    const d = termsDigest(base);
    const changes: WishTerms[] = [
      { name: 'אתר לחנות' },
      { longDes: 'אתר תדמית עם גלריה ובלוג' },
      { startDate: '2026-11-02T00:00:00.000Z' },
      { finnishDate: null },
      { isOnline: true },
      { location_hint: 'עכו' },
      { location: [{ lat: 32.92, lng: 35.07, radius: 10, location_hint: 'עכו' }] },
      // the composer's pin, on the wish itself
      { lat: 32.92, lng: 35.07 },
      { radius: 25 }
    ];
    for (const change of changes) expect(termsDigest({ ...base, ...change })).not.toBe(d);
  });

  it('what only shapes the page does not', () => {
    const extra = { ...base, pics: ['x.png'], restime: 'sevend', extracted_missions: [{ name: 'עיצוב' }] } as WishTerms;
    expect(termsDigest(extra)).toBe(termsDigest(base));
  });

  it('the short description stands in when there is no long one', () => {
    expect(termsCanonical({ desc: 'אתר' })).toBe(termsCanonical({ longDes: '', desc: 'אתר' }));
    expect(termsCanonical({ longDes: 'אתר', desc: 'משהו אחר' })).toBe(termsCanonical({ longDes: 'אתר' }));
  });

  it('a signature is stale only when both sides carry a digest and they differ', () => {
    expect(signedUnderOtherTerms('t1:A', 't1:B')).toBe(true);
    expect(signedUnderOtherTerms('t1:A', 't1:A')).toBe(false);
    expect(signedUnderOtherTerms(null, 't1:B')).toBe(false);
    expect(signedUnderOtherTerms('t1:A', null)).toBe(false);
  });
});
