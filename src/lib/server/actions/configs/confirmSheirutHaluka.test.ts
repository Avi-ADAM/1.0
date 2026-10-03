import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmSheirutHalukaConfig } from './confirmSheirutHaluka';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-17 — a customer's payment is recorded as the rikma's income at the
 * moment BOTH sides have confirmed it, once, whichever of them confirms last.
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

  it('the receiver confirming last completes the pair and records the income', async () => {
    const w = world({ senderconf: true });
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(out).toMatchObject({ complete: true, saleId: '501' });
    expect(recorded(w)).toBe(true);
  });

  it('the customer confirming last does too', async () => {
    const w = world({ confirmed: true });
    const out: any = await go(w, 'sender', CUSTOMER);
    expect(out).toMatchObject({ complete: true, saleId: '501' });
  });

  it('records nothing while only one side has confirmed', async () => {
    const w = world();
    const out: any = await go(w, 'receiver', RECEIVER);
    expect(out).toMatchObject({ complete: false, saleId: null });
    expect(recorded(w)).toBe(false);
  });

  it('records once: confirming again after the pair is complete adds nothing', async () => {
    const w = world({ senderconf: true, confirmed: true });
    await go(w, 'receiver', RECEIVER);
    expect(recorded(w)).toBe(false);
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
