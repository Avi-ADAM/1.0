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
  /** Answer qid 397 (what the deal owes): approved value per line and whether it closed. */
  owed?: { lines: Array<{ cap: number; approved: number; closed: boolean }>; recorded?: number };
  /** Answer qid 418: the providers (user ids) who confirmed receiving their part (C-19). */
  confirmedBy?: string[];
}

/** A qid-397 answer: one BOM line + one mission per entry, each held by its own provider. */
function owedAnswer(o: NonNullable<Opts['owed']>, total: number) {
  const user = (id: string) => ({ data: { id, attributes: { username: `u${id}` } } });
  return {
    data: {
      sheirut: {
        data: {
          id: '8',
          attributes: {
            total,
            users_permissions_users: { data: [{ id: '261' }] },
            halukas: { data: [] },
            sales: {
              data: o.recorded ? [{ id: '501', attributes: { in: o.recorded, externalId: 'sheirut-payment:haluka:81' } }] : []
            },
            matanot: {
              data: {
                id: '48',
                attributes: {
                  name: 'wish',
                  ratson: { data: { id: '16' } },
                  matanot_recipe_missions: {
                    data: o.lines.map((l, i) => ({
                      id: String(10 + i),
                      attributes: { hoursPerUnit: 1, ratePerHour: l.cap, assignedMember: user(String(i + 1)), notes: `line ${i}` }
                    }))
                  },
                  matanot_recipe_resources: { data: [] }
                }
              }
            },
            project: {
              data: {
                id: '91',
                attributes: {
                  user_1s: { data: o.lines.map((_, i) => ({ id: String(i + 1) })) },
                  mesimabetahaliches: {
                    data: o.lines.map((l, i) => ({
                      id: String(90 + i),
                      attributes: {
                        name: `line ${i}`,
                        finnished: l.closed,
                        users_permissions_user: user(String(i + 1)),
                        finnished_missions: { data: [{ id: String(i), attributes: { noofhours: 1, total: l.approved } }] }
                      }
                    }))
                  }
                }
              }
            }
          }
        }
      }
    }
  };
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
      if (qid === '397sheirutDealDue' && o.owed) return owedAnswer(o.owed, o.total ?? 1800);
      if (qid === '418dealPartsReceived') {
        return {
          data: {
            sheirut: {
              data: {
                id: '8',
                attributes: {
                  total: o.total ?? 1800,
                  moneyTransfered: false,
                  iTransferMoney: false,
                  iGotMoney: (o.confirmedBy ?? []).map((u, i) => ({
                    id: String(700 + i),
                    iGotMoney: true,
                    users_permissions_user: { data: { id: u } }
                  }))
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
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('records a Sale held by the receiver, confirmed by both sides, linked to the deal', async () => {
    const w = world();
    const out = await go(w);
    // Her side is done; "paid" waits for the providers (C-19, the next tests).
    expect(out).toEqual({ saleId: '501', paid: false });
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

  it('once the income covers the total her side is done — "paid" waits for every provider (C-19)', async () => {
    const w = world();
    await go(w);
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars).toEqual({
      id: '8',
      data: { iTransferMoney: true }
    });
  });

  it('the deal reads paid when the income is covered and every provider confirmed their part (C-19)', async () => {
    const lines = [
      { cap: 600, approved: 600, closed: true },
      { cap: 1200, approved: 1200, closed: true }
    ];
    const all = world({ owed: { lines, recorded: 1800 }, confirmedBy: ['1', '2'] });
    expect(await go(all)).toEqual({ saleId: '501', paid: true });
    expect(all.calls.find((c) => c.qid === '213updateSheirut')!.vars).toEqual({
      id: '8',
      data: { iTransferMoney: true, moneyTransfered: true }
    });

    const one = world({ owed: { lines, recorded: 1800 }, confirmedBy: ['1'] });
    expect(await go(one)).toEqual({ saleId: '501', paid: false });
    expect(one.calls.find((c) => c.qid === '213updateSheirut')!.vars.data).toEqual({ iTransferMoney: true });
  });

  it('a part-payment records its part but does not yet read paid — the last transfer does', async () => {
    const first = world({ total: 1800 });
    expect(await go(first, { amount: 600, halukaId: '81' })).toEqual({ saleId: '501', paid: false });
    expect(first.calls.some((c) => c.qid === '213updateSheirut')).toBe(false);

    const last = world({
      total: 1800,
      sales: [{ id: '500', attributes: { in: 600, externalId: 'sheirut-payment:haluka:81' } }]
    });
    // The last transfer covers her side; the providers have not confirmed yet.
    expect(await go(last, { amount: 1200, halukaId: '82' })).toEqual({ saleId: '501', paid: false });
    expect(last.calls.find((c) => c.qid === '213updateSheirut')!.vars.data).toEqual({ iTransferMoney: true });
  });

  it('a wish deal reads paid once the approved hours are covered, not the agreed price (C-14)', async () => {
    const w = world({
      owed: { lines: [{ cap: 600, approved: 3.4, closed: true }, { cap: 1200, approved: 17.85, closed: true }], recorded: 21.25 },
      confirmedBy: ['1', '2']
    });
    expect(await go(w, { amount: 21.25 })).toEqual({ saleId: '501', paid: true });
    expect(w.calls.some((c) => c.qid === '213updateSheirut')).toBe(true);
  });

  it('a wish deal does not read paid while one of its missions is still open', async () => {
    const w = world({
      owed: { lines: [{ cap: 600, approved: 600, closed: true }, { cap: 1200, approved: 300, closed: false }], recorded: 1800 }
    });
    expect(await go(w)).toEqual({ saleId: '501', paid: false });
    expect(w.calls.some((c) => c.qid === '213updateSheirut')).toBe(false);
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
    // The Sale stands; the deal is not reported paid when its flags did not move.
    expect(await go(w)).toEqual({ saleId: '501', paid: false });
  });
});
