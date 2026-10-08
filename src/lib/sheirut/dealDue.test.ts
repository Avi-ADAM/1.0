import { describe, expect, it } from 'vitest';
import { buildDealLines, computeDealDue, missionClosed, type DealLineInput } from './dealDue';

const mission = (over: Partial<DealLineInput> = {}): DealLineInput => ({
  key: '1',
  kind: 'mission',
  name: 'logo',
  providerId: '7',
  cap: 600,
  approved: 0,
  closed: true,
  matched: true,
  ...over
});

describe('computeDealDue', () => {
  it('charges the approved value, not the agreed price, when the work came in under it (C-14)', () => {
    const d = computeDealDue({
      lines: [mission({ key: 'a', cap: 600, approved: 3.4 }), mission({ key: 'b', cap: 1200, approved: 17.85 })],
      dealTotal: 1800
    });
    expect(d.due).toBe(21.25);
    expect(d.cap).toBe(1800);
    expect(d.unused).toBe(1778.75);
    expect(d.final).toBe(true);
    // each partner's slice of what she pays is exactly their approved value
    expect(d.lines.map((l) => l.due)).toEqual([3.4, 17.85]);
  });

  it('never charges above the price agreed for a line — the rest is an overrun', () => {
    const d = computeDealDue({ lines: [mission({ cap: 600, approved: 750 })], dealTotal: 600 });
    expect(d.due).toBe(600);
    expect(d.overrun).toBe(150);
    expect(d.lines[0].due).toBe(600);
  });

  it('seconds of a clock are not an overrun (deal 9: 15.0013 h × 150, 2.0006 h × 250)', () => {
    const d = computeDealDue({
      lines: [
        mission({ key: 'a', cap: 2250, agreedHours: 15, approved: 2250.2, approvedHours: 15.0013 }),
        mission({ key: 'b', cap: 500, agreedHours: 2, approved: 500.14, approvedHours: 2.0006 })
      ],
      dealTotal: 2750
    });
    // the cap rule is untouched: she pays the agreed price, not a agora more
    expect(d.lines.map((l) => l.due)).toEqual([2250, 500]);
    expect(d.due).toBe(2750);
    // and nobody is told twenty agorot were "approved above the agreed price"
    expect(d.lines.map((l) => l.overrun)).toEqual([0, 0]);
    expect(d.overrun).toBe(0);
  });

  it('an overrun under 1 ₪ is noise, from 1 ₪ and a minute of work it is reported', () => {
    const at = (approved: number) =>
      computeDealDue({ lines: [mission({ cap: 600, agreedHours: 10, approved })] }).lines[0];
    // 60/h: a minute is 1 ₪
    expect(at(600.99).overrun).toBe(0);
    expect(at(600.99).due).toBe(600);
    expect(at(601).overrun).toBe(1);
    expect(at(601).due).toBe(600);
  });

  it('an overrun above 1 ₪ but under a minute of the line’s work is noise', () => {
    // 250/h: a minute is 4.17 ₪, 1.50 ₪ is 22 seconds
    const line = computeDealDue({ lines: [mission({ cap: 500, agreedHours: 2, approved: 501.5 })] }).lines[0];
    expect(line.overrun).toBe(0);
    expect(line.due).toBe(500);
    const minute = computeDealDue({ lines: [mission({ cap: 500, agreedHours: 2, approved: 504.17 })] }).lines[0];
    expect(minute.overrun).toBe(4.17);
  });

  it('an overrun on one line does not eat another line’s savings', () => {
    const d = computeDealDue({
      lines: [mission({ key: 'a', cap: 600, approved: 900 }), mission({ key: 'b', cap: 1200, approved: 400 })],
      dealTotal: 1800
    });
    expect(d.due).toBe(1000);
    expect(d.overrun).toBe(300);
  });

  it('the deal total is an outer ceiling', () => {
    const d = computeDealDue({ lines: [mission({ cap: 600, approved: 600 })], dealTotal: 500 });
    expect(d.due).toBe(500);
  });

  it('a resource line costs its agreed price', () => {
    const d = computeDealDue({
      lines: [mission({ cap: 600, approved: 200 }), { key: 'r', kind: 'resource', name: 'van', providerId: '8', cap: 300 }]
    });
    expect(d.due).toBe(500);
    expect(d.final).toBe(true);
  });

  it('is not final while a mission line is open, or has no mission at all', () => {
    expect(computeDealDue({ lines: [mission({ closed: false })] }).final).toBe(false);
    expect(computeDealDue({ lines: [mission({ matched: false })] }).final).toBe(false);
  });

  it('subtracts what was already sent, and reports what was sent beyond the due', () => {
    const d = computeDealDue({ lines: [mission({ cap: 600, approved: 400 })], recorded: 100, committed: 250 });
    expect(d.remaining).toBe(150);
    expect(d.excess).toBe(0);

    const over = computeDealDue({ lines: [mission({ cap: 1800, approved: 21.25 })], committed: 1800 });
    expect(over.remaining).toBe(0);
    expect(over.excess).toBe(1778.75);
  });

  it('committed is never less than what is already recorded', () => {
    const d = computeDealDue({ lines: [mission({ cap: 600, approved: 600 })], recorded: 600, committed: 0 });
    expect(d.committed).toBe(600);
    expect(d.remaining).toBe(0);
  });

  it('survives junk', () => {
    const d = computeDealDue({ lines: [mission({ cap: NaN as any, approved: -5 })], dealTotal: null, recorded: undefined });
    expect(d.due).toBe(0);
    expect(d.remaining).toBe(0);
  });
});

