import { describe, expect, it } from 'vitest';
import { carvedKey, carvePlan, partViaSplit, providerTransfers, readDealCarriage, receivedViaSplit } from './splitCarriage';

/**
 * Deal 9 of 2026-10-07: customer 261 paid 2,750 to 258 (table, 2,250); 256 holds the
 * computer part (500). The rikma's split carries 256's part as a transfer 258 → 256.
 */

const parts = [
  { providerId: '258', name: 'Claude 2', due: 2250, cap: 2250 },
  { providerId: '256', name: 'Claude', due: 500, cap: 500 }
];

const user = (id: string, n: string) => ({ data: { id, attributes: { username: n } } });

function res(opts: { sales?: any[] } = {}) {
  return {
    data: {
      sheirut: {
        data: {
          id: '9',
          attributes: {
            sales: {
              data: opts.sales ?? [
                {
                  id: '7',
                  attributes: {
                    in: 2750,
                    externalId: 'sheirut-payment:haluka:40',
                    splited: false,
                    users_permissions_user: { data: { id: '258' } },
                    tosplits: { data: [] }
                  }
                }
              ]
            }
          }
        }
      }
    }
  };
}

const splitSale = (halukas: any[]) => ({
  id: '7',
  attributes: {
    in: 2750,
    externalId: 'sheirut-payment:haluka:40',
    splited: true,
    users_permissions_user: { data: { id: '258' } },
    tosplits: {
      data: [{ id: '70', attributes: { project: { data: { id: '92' } }, halukas: { data: halukas } } }]
    }
  }
});

const transfer = (id: string, from: [string, string], to: [string, string], amount: number, confirmed = false) => ({
  id,
  attributes: { amount, confirmed, senderconf: confirmed, usersend: user(...from), userrecive: user(...to), forum: { data: null } }
});

describe('readDealCarriage', () => {
  it('reads the payment Sales and the transfers of the splits that took them — other Sales are not the deal payment', () => {
    const c = readDealCarriage(
      res({
        sales: [
          splitSale([transfer('81', ['258', 'Claude 2'], ['256', 'Claude'], 500)]),
          { id: '8', attributes: { in: 90, externalId: null, users_permissions_user: { data: { id: '256' } }, tosplits: { data: [] } } }
        ]
      })
    );
    expect(c.sales.map((s) => s.id)).toEqual(['7']);
    expect(c.sales[0].inSplit).toBe(true);
    expect(c.transfers).toEqual([
      expect.objectContaining({ id: '81', amount: 500, senderId: '258', senderName: 'Claude 2', receiverId: '256', tosplitId: '70', projectId: '92' })
    ]);
  });

  it('reads the proxy shape too (no `data` root)', () => {
    expect(readDealCarriage(res().data).sales).toHaveLength(1);
  });
});

describe('a part through the split', () => {
  const c = readDealCarriage(res({ sales: [splitSale([transfer('81', ['258', 'Claude 2'], ['256', 'Claude'], 500)])] }));

  it('is asked on its transfer, not on the deal', () => {
    expect(partViaSplit(c, '256')).toBe(true);
    expect(partViaSplit(c, '258')).toBe(false);
    expect(receivedViaSplit(c, '256')).toBe(false);
  });

  it('is received once every transfer to the provider arrived', () => {
    const done = readDealCarriage(res({ sales: [splitSale([transfer('81', ['258', 'Claude 2'], ['256', 'Claude'], 500, true)])] }));
    expect(receivedViaSplit(done, '256')).toBe(true);
    const half = readDealCarriage(
      res({
        sales: [
          splitSale([
            transfer('81', ['258', 'Claude 2'], ['256', 'Claude'], 300, true),
            transfer('82', ['300', 'Other'], ['256', 'Claude'], 200)
          ])
        ]
      })
    );
    expect(receivedViaSplit(half, '256')).toBe(false);
  });

  it('the deal shows only the transfers that bring its providers their part', () => {
    const mixed = readDealCarriage(
      res({
        sales: [
          splitSale([transfer('81', ['258', 'Claude 2'], ['256', 'Claude'], 500), transfer('83', ['258', 'Claude 2'], ['300', 'Other'], 40)])
        ]
      })
    );
    expect(providerTransfers(mixed, parts).map((t) => t.id)).toEqual(['81']);
  });
});

describe('carvePlan — a part already handed over is never a split debt', () => {
  it("256 confirmed before any split took the payment: 500 moves out of 258's Sale into one held by 256", () => {
    const steps = carvePlan({ parts, confirmed: ['256'], carriage: readDealCarriage(res()) });
    expect(steps).toEqual([
      { providerId: '256', fromSaleId: '7', fromIn: 2250, amount: 500, key: carvedKey('sheirut-payment:haluka:40', '256') }
    ]);
  });

  it('is idempotent: once 256 holds their part, nothing is carved again', () => {
    const carried = readDealCarriage(
      res({
        sales: [
          { id: '7', attributes: { in: 2250, externalId: 'sheirut-payment:haluka:40', users_permissions_user: { data: { id: '258' } }, tosplits: { data: [] } } },
          { id: '9', attributes: { in: 500, externalId: 'sheirut-payment:haluka:40:part:256', users_permissions_user: { data: { id: '256' } }, tosplits: { data: [] } } }
        ]
      })
    );
    expect(carvePlan({ parts, confirmed: ['256'], carriage: carried })).toEqual([]);
  });

  it('nothing to carve for a provider who has not confirmed, or who received the payment themselves', () => {
    const c = readDealCarriage(res());
    expect(carvePlan({ parts, confirmed: [], carriage: c })).toEqual([]);
    expect(carvePlan({ parts, confirmed: ['258'], carriage: c })).toEqual([]);
  });

  it('never out of a payment a split already took — its transfers carry the part', () => {
    const c = readDealCarriage(res({ sales: [splitSale([])] }));
    expect(carvePlan({ parts, confirmed: ['256'], carriage: c })).toEqual([]);
  });

  it("never out of another provider's carved part", () => {
    const c = readDealCarriage(
      res({
        sales: [
          { id: '9', attributes: { in: 500, externalId: 'sheirut-payment:haluka:40:part:300', users_permissions_user: { data: { id: '300' } }, tosplits: { data: [] } } }
        ]
      })
    );
    expect(carvePlan({ parts, confirmed: ['256'], carriage: c })).toEqual([]);
  });

  it('a part larger than one payment is taken from the next one', () => {
    const c = readDealCarriage(
      res({
        sales: [
          { id: '7', attributes: { in: 300, externalId: 'sheirut-payment:haluka:40', users_permissions_user: { data: { id: '258' } }, tosplits: { data: [] } } },
          { id: '8', attributes: { in: 1000, externalId: 'sheirut-payment:haluka:41', users_permissions_user: { data: { id: '258' } }, tosplits: { data: [] } } }
        ]
      })
    );
    expect(carvePlan({ parts, confirmed: ['256'], carriage: c }).map((s) => [s.fromSaleId, s.amount, s.fromIn])).toEqual([
      ['7', 300, 0],
      ['8', 200, 800]
    ]);
  });
});
