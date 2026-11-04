import { describe, expect, it, vi } from 'vitest';
import { settleBackfill, votsFromRequest } from './settleBackfill';
import { normalizeBackfill } from '$lib/recurring/backfill';

const NOW = new Date(2026, 10, 4, 12);

function makeStrapi() {
  const calls: Array<{ qid: string; vars: Record<string, any> }> = [];
  let maap = 100;
  let rikmashTotal = 0;
  let deliveries: any[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: Record<string, any>) => {
      calls.push({ qid, vars });
      if (qid === 'mrCreateCycleMaap') return { data: { createMaap: { data: { id: String(++maap) } } } };
      if (qid === 'mrCreateRikmash') {
        rikmashTotal = vars.data.total;
        deliveries = vars.data.deliveries;
        return { data: { createRikmash: { data: { id: '900' } } } };
      }
      if (qid === 'mrGetRikmashForDelivery')
        return { data: { rikmash: { data: { attributes: { total: rikmashTotal, cyclesCount: deliveries.length, deliveries } } } } };
      if (qid === 'mrUpdateRikmash') {
        rikmashTotal = vars.data.total;
        deliveries = vars.data.deliveries;
      }
      return { data: {} };
    })
  };
  return {
    strapi,
    matching: (qid: string) => calls.filter((c) => c.qid === qid),
    ledger: () => ({ total: rikmashTotal, deliveries })
  };
}

const cycles = normalizeBackfill(
  [
    { key: '2026-08', amount: 100 },
    { key: '2026-09', amount: 110 },
    { key: '2026-10', amount: 120 }
  ],
  { unit: 'month', anchor: new Date(2026, 7, 1), now: NOW }
);

describe('settleBackfill', () => {
  it('opens and settles every past month on one ledger, in order, dated at month end', async () => {
    const { strapi, matching, ledger } = makeStrapi();
    const n = await settleBackfill(strapi, {}, {
      projectId: '7',
      mashId: '30',
      mashAttrs: { name: 'שרת', kindOf: 'monthly', pricePerUnit: 100, users_permissions_user: { data: { id: '4' } } },
      name: 'שרת',
      cycles,
      vots: [{ what: true, users_permissions_user: '4', order: 0 }],
      confirmedBy: '4',
      spId: '12',
      now: NOW
    });

    expect(n).toBe(3);
    const opened = matching('mrCreateCycleMaap').map((c) => c.vars.data);
    expect(opened.map((d) => d.cycleIndex)).toEqual([1, 2, 3]);
    expect(opened[0]).toMatchObject({ mashabetahalich: '30', sp: '12', quantityDelivered: 100 });
    expect(opened[0].cycleStart).toBe(new Date(2026, 7, 1).toISOString());

    // One Rikmash, created once and then appended to.
    expect(matching('mrCreateRikmash')).toHaveLength(1);
    expect(matching('mrUpdateRikmash')).toHaveLength(2);
    expect(ledger().total).toBe(330);
    expect(ledger().deliveries.map((d: any) => d.deliveredAt)).toEqual(cycles.map((c) => c.cycleEnd.toISOString()));

    // The engine's running total follows along.
    const totals = matching('mrUpdateMashabetahalich').map((c) => c.vars.data.quantityDelivered);
    expect(totals).toEqual([100, 210, 330]);

    // Every past cycle is archived with the request's signatures.
    const archived = matching('mrUpdateCycleMaap').map((c) => c.vars.data);
    expect(archived.every((d) => d.archived === true && d.vots.length === 1)).toBe(true);
  });

  it('does nothing without cycles', async () => {
    const { strapi } = makeStrapi();
    const n = await settleBackfill(strapi, {}, {
      projectId: '7',
      mashId: '30',
      mashAttrs: {},
      name: 'x',
      cycles: [],
      vots: [],
      confirmedBy: '4'
    });
    expect(n).toBe(0);
    expect(strapi.execute).not.toHaveBeenCalled();
  });
});

describe('votsFromRequest', () => {
  it('flattens Strapi-shaped and plain votes', () => {
    expect(
      votsFromRequest([
        { what: true, order: 1, users_permissions_user: { data: { id: 4 } } },
        { what: false, why: 'x', users_permissions_user: '5' },
        { what: true }
      ])
    ).toEqual([
      { what: true, users_permissions_user: '4', order: 1 },
      { what: false, users_permissions_user: '5', order: 0, why: 'x' }
    ]);
    expect(votsFromRequest(null)).toEqual([]);
  });
});