/** QA C-19: "paid" is what the providers confirmed receiving — one truth for every number on the deal. */
describe('computeDealDue — paid follows the providers', () => {
  // Deal 9: two providers, 2,250 + 500, the customer sent 2,750 to one receiver.
  const deal9 = [
    mission({ key: 'a', providerId: '256', cap: 2250, approved: 2250 }),
    mission({ key: 'b', providerId: '258', cap: 500, approved: 500 })
  ];

  it('both providers confirmed, the haluka never recorded as a Sale: paid in full, nothing left', () => {
    const d = computeDealDue({ lines: deal9, dealTotal: 2750, recorded: 0, committed: 2750, confirmed: ['256', '258'] });
    expect(d.settled).toBe(true);
    expect(d.paid).toBe(2750);
    expect(d.remaining).toBe(0);
    expect(d.inTransit).toBe(0);
    expect(d.lines.map((l) => l.paid)).toEqual([true, true]);
  });

  it('settled even when no transfer was recorded at all (she paid each provider outside the platform)', () => {
    const d = computeDealDue({ lines: deal9, confirmed: ['256', '258'] });
    expect(d.paid).toBe(2750);
    expect(d.remaining).toBe(0);
  });

  it('recorded income is not paid until the providers say so — it is in transit, and not asked for again', () => {
    const d = computeDealDue({ lines: deal9, recorded: 2750, committed: 2750 });
    expect(d.settled).toBe(false);
    expect(d.paid).toBe(0);
    expect(d.inTransit).toBe(2750);
    expect(d.remaining).toBe(0);
    expect(d.lines.map((l) => l.paid)).toEqual([false, false]);
  });

  it('one provider confirmed: their part is paid, the rest is in transit or still owed', () => {
    const sent = computeDealDue({ lines: deal9, committed: 2750, confirmed: ['258'] });
    expect(sent.paid).toBe(500);
    expect(sent.inTransit).toBe(2250);
    expect(sent.remaining).toBe(0);
    expect(sent.lines.map((l) => l.paid)).toEqual([false, true]);

    const direct = computeDealDue({ lines: deal9, confirmed: ['258'] });
    expect(direct.paid).toBe(500);
    expect(direct.inTransit).toBe(0);
    expect(direct.remaining).toBe(2250);
  });

  it('a confirmation from someone who is not a provider pays nothing', () => {
    const d = computeDealDue({ lines: deal9, confirmed: ['261'] });
    expect(d.paid).toBe(0);
    expect(d.settled).toBe(false);
  });

  it('`moneyTransfered` on the deal is settled, as the deal status reads it', () => {
    const d = computeDealDue({ lines: deal9, settled: true });
    expect(d.paid).toBe(2750);
    expect(d.remaining).toBe(0);
    expect(d.lines.every((l) => l.paid)).toBe(true);
  });

  it('a deal nobody holds a part of is never settled by an empty list of confirmations', () => {
    const d = computeDealDue({ lines: [mission({ providerId: null, approved: 600 })], confirmed: [] });
    expect(d.settled).toBe(false);
    expect(d.remaining).toBe(600);
  });
});

describe('missionClosed', () => {
  it('finished, archived and released are closed; awaiting approval is not', () => {
    expect(missionClosed({ finnished: true })).toBe(true);
    expect(missionClosed({ lifecycle: 'archived' })).toBe(true);
    expect(missionClosed({ lifecycle: 'released' })).toBe(true);
    expect(missionClosed({ finnished: false, lifecycle: 'active' })).toBe(false);
    expect(missionClosed(null)).toBe(false);
  });
});

