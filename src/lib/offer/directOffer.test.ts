import { describe, expect, it } from 'vitest';
import { claimRefusal, cleanLines, MAX_LINES, offerTotal, offerView } from './directOffer';

describe('cleanLines — what a provider may offer', () => {
  it('cleans and prices the parts', () => {
    const out = cleanLines({
      missions: [{ name: ' עיצוב ', hours: '10', ratePerHour: 120 }],
      resources: [{ name: 'אחסון לשנה', quantity: 1, unitPrice: 300, notes: ' כולל דומיין ' }]
    });
    expect(out).toEqual({
      lines: {
        missions: [{ name: 'עיצוב', hours: 10, ratePerHour: 120, notes: '' }],
        resources: [{ name: 'אחסון לשנה', quantity: 1, unitPrice: 300, notes: 'כולל דומיין' }]
      }
    });
    if ('lines' in out) expect(offerTotal(out.lines)).toBe(1500);
  });

  it('says why it cannot be an offer', () => {
    expect(cleanLines({})).toEqual({ refusal: 'none' });
    expect(cleanLines({ missions: Array.from({ length: MAX_LINES + 1 }, (_, i) => ({ name: `m${i}`, hours: 1, ratePerHour: 1 })) })).toEqual({ refusal: 'tooMany' });
    expect(cleanLines({ missions: [{ name: ' ', hours: 1, ratePerHour: 1 }] })).toEqual({ refusal: 'name' });
    // the name is the bridge from a line back to its part: one name per kind
    expect(cleanLines({ missions: [{ name: 'עיצוב', hours: 1, ratePerHour: 1 }, { name: 'עיצוב ', hours: 2, ratePerHour: 1 }] })).toEqual({ refusal: 'duplicate' });
    expect(cleanLines({ missions: [{ name: 'עיצוב', hours: 0, ratePerHour: 100 }] })).toEqual({ refusal: 'amount' });
    expect(cleanLines({ missions: [{ name: 'עיצוב', hours: 2, ratePerHour: -1 }] })).toEqual({ refusal: 'amount' });
    expect(cleanLines({ resources: [{ name: 'אחסון', quantity: 'x', unitPrice: 1 }] })).toEqual({ refusal: 'amount' });
  });

  it('the same name may be a task and a resource', () => {
    const out = cleanLines({ missions: [{ name: 'צילום', hours: 2, ratePerHour: 100 }], resources: [{ name: 'צילום', quantity: 1, unitPrice: 50 }] });
    expect('lines' in out).toBe(true);
  });
});

const raw = (over: Record<string, unknown> = {}) => ({
  ratson: {
    data: {
      id: '40',
      attributes: {
        name: 'אתר לסטודיו',
        longDes: '<p>אתר תדמית</p>',
        startDate: '2026-11-01T00:00:00.000Z',
        finnishDate: null,
        isOnline: true,
        location_hint: null,
        status_ratson: 'draft',
        fulfilled: false,
        offer_recipient_hint: 'דנה',
        offer_email_lock: 'e1:abc',
        offer_link_at: '2026-10-07T08:00:00.000Z',
        offer_expires_at: null,
        claimed_at: null,
        offered_by: { data: { id: '256', attributes: { username: 'ברוך', profilePic: { data: null } } } },
        offered_by_project: { data: null },
        users_permissions_users: { data: [] },
        derivedComplexMatanot: {
          data: {
            id: '9',
            attributes: {
              matanot_recipe_missions: { data: [{ id: '55', attributes: { notes: 'עיצוב', hoursPerUnit: 10, ratePerHour: 120 } }] },
              matanot_recipe_resources: { data: [{ id: '70', attributes: { notes: 'אחסון', quantityPerUnit: 1, pricePerUnit: 300 } }] }
            }
          }
        },
        ...over
      }
    }
  }
});

describe('offerView — qid 433 as the pages read it', () => {
  it('reads the offer, its parts and its total', () => {
    const v = offerView(raw())!;
    expect(v).toMatchObject({
      id: '40',
      name: 'אתר לסטודיו',
      isOnline: true,
      provider: { id: '256', name: 'ברוך', pic: null },
      recipientHint: 'דנה',
      state: 'draft',
      emailLocked: true,
      linkAt: '2026-10-07T08:00:00.000Z',
      total: 1500
    });
    expect(v.lines).toEqual([
      { kind: 'mission', lineId: '55', name: 'עיצוב', amount: 10, price: 1200 },
      { kind: 'resource', lineId: '70', name: 'אחסון', amount: 1, price: 300 }
    ]);
  });

  it('knows when it was taken, and when it is closed', () => {
    expect(offerView(raw({ claimed_at: '2026-10-08T00:00:00.000Z', users_permissions_users: { data: [{ id: '261' }] } }))).toMatchObject({
      state: 'claimed',
      ownerIds: ['261']
    });
    expect(offerView(raw({ status_ratson: 'fulfilled' }))!.state).toBe('closed');
  });

  it('an ordinary wish is no offer, and nothing is nothing', () => {
    expect(offerView(raw({ offered_by: { data: null } }))).toBeNull();
    expect(offerView({ ratson: { data: null } })).toBeNull();
    expect(offerView(undefined)).toBeNull();
  });
});

describe('claimRefusal — who may take it', () => {
  const v = offerView(raw())!;
  it('anyone else, while it is open — and the lock holds', () => {
    expect(claimRefusal(v, '261', true)).toBeNull();
    expect(claimRefusal(v, '261', false)).toBe('email');
  });
  it('not the provider, not twice, not once closed', () => {
    expect(claimRefusal(v, '256', true)).toBe('self');
    expect(claimRefusal({ ...v, state: 'claimed' }, '261', true)).toBe('claimed');
    expect(claimRefusal({ ...v, state: 'closed' }, '261', true)).toBe('closed');
  });
});
