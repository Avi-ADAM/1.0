/**
 * A lead follows its money (PLAN_LEADS L3a) against an in-memory Strapi:
 * an order on the table, a paid order, a sale reported from the lead page,
 * a cancelled order, and a direct buyer who is nobody's lead.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const announced = vi.hoisted(() => [] as any[]);
vi.mock('$lib/server/webhooks/leadEvents.js', () => ({
  announceLeadMoves: vi.fn(async (o: any) => {
    announced.push(...o.moved);
  })
}));

import { syncLeadsAfterMoney } from './moneySync';
import { dedupeKeyOf } from '$lib/leads/dedupe';
import { contactHash } from './store';

type Row = Record<string, any>;
let leads: Map<string, Row>;
let orders: Map<string, Row>;
let activities: Row[];
let salesLive: boolean;

const strapi = {
  execute: vi.fn(async (qid: string, vars: any) => {
    switch (qid) {
      case 'leadOrderLinks': {
        const hit = [...orders.entries()].find(([, o]) => o.project === vars.pid && o.ref === vars.ref);
        if (!hit) return { data: { orders: { data: [] } } };
        const [id, o] = hit;
        const linked = [...leads.entries()].filter(([, l]) => (l.orders ?? []).includes(id)).map(([lid]) => ({ id: lid }));
        return { data: { orders: { data: [{ id, attributes: { ...o, leads: { data: linked } } }] } } };
      }
      case 'leadMoneyOrders': {
        const l = leads.get(vars.id);
        if (!l) return { data: { lead: { data: null } } };
        const os = (l.orders ?? []).map((oid: string) => ({ id: oid, attributes: { status: orders.get(oid)!.status } }));
        return { data: { lead: { data: { id: vars.id, attributes: { status: l.status, project: { data: { id: l.project } }, orders: { data: os } } } } } };
      }
      case 'leadMoneySales': {
        if (!salesLive) throw new Error('Cannot query field "sales"');
        const l = leads.get(vars.id)!;
        return { data: { lead: { data: { id: vars.id, attributes: { sales: { data: (l.sales ?? []).map((id: string) => ({ id })) } } } } } };
      }
      case 'leadsByContact': {
        const pid = vars.filters.project.id.eq;
        const parts: string[] = vars.filters.or.map((o: any) => o.dedupeKey.contains);
        const rows = [...leads.entries()]
          .filter(([, l]) => l.project === pid && parts.some((p) => (l.dedupeKey ?? '').includes(p)))
          .map(([id, l]) => ({ id, attributes: { ...l, owner: { data: null } } }));
        return { data: { leads: { data: rows } } };
      }
      case 'leadUpdate':
        Object.assign(leads.get(vars.id)!, vars.data);
        return { data: { updateLead: { data: { id: vars.id } } } };
      case 'leadActivityCreate':
        activities.push(vars.data);
        return { data: { createLeadActivity: { data: { id: String(activities.length) } } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  })
};
const context = { userId: '5', jwt: 'x', lang: 'he', fetch: vi.fn() as any };
const run = (actionKey: string, params: Record<string, any>, result: any = {}) =>
  syncLeadsAfterMoney({ actionKey, params: { projectId: '57', ...params }, result, context, strapi });

beforeEach(() => {
  strapi.execute.mockClear();
  salesLive = true;
  activities = [];
  announced.length = 0;
  leads = new Map([
    ['70', { project: '57', status: 'talking', dedupeKey: dedupeKeyOf('dana@example.com', '0500000000', contactHash), orders: [] }]
  ]);
  orders = new Map();
});

describe('a lead follows its money', () => {
  it('an offer linked to the lead makes it offered; paying makes it won', async () => {
    orders.set('300', { project: '57', ref: '57:q1', status: 'pendingPayment', buyerPhone: '0500000000' });
    leads.get('70')!.orders = ['300'];
    expect(await run('createPaidOrder', {}, { orderRef: '57:q1', status: 'pendingPayment' })).toEqual([
      { leadId: '70', from: 'talking', to: 'offered' }
    ]);
    orders.get('300')!.status = 'paid';
    await run('confirmOrderPayment', { orderRef: '57:q1' }, { orderRef: '57:q1', changed: true });
    expect(leads.get('70')!.status).toBe('won');
    expect(activities.filter((a) => a.kind === 'statusChange').map((a) => a.toStatus)).toEqual(['offered', 'won']);
    expect(activities.every((a) => !a.actor)).toBe(true);
    expect(announced.map((m) => m.to)).toEqual(['offered', 'won']);
  });

  it('a paid order from the same person is linked to their open lead', async () => {
    orders.set('301', { project: '57', ref: '57:p1', status: 'paid', buyerPhone: '+972 50-000-0000', buyerEmail: null });
    await run('createPaidOrder', {}, { orderRef: '57:p1', status: 'paid' });
    expect(leads.get('70')).toMatchObject({ status: 'won', orders: ['301'] });
    expect(activities.map((a) => a.kind)).toEqual(['linkOrder', 'statusChange']);
  });

  it('a direct buyer is a customer, not a lead — and an unpaid stranger is not linked', async () => {
    orders.set('302', { project: '57', ref: '57:p2', status: 'paid', buyerPhone: '0529999999' });
    orders.set('303', { project: '57', ref: '57:p3', status: 'pendingPayment', buyerPhone: '0500000000' });
    expect(await run('createPaidOrder', {}, { orderRef: '57:p2' })).toEqual([]);
    expect(await run('createPaidOrder', {}, { orderRef: '57:p3', status: 'pendingPayment' })).toEqual([]);
    expect(leads.get('70')!.status).toBe('talking');
    expect(activities).toEqual([]);
  });

  it('a cancelled order sends the lead back to talking', async () => {
    orders.set('300', { project: '57', ref: '57:q1', status: 'cancelled' });
    leads.get('70')!.orders = ['300'];
    leads.get('70')!.status = 'offered';
    await run('cancelOrder', { orderRef: '57:q1' }, { orderRef: '57:q1' });
    expect(leads.get('70')!.status).toBe('talking');
  });

  it('a retry changes nothing', async () => {
    orders.set('300', { project: '57', ref: '57:q1', status: 'paid' });
    leads.get('70')!.orders = ['300'];
    expect(await run('createPaidOrder', {}, { orderRef: '57:q1', duplicated: true })).toEqual([]);
    expect(await run('cancelOrder', { orderRef: '57:q1' }, { alreadyCancelled: true })).toEqual([]);
    expect(strapi.execute).not.toHaveBeenCalledWith('leadOrderLinks', expect.anything(), undefined, expect.anything());
  });

  it('a sale reported from the lead page links the sale and makes it won', async () => {
    await run('createSale', { leadId: '70' }, { saleId: '900' });
    expect(leads.get('70')).toMatchObject({ status: 'won', sales: ['900'] });
    expect(activities[0]).toMatchObject({ kind: 'linkOrder', body: 'sale 900' });
  });

  it('a lead of another rikma is not touched', async () => {
    leads.get('70')!.project = '58';
    expect(await run('createSale', { leadId: '70' }, { saleId: '900' })).toEqual([]);
    expect(leads.get('70')!.status).toBe('talking');
  });

  it('before lead.sales is deployed, orders still work', async () => {
    salesLive = false;
    orders.set('300', { project: '57', ref: '57:q1', status: 'sent' });
    leads.get('70')!.orders = ['300'];
    await run('createPaidOrder', {}, { orderRef: '57:q1' });
    expect(leads.get('70')!.status).toBe('offered');
  });
});