describe('buildDealLines', () => {
  const user = (id: string, username = `u${id}`) => ({ data: { id, attributes: { username } } });
  const fm = (noofhours: number, total: number) => ({ attributes: { noofhours, total } });

  it('pairs each BOM line with the mission made for it and sums its approved rows', () => {
    const lines = buildDealLines({
      productName: 'Party',
      recipeMissions: [
        { id: 11, attributes: { hoursPerUnit: 10, ratePerHour: 60, assignedMember: user('1'), pendm: { data: { id: 1, attributes: { name: 'Music' } } } } },
        { id: 12, attributes: { hoursPerUnit: 8, ratePerHour: 150, assignedMember: user('2'), pendm: { data: { id: 2, attributes: { name: 'Food' } } } } }
      ],
      recipeResources: [],
      missions: [
        { id: 91, attributes: { name: 'Food', finnished: true, users_permissions_user: user('2'), finnished_missions: { data: [fm(0.119, 17.85)] } } },
        { id: 90, attributes: { name: 'Music', finnished: false, users_permissions_user: user('1'), finnished_missions: { data: [fm(0.05, 3.4)] } } }
      ]
    });
    expect(lines).toMatchObject([
      { key: '11', name: 'Music', providerId: '1', cap: 600, approved: 3.4, agreedHours: 10, closed: false, matched: true },
      { key: '12', name: 'Food', providerId: '2', cap: 1200, approved: 17.85, approvedHours: 0.116667, closed: true, matched: true }
    ]);
  });

  it('reads approved hours in whole minutes, even from rows filed with their seconds', () => {
    const [line] = buildDealLines({
      recipeMissions: [{ id: 11, attributes: { hoursPerUnit: 15, ratePerHour: 150, assignedMember: user('1'), notes: 'Table' } }],
      recipeResources: [],
      missions: [
        {
          id: 196,
          attributes: {
            name: 'Table',
            users_permissions_user: user('1'),
            finnished_missions: { data: [fm(8, 1200), fm(6.65, 997.5), fm(0.3513, 52.7)] }
          }
        }
      ]
    });
    expect(line.approvedHours).toBe(15);
    expect(line.agreedHours).toBe(15);
  });

  it('carries each line’s mission and its current terms', () => {
    const [line] = buildDealLines({
      recipeMissions: [{ id: 11, attributes: { hoursPerUnit: 10, ratePerHour: 60, assignedMember: user('1'), notes: 'Setup' } }],
      recipeResources: [],
      missions: [{ id: 5, attributes: { name: 'Setup', hoursassinged: 12, perhour: 60, users_permissions_user: user('1') } }]
    });
    expect(line).toMatchObject({ missionId: '5', missionHours: 12, missionRate: 60, cap: 600 });
  });

  it('an explicit link on the line wins over a name match (a filled gap, C-19)', () => {
    const lines = buildDealLines({
      recipeMissions: [
        { id: 1, attributes: { hoursPerUnit: 1, ratePerHour: 10, assignedMember: user('1'), notes: 'A' } },
        { id: 2, attributes: { hoursPerUnit: 1, ratePerHour: 10, assignedMember: user('1'), notes: 'B', mesimabetahalich: { data: { id: '6' } } } }
      ],
      recipeResources: [],
      missions: [
        { id: 5, attributes: { name: 'A', users_permissions_user: user('1') } },
        { id: 6, attributes: { name: 'A', users_permissions_user: user('1') } }
      ]
    });
    expect(lines.map((l) => l.missionId)).toEqual(['5', '6']);
  });

  it('a mission no line claims is not part of the deal', () => {
    const lines = buildDealLines({
      recipeMissions: [{ id: 11, attributes: { hoursPerUnit: 1, ratePerHour: 100, assignedMember: user('1'), notes: 'Setup' } }],
      recipeResources: [],
      missions: [
        { id: 1, attributes: { name: 'Setup', users_permissions_user: user('1'), finnished_missions: { data: [fm(1, 100)] } } },
        { id: 2, attributes: { name: 'Extra work', users_permissions_user: user('1'), finnished_missions: { data: [fm(9, 900)] } } }
      ]
    });
    expect(lines).toHaveLength(1);
    expect(lines[0].approved).toBe(100);
  });

  it('falls back to the provider’s mission when the name drifted, and claims each mission once', () => {
    const lines = buildDealLines({
      recipeMissions: [
        { id: 1, attributes: { hoursPerUnit: 1, ratePerHour: 10, assignedMember: user('1'), notes: 'A' } },
        { id: 2, attributes: { hoursPerUnit: 1, ratePerHour: 10, assignedMember: user('1'), notes: 'B' } }
      ],
      recipeResources: [],
      missions: [{ id: 5, attributes: { name: 'renamed', users_permissions_user: user('1'), finnished_missions: { data: [fm(1, 10)] } } }]
    });
    expect(lines.map((l) => l.matched)).toEqual([true, false]);
  });

  it('skips lines that consume an existing mission/resource, prices resources at the agreement', () => {
    const lines = buildDealLines({
      recipeMissions: [{ id: 1, attributes: { mode: 'consumeExisting', hoursPerUnit: 1, ratePerHour: 10 } }],
      recipeResources: [
        { id: 3, attributes: { pricePerUnit: 50, quantityPerUnit: 4, assignedMember: user('4'), pmash: { data: { id: 9, attributes: { name: 'Chairs' } } } } }
      ],
      missions: []
    });
    expect(lines).toEqual([
      { key: '3', kind: 'resource', name: 'Chairs', providerId: '4', providerName: 'u4', cap: 200 }
    ]);
  });
});
