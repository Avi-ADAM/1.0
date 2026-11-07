import { describe, it, expect } from 'vitest';
import { createTosplitConfig } from './createTosplit';
import { approveHalukaConfig } from './approveHaluka';

/**
 * A split proposal carries two lists: `hervachti` (who earned what — the
 * substance of the proposal) and `halukas` (the transfers needed to get the
 * money where it belongs). Those transfers can legitimately be zero: in a
 * one-member rikma the sole member already holds every shekel and owes it to
 * nobody, so a correct proposal has an empty `halukas`.
 *
 * Requiring at least one transfer left solo rikmas unable to ever close a
 * split — every sale stayed "pending distribution" forever
 * (docs/inprogress/QA_SOLO_RIKMA_2026-08.md B1).
 */
const validate = (value: unknown) =>
  (createTosplitConfig.paramSchema!.data as any).validate(value) as boolean;

const base = {
  publishedAt: '2026-08-12T08:49:52.667Z',
  project: '82',
  vots: [{ what: true, users_permissions_user: '256' }],
  hervachti: [
    { users_permissions_user: 256, amount: 500, mekabel: false, noten: false, nirsham: false }
  ],
  sales: [104]
};

describe('createTosplit — parameter validation', () => {
  it('accepts a balanced proposal with no transfers (solo rikma)', () => {
    expect(validate({ ...base, halukas: [] })).toBe(true);
  });

  it('accepts a proposal that does move money', () => {
    expect(validate({ ...base, halukas: ['7', '8'] })).toBe(true);
  });

  it('rejects a proposal with no hervachti — nothing to approve', () => {
    expect(validate({ ...base, halukas: [], hervachti: [] })).toBe(false);
  });

  it('rejects a missing halukas key, which means the caller never built one', () => {
    const { ...noHalukas } = base;
    expect(validate(noHalukas)).toBe(false);
  });

  it('still requires project, publishedAt and the creator vote', () => {
    expect(validate({ ...base, halukas: [], project: undefined })).toBe(false);
    expect(validate({ ...base, halukas: [], publishedAt: undefined })).toBe(false);
    expect(validate({ ...base, halukas: [], vots: [] })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(validate(null)).toBe(false);
    expect(validate('halukas')).toBe(false);
  });
});

describe('approveHaluka — finalizing a split', () => {
  const schema = approveHalukaConfig.paramSchema as any;

  it('accepts an empty halukot list — the balanced case has no transfers to mark', () => {
    expect(schema.halukot.validate([])).toBe(true);
    expect(schema.halukot.validate(['12'])).toBe(true);
    expect(schema.halukot.validate('12')).toBe(false);
  });

  it('requires a projectId so membership is always checked', () => {
    // `jwt` alone would let any signed-in user finalize any tosplit by id.
    expect(schema.projectId.required).toBe(true);
    expect(
      approveHalukaConfig.authRules?.some(
        (r: any) => r.type === 'projectMember' && r.config?.projectIdParam === 'projectId'
      )
    ).toBe(true);
  });
});

describe('createTosplit — the writes that belong to the proposal (B9)', () => {
  function strapiWith(members: string[], restime = 'feh') {
    const calls: Array<[string, any]> = [];
    const execute = async (qid: string, vars: any) => {
      calls.push([qid, vars]);
      if (qid === '70.5createTosplit') return { data: { createTosplit: { data: { id: '31' } } } };
      if (qid === 'saleClaimProjectInfo')
        return { data: { project: { data: { attributes: { restime, user_1s: { data: members.map((id) => ({ id })) } } } } } };
      return { data: {} };
    };
    return { strapi: { execute }, calls };
  }
  const ctx = { jwt: 'j', fetch: () => {}, userId: '256' };
  const run = (strapi: any, halukas: unknown[] = ['7'], extra: Record<string, unknown> = {}) =>
    (createTosplitConfig.graphqlOperation as any)(
      { data: { ...base, halukas, sales: [104, 105], ...extra } },
      ctx,
      { strapi }
    );

  it('returns the raw qid result, so callers still read data.createTosplit.data.id', async () => {
    const { strapi } = strapiWith(['1', '2']);
    expect((await run(strapi)).data.createTosplit.data.id).toBe('31');
  });

  it('marks every sale pending on this proposal', async () => {
    const { strapi, calls } = strapiWith(['1', '2']);
    await run(strapi);
    expect(calls.filter(([q]) => q === '71updateSaleSplited').map(([, v]) => v)).toEqual([
      { id: '104', pending: true, tosplits: ['31'] },
      { id: '105', pending: true, tosplits: ['31'] }
    ]);
  });

  it("opens the rikma's silence clock", async () => {
    const { strapi, calls } = strapiWith(['1', '2']);
    const before = Date.now();
    const res = await run(strapi);
    const clock = calls.find(([q]) => q === '32createTimeGrama')?.[1];
    expect(clock).toMatchObject({ whatami: 'tosplit', tosplit: '31' });
    expect(new Date(clock.date).getTime()).toBeGreaterThan(before);
    // A rikma of several waits for its members — nothing is closed here.
    expect(calls.some(([q]) => q === '79approveTosplit')).toBe(false);
    expect(res.soloClosed).toBeUndefined();
  });
});

/**
 * B1 end to end on the server: in a rikma of one the split closes inside
 * createTosplit — finished, every sale `splited`, the member's hervachti
 * credited — with no transfer to wait for and no clock. The member count is
 * read from Strapi, so a client cannot claim "solo" for a rikma of several.
 */
describe('createTosplit — a rikma of one closes its split at once (B1)', () => {
  function strapiWith(members: string[], opts: { approveFails?: boolean; hervachti?: number } = {}) {
    const calls: Array<[string, any]> = [];
    const execute = async (qid: string, vars: any) => {
      calls.push([qid, vars]);
      switch (qid) {
        case 'saleClaimProjectInfo':
          return { data: { project: { data: { attributes: { restime: 'feh', user_1s: { data: members.map((id) => ({ id })) } } } } } };
        case '70.5createTosplit':
          return { data: { createTosplit: { data: { id: '31' } } } };
        case '79approveTosplit':
          if (opts.approveFails) return { data: {} };
          return { data: { updateTosplit: { data: { id: '31', attributes: { sales: { data: [{ id: '104' }, { id: '105' }] } } } } } };
        case '167getUserHervachti':
          return { data: { usersPermissionsUser: { data: { attributes: { hervachti: opts.hervachti ?? 100 } } } } };
        default:
          return { data: {} };
      }
    };
    return { strapi: { execute }, calls };
  }
  const ctx = { jwt: 'j', fetch: () => {}, userId: '256' };
  const run = (strapi: any, halukas: unknown[], extra: Record<string, unknown> = {}) =>
    (createTosplitConfig.graphqlOperation as any)(
      { data: { ...base, halukas, sales: [104, 105], ...extra } },
      ctx,
      { strapi }
    );
  const qids = (calls: Array<[string, any]>) => calls.map(([q]) => q);

  it('accepts empty halukas and closes the split: finished, sales splited, no clock', async () => {
    const { strapi, calls } = strapiWith(['256']);
    const res = await run(strapi, []);

    expect(res.soloClosed).toBe(true);
    expect(res.data.createTosplit.data.id).toBe('31');

    const approve = calls.find(([q]) => q === '79approveTosplit')?.[1];
    expect(approve).toEqual({ tosplitId: '31', vots: [{ what: true, users_permissions_user: '256' }] });

    expect(calls.filter(([q]) => q === '80updateSale').map(([, v]) => v.saleId)).toEqual(['104', '105']);
    expect(qids(calls)).not.toContain('81updateHaluka');
    expect(qids(calls)).not.toContain('32createTimeGrama');

    // The sole member's earnings land on top of their CURRENT balance.
    expect(calls.find(([q]) => q === '158updateUserHervachti')?.[1]).toEqual({ id: '256', hervachti: 600 });
  });

  it('marks the sales pending on the tosplit before closing it, so they stay linked', async () => {
    const { strapi, calls } = strapiWith(['256']);
    await run(strapi, []);
    const order = qids(calls);
    expect(order.indexOf('71updateSaleSplited')).toBeLessThan(order.indexOf('80updateSale'));
  });

  it('reports soloClosed:false when closing failed, so the client fallback runs', async () => {
    const { strapi, calls } = strapiWith(['256'], { approveFails: true });
    const res = await run(strapi, []);
    expect(res.soloClosed).toBe(false);
    expect(qids(calls)).not.toContain('80updateSale');
    expect(qids(calls)).not.toContain('158updateUserHervachti');
  });

  it('rejects empty halukas in a rikma of several members — before anything is written', async () => {
    const { strapi, calls } = strapiWith(['256', '258']);
    await expect(run(strapi, [])).rejects.toMatchObject({ name: 'ActionError', code: 'VALIDATION_FAILED' });
    expect(qids(calls)).toEqual(['saleClaimProjectInfo']);
  });

  it('rejects empty halukas when the members cannot be read — solo is never assumed', async () => {
    const calls: string[] = [];
    const strapi = {
      execute: async (qid: string) => {
        calls.push(qid);
        if (qid === 'saleClaimProjectInfo') throw new Error('strapi down');
        return { data: {} };
      }
    };
    await expect(run(strapi, [])).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(calls).not.toContain('70.5createTosplit');
  });

  it('still accepts a several-member split whose only transfer is the site-share', async () => {
    const { strapi, calls } = strapiWith(['256', '258']);
    const res = await run(strapi, [], { siteShareHalukas: ['90'] });
    expect(res.data.createTosplit.data.id).toBe('31');
    expect(qids(calls)).toContain('32createTimeGrama');
    expect(qids(calls)).not.toContain('79approveTosplit');
  });
});
