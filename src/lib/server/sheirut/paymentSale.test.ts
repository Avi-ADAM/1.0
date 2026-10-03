import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordWishPaymentSale } from './paymentSale';

/**
 * QA_CONCIERGE_E2E C-17 — the customer's payment, once both sides confirmed it, is the
 * rikma's income: a Sale held by the receiver, so the split mechanism sees the money.
 */

const NOW = new Date('2026-10-04T10:00:00.000Z');
const args = { sheirutId: '8', halukaId: '81', senderId: '261', receiverId: '256', amount: 1800 };

interface Opts {
  wishDeal?: boolean;
  total?: number;
  sales?: { id: string; attributes: { in?: number; externalId?: string } }[];
  noProject?: boolean;
  createFails?: boolean;
  contextFails?: boolean;
}

function world(o: Opts = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === '395sheirutPaymentContext') {
        if (o.contextFails) return { errors: [{ message: 'nope' }] };
        return {
          data: {
            sheirut: {
              data: {
                id: '8',
                attributes: {
                  total: o.total ?? 1800,
                  quant: 1,
                  project: { data: o.noProject ? null : { id: '91' } },
                  matanot: { data: { id: '48', attributes: { ratson: { data: o.wishDeal === false ? null : { id: '16' } } } } },
                  users_permissions_users: { data: [{ id: '261' }] },
                  sales: { data: o.sales ?? [] }
                }
              }
            }
          }
        };
      }
      if (qid === '396createSheirutPaymentSale') {
        return o.createFails ? { errors: [{ message: 'boom' }] } : { data: { createSale: { data: { id: '501', attributes: { in: vars.in } } } } };
      }
      return { data: {} };
    })
  };
  return { calls, strapi };
}

const go = (w: ReturnType<typeof world>, over: Partial<typeof args> = {}) =>
  recordWishPaymentSale(w.strapi as any, { jwt: 'jwt', fetch: (() => {}) as any }, { ...args, ...over }, () => NOW);

describe('the customer’s payment becomes the rikma’s income', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('records a Sale held by the receiver, confirmed by both sides, linked to the deal', async () => {
    const w = world();
    const out = await go(w);
    expect(out).toEqual({ saleId: '501', paid: true });
    const sale = w.calls.find((c) => c.qid === '396createSheirutPaymentSale')!.vars;
    expect(sale).toMatchObject({
      project: '91',
      matanot: '48',
      holder: '256', // whoever received the money holds the rikma's share of it
      customer: '261',
      reporter: '261',
      sheirut: '8',
      in: 1800,
      unit: 1,
      date: NOW.toISOString()
    });
    expect(sale.externalId).toBe('sheirut-payment:haluka:81'); // the idempotency key
    expect(sale.note).toBeUndefined(); // the sales table shows no technical line
  });

  it('the deal reads paid: both flags move once the income covers the total', async () => {
    const w = world();
    await go(w);
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars).toEqual({
      id: '8',
      data: { iTransferMoney: true, moneyTransfered: true }
    });
  });

  it('a part-payment records its part but does not yet read paid — the last transfer does', async () => {
    const first = world({ total: 1800 });
    expect(await go(first, { amount: 600, halukaId: '81' })).toEqual({ saleId: '501', paid: false });
    expect(first.calls.some((c) => c.qid === '213updateSheirut')).toBe(false);

    const last = world({
      total: 1800,
      sales: [{ id: '500', attributes: { in: 600, externalId: 'sheirut-payment:haluka:81' } }]
    });
    expect(await go(last, { amount: 1200, halukaId: '82' })).toEqual({ saleId: '501', paid: true });
    expect(last.calls.some((c) => c.qid === '213updateSheirut')).toBe(true);
  });

  it('is idempotent: the same haluka completing twice records nothing the second time', async () => {
    const w = world({ sales: [{ id: '500', attributes: { in: 1800, externalId: 'sheirut-payment:haluka:81' } }] });
    expect(await go(w)).toEqual({ saleId: null, skipped: 'already recorded' });
    expect(w.calls.some((c) => c.qid === '396createSheirutPaymentSale')).toBe(false);
  });

  it('a haluka whose id merely starts with the same digits is another payment', async () => {
    const w = world({ sales: [{ id: '500', attributes: { in: 100, externalId: 'sheirut-payment:haluka:810' } }] });
    expect((await go(w)).saleId).toBe('501');
  });

  it('leaves every deal that did not come from a wish alone — a seller reports those sales', async () => {
    const w = world({ wishDeal: false });
    expect(await go(w)).toEqual({ saleId: null, skipped: 'not a wish deal' });
    expect(w.calls.some((c) => c.qid === '396createSheirutPaymentSale')).toBe(false);
    expect(w.calls.some((c) => c.qid === '213updateSheirut')).toBe(false);
  });

  it('records nothing for no money, or a deal with no rikma', async () => {
    expect(await go(world(), { amount: 0 })).toEqual({ saleId: null, skipped: 'no amount' });
    expect(await go(world({ noProject: true }))).toEqual({ saleId: null, skipped: 'incomplete deal' });
  });

  it('never throws: the money already moved, so a failure is reported and the confirmation stands', async () => {
    expect(await go(world({ createFails: true }))).toEqual({ saleId: null, skipped: 'failed' });
    expect(await go(world({ contextFails: true }))).toEqual({ saleId: null, skipped: 'failed' });
    const boom = { execute: vi.fn().mockRejectedValue(new Error('network')) };
    expect(await recordWishPaymentSale(boom as any, { jwt: 'j', fetch: (() => {}) as any }, args)).toEqual({
      saleId: null,
      skipped: 'failed'
    });
  });

  it('the income is recorded even if the deal flags cannot be moved', async () => {
    const w = world();
    const orig = w.strapi.execute.getMockImplementation()!;
    w.strapi.execute.mockImplementation(async (qid: string, vars: any) => {
      if (qid === '213updateSheirut') throw new Error('flags down');
      return orig(qid, vars);
    });
    expect(await go(w)).toEqual({ saleId: '501', paid: true });
  });
});
