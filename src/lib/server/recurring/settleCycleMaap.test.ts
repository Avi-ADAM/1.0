import { describe, expect, it, vi } from 'vitest';
import { settleCycleMaap } from './settleCycleMaap';

function makeStrapi(answers: Record<string, any> = {}) {
  const calls: Array<{ qid: string; vars: Record<string, any> }> = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: Record<string, any>) => {
      calls.push({ qid, vars });
      if (qid in answers) {
        const a = answers[qid];
        return typeof a === 'function' ? a(vars) : a;
      }
      if (qid === 'mrCreateRikmash') return { data: { createRikmash: { data: { id: '900' } } } };
      return { data: {} };
    })
  };
  return { strapi, calls, matching: (qid: string) => calls.filter((c) => c.qid === qid) };
}

const NOW = new Date('2026-08-25T10:00:00.000Z');

const baseInput = {
  maapId: '55',
  projectId: '7',
  mashId: '30',
  mashAttrs: {} as any,
  cycleIndex: 3,
  spend: 120,
  vots: [{ what: true, users_permissions_user: '4', order: 0 }],
  confirmedBy: '4',
  timegramaId: '888',
  now: NOW
};

describe('settleCycleMaap', () => {
  it('creates the engine ledger on the first settled cycle and links it back', async () => {
    const { strapi, matching } = makeStrapi();

    const { rikmashId } = await settleCycleMaap(strapi, {}, {
      ...baseInput,
      mashAttrs: { name: 'שרת', pricePerUnit: 100, kindOf: 'monthly', users_permissions_user: { data: { id: '4' } } }
    });

    expect(rikmashId).toBe('900');
    const [created] = matching('mrCreateRikmash');
    expect(created.vars.data).toMatchObject({
      name: 'שרת',
      project: '7',
      mashabetahalich: '30',
      kindOf: 'monthly',
      users_permissions_user: '4',
      total: 120,
      agprice: 100,
      cyclesCount: 1,
      maaps: ['55']
    });
    expect(created.vars.data.deliveries).toEqual([
      { cycleIndex: 3, deliveredAt: NOW.toISOString(), quantity: 120, maap: '55', confirmedBy: '4' }
    ]);
    expect(matching('mrLinkRikmashToMashabetahalich')[0].vars).toEqual({ id: '30', rikmash: '900' });
  });

  it('appends to an existing ledger without dropping a settled month', async () => {
    const { strapi, matching } = makeStrapi({
      'mrGetRikmashForDelivery': {
        data: { rikmash: { data: { attributes: {
          total: 200,
          cyclesCount: 2,
          deliveries: [
            { id: '1', cycleIndex: 1, deliveredAt: 'x', quantity: 100, note: 'first', maap: { data: { id: '51' } } },
            { id: '2', cycleIndex: 2, deliveredAt: 'y', quantity: 100 }
          ]
        } } } }
      }
    });

    await settleCycleMaap(strapi, {}, {
      ...baseInput,
      mashAttrs: { rikmash: { data: { id: '900' } } }
    });

    const [updated] = matching('mrUpdateRikmash');
    expect(updated.vars.data.deliveries).toEqual([
      { id: '1', cycleIndex: 1, deliveredAt: 'x', quantity: 100, note: 'first', maap: '51' },
      { id: '2', cycleIndex: 2, deliveredAt: 'y', quantity: 100 },
      { cycleIndex: 3, deliveredAt: NOW.toISOString(), quantity: 120, maap: '55', confirmedBy: '4' }
    ]);
    expect(updated.vars.data.total).toBe(320);
    expect(updated.vars.data.cyclesCount).toBe(3);
    expect(matching('mrCreateRikmash')).toHaveLength(0);
  });

  it('archives the cycle with its votes and the settled amount', async () => {
    const { strapi, matching } = makeStrapi();

    await settleCycleMaap(strapi, {}, { ...baseInput, mashAttrs: {} });

    expect(matching('mrUpdateCycleMaap')[0].vars).toEqual({
      id: '55',
      data: {
        archived: true,
        vots: [{ what: true, users_permissions_user: '4', order: 0 }],
        quantityDelivered: 120,
        rikmash: '900'
      }
    });
  });

  it('adds the spend to the engine running total rather than replacing it', async () => {
    const { strapi, matching } = makeStrapi();

    await settleCycleMaap(strapi, {}, { ...baseInput, mashAttrs: { quantityDelivered: 500 } });

    expect(matching('mrUpdateMashabetahalich')[0].vars).toEqual({
      id: '30',
      data: { quantityDelivered: 620 }
    });
  });

  it('stops the clock it was given', async () => {
    const { strapi, matching } = makeStrapi();
    await settleCycleMaap(strapi, {}, { ...baseInput, mashAttrs: {} });
    expect(matching('mrSetTimegramaDone')[0].vars).toEqual({ id: '888', done: true });
  });

  it('settles fine with no clock at all', async () => {
    const { strapi, matching } = makeStrapi();
    await settleCycleMaap(strapi, {}, { ...baseInput, mashAttrs: {}, timegramaId: null });
    expect(matching('mrSetTimegramaDone')).toHaveLength(0);
    expect(matching('mrUpdateCycleMaap')).toHaveLength(1);
  });

  it('falls back to the cycle name, and to the spend as price, when the engine has neither', async () => {
    const { strapi, matching } = makeStrapi();

    await settleCycleMaap(strapi, {}, { ...baseInput, mashAttrs: {}, maapName: 'מחזור אוגוסט' });

    expect(matching('mrCreateRikmash')[0].vars.data).toMatchObject({
      name: 'מחזור אוגוסט',
      agprice: 120,
      kindOf: 'monthly'
    });
  });
});
