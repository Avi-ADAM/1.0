import { describe, expect, it, vi } from 'vitest';
import { applyTosplitApproval, hervachDeltasFrom } from './applyTosplitApproval';

/** A StrapiClient stand-in that records every call and answers by qid. */
function makeStrapi(answers: Record<string, any> = {}) {
  const calls: Array<{ qid: string; vars: Record<string, any> }> = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: Record<string, any>) => {
      calls.push({ qid, vars });
      if (qid in answers) {
        const a = answers[qid];
        if (typeof a === 'function') return a(vars);
        return a;
      }
      if (qid === '79approveTosplit') {
        return { data: { updateTosplit: { data: { id: '1', attributes: { sales: { data: [] } } } } } };
      }
      return { data: {} };
    })
  };
  return {
    strapi,
    calls,
    matching: (qid: string) => calls.filter((c) => c.qid === qid)
  };
}

const okTosplit = (sales: any[] = []) => ({
  data: { updateTosplit: { data: { id: '7', attributes: { sales: { data: sales } } } } }
});

describe('hervachDeltasFrom', () => {
  it('excludes the giver and the receiver — their side is the Haluka itself', () => {
    const deltas = hervachDeltasFrom([
      { amount: 50, noten: true, users_permissions_user: { data: { id: '1' } } },
      { amount: 50, mekabel: true, users_permissions_user: { data: { id: '2' } } },
      { amount: 30, users_permissions_user: { data: { id: '3' } } }
    ]);
    expect(deltas).toEqual([{ userId: '3', amountDelta: 30 }]);
  });

  it('drops rows that would move nothing', () => {
    expect(
      hervachDeltasFrom([
        { amount: 0, users_permissions_user: { data: { id: '4' } } },
        { amount: 12, users_permissions_user: { data: { id: '' } } },
        { amount: null, users_permissions_user: { data: { id: '5' } } }
      ])
    ).toEqual([]);
  });

  it('reads the user id whatever shape the relation arrives in', () => {
    expect(
      hervachDeltasFrom([
        { amount: 1, users_permissions_user: { data: { id: 9 } } },
        { amount: 2, users_permissions_user: { id: 8 } },
        { amount: 3, users_permissions_user: 7 }
      ])
    ).toEqual([
      { userId: '9', amountDelta: 1 },
      { userId: '8', amountDelta: 2 },
      { userId: '7', amountDelta: 3 }
    ]);
  });

  it('survives a tosplit with no earnings rows at all', () => {
    expect(hervachDeltasFrom(null)).toEqual([]);
    expect(hervachDeltasFrom(undefined)).toEqual([]);
  });
});

describe('applyTosplitApproval', () => {
  it('closes the split, settles its sales and halukas, and moves the balances', async () => {
    const { strapi, matching } = makeStrapi({
      '79approveTosplit': okTosplit([{ id: '11' }, { id: '12' }]),
      '167getUserHervachti': { data: { usersPermissionsUser: { data: { attributes: { hervachti: 100 } } } } }
    });

    await applyTosplitApproval(strapi, {}, {
      tosplitId: '7',
      vots: [{ what: true, users_permissions_user: '3' }],
      halukot: [{ id: '21' }, '22'],
      hervachUpdates: [{ userId: '3', amountDelta: 25 }]
    });

    const [closed] = matching('79approveTosplit');
    expect(closed.vars).toEqual({ tosplitId: '7', vots: [{ what: true, users_permissions_user: '3' }] });

    expect(matching('80updateSale').map((c) => c.vars.saleId)).toEqual(['11', '12']);
    expect(matching('81updateHaluka').map((c) => c.vars.halukaId)).toEqual(['21', '22']);

    // Delta applied on top of what was actually in the DB, never an absolute.
    expect(matching('158updateUserHervachti')[0].vars).toEqual({ id: '3', hervachti: 125 });
  });

  it('prefers the sales the tosplit itself links over the ones it was handed', async () => {
    const { strapi, matching } = makeStrapi({ '79approveTosplit': okTosplit([{ id: '99' }]) });

    await applyTosplitApproval(strapi, {}, {
      tosplitId: '7',
      vots: [],
      halukot: [],
      sales: [{ id: '404' }]
    });

    expect(matching('80updateSale').map((c) => c.vars.saleId)).toEqual(['99']);
  });

  it('falls back to the passed sales only when the response carries no sales at all', async () => {
    const { strapi, matching } = makeStrapi({
      '79approveTosplit': { data: { updateTosplit: { data: { id: '7', attributes: {} } } } }
    });

    await applyTosplitApproval(strapi, {}, {
      tosplitId: '7',
      vots: [],
      halukot: [],
      sales: ['55']
    });

    expect(matching('80updateSale').map((c) => c.vars.saleId)).toEqual(['55']);
  });

  it('an empty sales list on the response means empty — it is not a missing value', async () => {
    // `[]` is a real answer ("this split has no sales"), so it must not be
    // overridden by whatever the caller happened to pass.
    const { strapi, matching } = makeStrapi({ '79approveTosplit': okTosplit([]) });

    await applyTosplitApproval(strapi, {}, {
      tosplitId: '7',
      vots: [],
      halukot: [],
      sales: ['55']
    });

    expect(matching('80updateSale')).toHaveLength(0);
  });

  it('refuses to settle anything downstream if the split itself did not close', async () => {
    const { strapi, matching } = makeStrapi({ '79approveTosplit': { data: {} } });

    await expect(
      applyTosplitApproval(strapi, {}, {
        tosplitId: '7',
        vots: [],
        halukot: [{ id: '21' }],
        hervachUpdates: [{ userId: '3', amountDelta: 25 }]
      })
    ).rejects.toThrow('Failed to update tosplit');

    expect(matching('81updateHaluka')).toHaveLength(0);
    expect(matching('158updateUserHervachti')).toHaveLength(0);
  });

  it('keeps settling the rest when one row fails — the split is already closed', async () => {
    const { strapi, matching } = makeStrapi({
      '79approveTosplit': okTosplit([]),
      '81updateHaluka': (vars: any) => {
        if (vars.halukaId === '21') throw new Error('nope');
        return { data: {} };
      }
    });

    await applyTosplitApproval(strapi, {}, {
      tosplitId: '7',
      vots: [],
      halukot: [{ id: '21' }, { id: '22' }]
    });

    expect(matching('81updateHaluka').map((c) => c.vars.halukaId)).toEqual(['21', '22']);
  });

  it('a balanced split has no transfers, and that is not an error', async () => {
    const { strapi, matching } = makeStrapi({ '79approveTosplit': okTosplit([]) });

    await applyTosplitApproval(strapi, {}, { tosplitId: '7', vots: [], halukot: [] });

    expect(matching('79approveTosplit')).toHaveLength(1);
    expect(matching('81updateHaluka')).toHaveLength(0);
  });
});
