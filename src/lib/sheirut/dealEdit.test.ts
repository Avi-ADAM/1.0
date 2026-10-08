import { describe, expect, it } from 'vitest';
import { clientsPendingOn, clockRanOut, editedValue, raiseBy, raisesPart, readDealEdits } from './dealEdit';

const part = { cap: 600, missionHours: 10, missionRate: 60 };

describe('editedValue / raisesPart', () => {
  it('values a version as hours × rate, keeping what it does not change', () => {
    expect(editedValue({ hm: 15 }, part)).toBe(900);
    expect(editedValue({ price: 80 }, part)).toBe(800);
    expect(editedValue({ hm: 12, price: 50 }, part)).toBe(600);
    expect(editedValue({}, part)).toBe(600);
  });

  it('a version above what she agreed needs her; one at or below it does not', () => {
    expect(raisesPart({ hm: 15 }, part)).toBe(true);
    expect(raiseBy({ hm: 15 }, part)).toBe(300);
    expect(raisesPart({ hm: 12, price: 50 }, part)).toBe(false);
    expect(raisesPart({ hm: 5 }, part)).toBe(false);
    expect(raiseBy({ hm: 5 }, part)).toBe(0);
  });

  it('measures against her ceiling, not the mission’s current terms', () => {
    // the mission was already raised inside the rikma, but she agreed to 600
    expect(raisesPart({}, { cap: 600, missionHours: 12, missionRate: 60 })).toBe(true);
  });
});

describe('clientsPendingOn', () => {
  it('only a yes on the round on the table counts', () => {
    const votes = [
      { userId: '9', order: 1, what: true },
      { userId: '7', order: 2, what: true }
    ];
    expect(clientsPendingOn(votes, 2, ['9'])).toEqual(['9']);
    expect(clientsPendingOn(votes, 1, ['9'])).toEqual([]);
  });
});

describe('clockRanOut', () => {
  const now = new Date('2026-10-04T12:00:00Z');
  it('is true once the date is past, false before or without a clock', () => {
    expect(clockRanOut('2026-10-04T11:00:00Z', now)).toBe(true);
    expect(clockRanOut('2026-10-04T13:00:00Z', now)).toBe(false);
    expect(clockRanOut(null, now)).toBe(false);
  });
});

describe('readDealEdits', () => {
  const lines = [{ missionId: '90', name: 'Music', providerName: 'dana', cap: 600, agreedHours: 10, missionHours: 10, missionRate: 60 }];
  const decision = (over: any = {}) => ({
    id: '500',
    attributes: {
      kind: 'editObject',
      archMesimabetahalich: { data: { id: '90' } },
      vots: [{ what: true, order: 1, users_permissions_user: { data: { id: '1' } } }],
      negoarch: [{ ordern: 1, mode: 'keep', hm: 15, price: null, why: 'the room needs more work', proposedBy: { data: { id: '1', attributes: { username: 'dana' } } } }],
      timegrama: { data: { id: '3', attributes: { date: '2026-10-06T12:00:00Z' } } },
      projects: { data: [{ id: '91', attributes: { user_1s: { data: [{ id: '1' }, { id: '2' }] } } }] },
      ...over
    }
  });
  const now = new Date('2026-10-04T12:00:00Z');

  it('shows the version on the table, what it adds and who still signs', () => {
    const [e] = readDealEdits({ decisions: { data: [decision()] } }, lines, ['9'], '9', now);
    expect(e).toMatchObject({
      decisionId: '500',
      missionId: '90',
      missionName: 'Music',
      cap: 600,
      raise: 300,
      needsCustomer: true,
      customersPending: ['9'],
      membersPending: ['2'],
      membersMatured: false,
      viewerSigned: false
    });
    expect(e.standing).toMatchObject({ order: 1, hm: 15, value: 900, why: 'the room needs more work', proposedByName: 'dana' });
  });

  it('a version the customer countered is hers: signed by her, waiting for the members', () => {
    const [e] = readDealEdits(
      {
        decisions: {
          data: [
            decision({
              negoarch: [
                { ordern: 1, mode: 'keep', hm: 15, proposedBy: { data: { id: '1' } } },
                { ordern: 2, mode: 'keep', hm: 12, why: 'two more hours are enough', proposedBy: { data: { id: '9' } } }
              ],
              vots: [
                { what: true, order: 1, users_permissions_user: { data: { id: '1' } } },
                { what: true, order: 2, users_permissions_user: { data: { id: '9' } } }
              ]
            })
          ]
        }
      },
      lines,
      ['9'],
      '9',
      now
    );
    expect(e.standing.order).toBe(2);
    expect(e.raise).toBe(120);
    expect(e.customersPending).toEqual([]);
    expect(e.viewerSigned).toBe(true);
    expect(e.membersPending).toEqual(['1', '2']);
    expect(e.rounds).toHaveLength(2);
  });

  it('skips removal proposals and decisions on missions outside the deal', () => {
    const removal = decision({ negoarch: [{ ordern: 1, mode: 'archive', proposedBy: { data: { id: '1' } } }] });
    const other = decision({ archMesimabetahalich: { data: { id: '77' } } });
    expect(readDealEdits({ decisions: { data: [removal, other] } }, lines, ['9'], '9', now)).toEqual([]);
  });

  it('a version that does not raise the part needs nobody outside the rikma', () => {
    const lower = decision({ negoarch: [{ ordern: 1, mode: 'keep', hm: 8, proposedBy: { data: { id: '1' } } }] });
    const [e] = readDealEdits({ decisions: { data: [lower] } }, lines, ['9'], '9', now);
    expect(e.needsCustomer).toBe(false);
    expect(e.customersPending).toEqual([]);
  });
});
