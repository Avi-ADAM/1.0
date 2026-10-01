import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/projectHelpers.js', () => ({
  createProjectInfo: () => ({ noof: 3, projectName: 'הרקמה' }),
  createUserInfo: () => ({ username: 'דנה', src: '' }),
  getProjectMembers: () => [],
  getProjectUsers: () => [],
  getProjectRestime: () => 'feh'
}));

const { processFiapp } = await import('./levProcessors');
const { encodeCounter } = await import('$lib/finiapruval/rounds');

/**
 * C-15 on the lev card: after a counter the claim is on a new round, so a member
 * who signed the old hours must be asked again — and the card must be able to
 * tell the negotiation, not just count heads.
 */

const vot = (id: string, what: boolean, order?: number, why?: string) => ({
  what,
  why: why ?? null,
  order: order ?? null,
  users_permissions_user: { data: { id } }
});

const approval = (vots: any[], myid: string, noofhours = 5) =>
  ({
    id: '77',
    projectId: '5',
    type: 'approval',
    priority: 2,
    myid,
    missname: 'שולחן',
    noofhours,
    why: 'חיתכתי',
    what: { data: [] },
    saveLinks: '',
    vots,
    userId: '1',
    mesimabetahlichId: '9',
    mesimabetahlichData: {}
  }) as any;

const card = (vots: any[], myid: string, noofhours?: number) =>
  (processFiapp([approval(vots, myid, noofhours)], []) as any[])[0];

describe('processFiapp — the version on the table', () => {
  it('before any counter: everyone who signed has answered, as ever', () => {
    const c = card([vot('1', true), vot('3', true)], '3');
    expect(c).toMatchObject({ already: true, noofusersOk: 2, noofusersNo: 0, noofusersWaiting: 1, round: 0 });
    expect(c.counters).toEqual([]);
  });

  it('after a counter, a member who signed the old hours is asked again', () => {
    const why = encodeCounter({ from: 5, to: 3, note: 'three is what I saw' });
    const vots = [vot('1', true, 0), vot('3', true, 0), vot('2', true, 1, why)];

    const forThree = card(vots, '3', 3);
    expect(forThree.already).toBe(false); // their old signature is history
    expect(forThree.round).toBe(1);
    expect(forThree.nhours).toBe(3);
    expect(forThree.noofusersOk).toBe(1); // only the proposer has signed round 1
    expect(forThree.noofusersWaiting).toBe(2);

    // the proposer has already answered — they proposed it
    expect(card(vots, '2', 3).already).toBe(true);
  });

  it('tells the negotiation: who proposed what, in order', () => {
    const vots = [
      vot('1', true, 0),
      vot('2', true, 1, encodeCounter({ from: 5, to: 3, note: 'three is what I saw' })),
      vot('1', true, 2, encodeCounter({ from: 3, to: 4, note: 'four, I waited for the glue' }))
    ];
    const c = card(vots, '3', 4);
    expect(c.round).toBe(2);
    expect(c.counters.map((x: any) => [x.round, x.userId, x.from, x.to, x.note])).toEqual([
      [1, '2', 5, 3, 'three is what I saw'],
      [2, '1', 3, 4, 'four, I waited for the glue']
    ]);
  });

  it('a legacy objection on the standing version is still counted as one', () => {
    const c = card([vot('1', true), vot('2', false, undefined, 'not done')], '3');
    expect(c).toMatchObject({ noofusersNo: 1, whyno: ['not done'], already: false });
  });
});
