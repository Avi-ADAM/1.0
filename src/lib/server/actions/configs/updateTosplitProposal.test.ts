import { describe, it, expect, vi } from 'vitest';
import { planTransfers, updateTosplitProposalConfig } from './updateTosplitProposal';

const ex = (id: string, from: string, to: string, amount: number, confirmed = false) => ({ id, from, to, amount, confirmed });
const w = (from: string, to: string, amount: number) => ({ from, to, amount });

describe('planTransfers — the rules the client applied, unchanged', () => {
  it('keeps a row the split still produces, and moves its amount while unconfirmed', () => {
    expect(planTransfers([ex('1', 'a', 'b', 100)], [w('a', 'b', 80)])).toEqual({
      keep: ['1'],
      update: [{ id: '1', amount: 80 }],
      create: []
    });
  });

  it('never moves a confirmed amount — it is a fact', () => {
    expect(planTransfers([ex('1', 'a', 'b', 100, true)], [w('a', 'b', 80)])).toEqual({ keep: ['1'], update: [], create: [] });
  });

  it('ignores a difference under a cent', () => {
    expect(planTransfers([ex('1', 'a', 'b', 100)], [w('a', 'b', 100.004)]).update).toEqual([]);
  });

  it('keeps a confirmed row the split no longer produces; unlinks an unconfirmed one', () => {
    const plan = planTransfers([ex('1', 'a', 'b', 50, true), ex('2', 'a', 'c', 50)], []);
    expect(plan.keep).toEqual(['1']);
  });

  it('creates what no row covers, and matches direction (a→b is not b→a)', () => {
    const plan = planTransfers([ex('1', 'a', 'b', 10)], [w('b', 'a', 10), w('a', 'b', 10)]);
    expect(plan.keep).toEqual(['1']);
    expect(plan.create).toEqual([w('b', 'a', 10)]);
  });

  it('matches ids as strings', () => {
    expect(planTransfers([ex('1', '5', '7', 10)], [{ from: 5 as any, to: 7 as any, amount: 10 }]).create).toEqual([]);
  });
});

function strapiWith(tosplit: any) {
  const calls: Array<[string, any]> = [];
  const execute = vi.fn(async (qid: string, vars: any) => {
    calls.push([qid, vars]);
    if (qid === 'getTosplitForUpdate') return { data: { tosplit: { data: tosplit } } };
    if (qid === '69createHaluka') return { data: { createHaluka: { data: { id: `new-${calls.length}` } } } };
    return { data: {} };
  });
  return { strapi: { execute }, calls };
}

const run = (params: any, strapi: any) =>
  (updateTosplitProposalConfig.graphqlOperation as any)(params, { userId: '5', jwt: 'j', fetch: vi.fn() }, { strapi });

const tosplit = (over: any = {}) => ({
  id: '9',
  attributes: {
    finished: false,
    project: { data: { id: '7' } },
    sales: { data: [{ id: 's1' }] },
    halukas: { data: [{ id: 'h1', attributes: { amount: 100, confirmed: false, usersend: { data: { id: '1' } }, userrecive: { data: { id: '2' } } } }] },
    siteShareHalukas: { data: [] },
    ...over
  }
});

describe('updateTosplitProposal', () => {
  const base = { tosplitId: '9', projectId: '7', transfers: [w('1', '2', 60), w('1', '3', 40)], hervachti: [{ users_permissions_user: 2, amount: 60 }], newSaleIds: ['s2'] };

  it('reconciles transfers, re-links old and new sales, and marks them pending', async () => {
    const { strapi, calls } = strapiWith(tosplit());
    const res = await run(base, strapi);
    expect(calls.find(([q]) => q === '70updateHaluka')?.[1]).toEqual({ id: 'h1', amount: 60 });
    expect(calls.filter(([q]) => q === '69createHaluka')).toHaveLength(1);
    const update = calls.find(([q]) => q === '68updateTosplit')?.[1];
    expect(update.data.sales).toEqual(['s1', 's2']);
    expect(update.data.halukas[0]).toBe('h1');
    expect(update.data.siteShareHalukas).toBeUndefined();
    expect(calls.filter(([q]) => q === '71updateSaleSplited').map(([, v]) => v.id)).toEqual(['s1', 's2']);
    expect(res.data).toMatchObject({ tosplitId: '9', hadPlatformBefore: false });
  });

  it("refuses another rikma's split", async () => {
    const { strapi, calls } = strapiWith(tosplit({ project: { data: { id: '8' } } }));
    await expect(run(base, strapi)).rejects.toThrow(/does not belong/);
    expect(calls.map(([q]) => q)).toEqual(['getTosplitForUpdate']);
  });

  it('refuses a settled split', async () => {
    const { strapi } = strapiWith(tosplit({ finished: true }));
    await expect(run(base, strapi)).rejects.toThrow(/already settled/);
  });

  it('links site-share legs through siteShareHalukas, tagged, outside the gate', async () => {
    const { strapi, calls } = strapiWith(tosplit());
    await run({ ...base, siteShare: { active: true, transfers: [w('1', '99', 5)], reciveProject: '1', adjustDirection: 'less', adjustReason: 'r' } }, strapi);
    const creates = calls.filter(([q]) => q === '69createHaluka').map(([, v]) => v.data);
    expect(creates.find((d) => d.userrecive === '99')).toMatchObject({ isSiteShare: true, recive_project: '1', adjustReason: 'r' });
    const update = calls.find(([q]) => q === '68updateTosplit')?.[1];
    expect(update.data.siteShareHalukas).toHaveLength(1);
    expect(update.data.halukas).not.toContain(update.data.siteShareHalukas[0]);
  });

  it('validates transfers: positive amounts, two different people', () => {
    const v = (updateTosplitProposalConfig.paramSchema.transfers as any).validate;
    expect(v([w('1', '2', 10)])).toBe(true);
    expect(v([w('1', '1', 10)])).toBe(false);
    expect(v([w('1', '2', 0)])).toBe(false);
    expect(v([{ from: '1', to: '2', amount: 'x' }])).toBe(false);
  });
});
