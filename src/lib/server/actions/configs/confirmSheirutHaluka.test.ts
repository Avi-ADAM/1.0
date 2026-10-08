import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmSheirutHalukaConfig } from './confirmSheirutHaluka';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-17 — a customer's payment is recorded as the rikma's income once, at
 * the moment it is settled. The receiver's word settles it on its own (money that arrived
 * was sent); a sender's confirmation completes only a legacy transfer the receiver had
 * already confirmed. On a wish deal the receipt is also the receiver's own part
 * (`$lib/server/deal/dealMoney`), so the deal page never asks again.
 */

const CUSTOMER = '261';
const RECEIVER = '256';
const run = confirmSheirutHalukaConfig.graphqlOperation as ActionExecutionHandler;

function world(h: { senderconf?: boolean; confirmed?: boolean; isSiteShare?: boolean; sheirut?: string | null } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      switch (qid) {
        case '71.5getHaluka':
          return {
            data: {
              haluka: {
                data: {
                  id: '81',
                  attributes: {
                    usersend: { data: { id: CUSTOMER } },
                    userrecive: { data: { id: RECEIVER } },
                    senderconf: !!h.senderconf,
                    confirmed: !!h.confirmed,
                    amount: 1800,
                    isSiteShare: !!h.isSiteShare,
                    recive_project: { data: h.isSiteShare ? { id: '3' } : null },
                    sheirut: { data: h.sheirut === null ? null : { id: h.sheirut ?? '8' } }
                  }
                }
              }
            }
          };
        case '395sheirutPaymentContext':
          return {
            data: {
              sheirut: {
                data: {
                  id: '8',
                  attributes: {
                    total: 1800,
                    quant: 1,
                    project: { data: { id: '91' } },
                    matanot: { data: { id: '48', attributes: { ratson: { data: { id: '16' } } } } },
                    users_permissions_users: { data: [{ id: CUSTOMER }] },
                    sales: { data: [] }
                  }
                }
              }
            }
          };
        case '397sheirutDealDue':
          return {
            data: {
              sheirut: {
                data: {
                  id: '8',
                  attributes: {
                    total: 1800,
                    users_permissions_users: { data: [{ id: CUSTOMER }] },
                    halukas: {
                      data: [
                        {
                          id: '81',
                          attributes: {
                            amount: 1800,
                            senderconf: !!h.senderconf,
                            confirmed: !!h.confirmed,
                            usersend: { data: { id: CUSTOMER } },
                            userrecive: { data: { id: RECEIVER } }
                          }
                        }
                      ]
                    },
                    sales: { data: [] },
                    matanot: {
                      data: {
                        id: '48',
                        attributes: {
                          name: 'wish',
                          ratson: { data: { id: '16' } },
                          matanot_recipe_missions: {
                            data: [{ id: '70', attributes: { hoursPerUnit: 1, ratePerHour: 1800, notes: 'a', assignedMember: { data: { id: RECEIVER, attributes: { username: 'Dana' } } } } }]
                          },
                          matanot_recipe_resources: { data: [] }
                        }
                      }
                    },
                    project: { data: { id: '91', attributes: { user_1s: { data: [{ id: RECEIVER }] }, mesimabetahaliches: { data: [] } } } }
                  }
                }
              }
            }
          };
        case '418dealPartsReceived':
          return { data: { sheirut: { data: { id: '8', attributes: { moneyTransfered: false, iTransferMoney: true, iGotMoney: [] } } } } };
        case '396createSheirutPaymentSale':
          return { data: { createSale: { data: { id: '501', attributes: { in: 1800 } } } } };
        case '206createPlatformSale':
          return { data: { createSale: { data: { id: '777' } } } };
        default:
          return { data: {} };
      }
    })
  };
  return { calls, strapi };
}

const go = (w: ReturnType<typeof world>, role: 'sender' | 'receiver', userId: string) =>
  run({ halukaId: '81', role }, { userId, jwt: 'jwt', fetch: (() => {}) as any } as any, { strapi: w.strapi } as any);

const recorded = (w: ReturnType<typeof world>) => w.calls.some((c) => c.qid === '396createSheirutPaymentSale');

describe('confirmSheirutHaluka — the payment reaches the rikma', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('the receiver confirming settles the transfer, records the income and marks their own part', async () => {
    const w = world({ senderconf: true });
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(out).toMatchObject({ complete: true, saleId: '501' });
    expect(recorded(w)).toBe(true);
    expect(w.calls.find((c) => c.qid === '71.6confirmHaluka')!.vars).toEqual({ id: '81', confirmed: true, senderconf: true });
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars.data.iGotMoney).toEqual([{ iGotMoney: true, users_permissions_user: RECEIVER }]);
  });

  it('the customer confirming last does too', async () => {
    const w = world({ confirmed: true });
    const out: any = await go(w, 'sender', CUSTOMER);
    expect(out).toMatchObject({ complete: true, saleId: '501' });
  });

  it('the receiver does not wait for the sender: their word alone settles it', async () => {
    const w = world();
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(out).toMatchObject({ complete: true, saleId: '501' });
    expect(w.calls.find((c) => c.qid === '71.6confirmHaluka')!.vars).toMatchObject({ confirmed: true, senderconf: true });
  });

  it('a sender alone settles nothing — only the receiver can say the money arrived', async () => {
    const w = world();
    const out: any = await go(w, 'sender', CUSTOMER);
    expect(out).toMatchObject({ complete: false, saleId: null });
    expect(recorded(w)).toBe(false);
  });

  it('records once: confirming again after the pair is complete adds nothing', async () => {
    const w = world({ senderconf: true, confirmed: true });
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(recorded(w)).toBe(false);
    expect(out.complete).toBe(false);
  });

  it('a site-share transfer keeps its own way of recording income', async () => {
    const w = world({ senderconf: true, isSiteShare: true });
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(out.saleId).toBe('777');
    expect(recorded(w)).toBe(false);
  });

  it('a transfer that is not for a deal records no payment', async () => {
    const w = world({ senderconf: true, sheirut: null });
    await go(w, 'receiver', RECEIVER);
    expect(recorded(w)).toBe(false);
  });

  it('only the right person confirms each side', async () => {
    await expect(go(world(), 'receiver', CUSTOMER)).rejects.toThrow(/receiver/);
    await expect(go(world(), 'sender', RECEIVER)).rejects.toThrow(/sender/);
  });
});
