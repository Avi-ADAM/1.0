import { describe, expect, it, vi } from 'vitest';
import { NotADealReceiverError, receiveDealMoney } from './dealMoney';

/**
 * One write for "the money arrived" (deal page "my part" = transfer card "received").
 * The world is deal 9 of 2026-10-07: customer 261 paid 2,750 to 258 (table, 2,250),
 * 256 holds the computer part (500).
 */

const user = (id: string, n: string) => ({ data: { id, attributes: { username: n } } });

function world(opts: { transfers?: any[]; partsConfirmed?: string[]; wish?: boolean } = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const transfers = opts.transfers ?? [
    { id: '40', attributes: { amount: 2750, senderconf: true, confirmed: false, usersend: { data: { id: '261' } }, userrecive: { data: { id: '258' } } } }
  ];
  const run = vi.fn(async (qid: string, vars: any) => {
    calls.push({ qid, vars });
    if (qid === '397sheirutDealDue') {
      return {
        data: {
          sheirut: {
            data: {
              id: '9',
              attributes: {
                total: 2750,
                users_permissions_users: { data: [{ id: '261' }] },
                halukas: { data: transfers },
                sales: { data: [] },
                matanot: {
                  data: {
                    id: '50',
                    attributes: {
                      name: 'workspace',
                      ratson: opts.wish === false ? { data: null } : { data: { id: '18' } },
                      matanot_recipe_missions: {
                        data: [
                          { id: '80', attributes: { hoursPerUnit: 15, ratePerHour: 150, notes: 'table', assignedMember: user('258', 'Claude 2') } },
                          { id: '81', attributes: { hoursPerUnit: 2, ratePerHour: 250, notes: 'pc', assignedMember: user('256', 'Claude') } }
                        ]
                      },
                      matanot_recipe_resources: { data: [] }
                    }
                  }
                },
                project: { data: { id: '92', attributes: { user_1s: { data: [{ id: '256' }, { id: '258' }] }, mesimabetahaliches: { data: [] } } } }
              }
            }
          }
        }
      };
    }
    if (qid === '418dealPartsReceived') {
      return {
        data: {
          sheirut: {
            data: {
              id: '9',
              attributes: {
                moneyTransfered: false,
                iTransferMoney: true,
                iGotMoney: (opts.partsConfirmed ?? []).map((u, i) => ({ id: String(i + 1), iGotMoney: true, users_permissions_user: { data: { id: u } } }))
              }
            }
          }
        }
      };
    }
    return { data: {} };
  });
  return { run, calls };
}

describe('receiveDealMoney', () => {
  it("the receiver's confirmation settles the transfer AND marks their own part — one click, both cards", async () => {
    const w = world();
    const recordSale = vi.fn(async () => ({ saleId: '7' }));
    const out = await receiveDealMoney(w.run, '9', '258', { recordSale });

    expect(w.calls.find((c) => c.qid === '71.6confirmHaluka')!.vars).toEqual({ id: '40', confirmed: true, senderconf: true });
    expect(recordSale).toHaveBeenCalledTimes(1);
    expect(out.transfers.map((t) => t.id)).toEqual(['40']);
    const partWrite = w.calls.find((c) => c.qid === '213updateSheirut')!.vars;
    expect(partWrite.data.iGotMoney).toEqual([{ iGotMoney: true, users_permissions_user: '258' }]);
    // 256 has not confirmed their own part — the deal is not paid on 258's word
    expect(out.part!.becamePaid).toBe(false);
  });

  it("never confirms another provider's part: 256 stays pending after 258 received the whole payment", async () => {
    const w = world();
    const out = await receiveDealMoney(w.run, '9', '258');
    expect(out.part!.state.pending).toEqual(['256']);
  });

  it('a transfer already settled is not settled (or recorded) twice', async () => {
    const w = world({
      transfers: [{ id: '40', attributes: { amount: 2750, senderconf: true, confirmed: true, usersend: { data: { id: '261' } }, userrecive: { data: { id: '258' } } } }]
    });
    const recordSale = vi.fn(async () => ({}));
    const out = await receiveDealMoney(w.run, '9', '258', { recordSale });
    expect(w.calls.some((c) => c.qid === '71.6confirmHaluka')).toBe(false);
    expect(recordSale).not.toHaveBeenCalled();
    expect(out.transfers).toEqual([]);
  });

  it('the receiver does not wait for the sender: an unconfirmed send is settled by the receipt', async () => {
    const w = world({
      transfers: [{ id: '41', attributes: { amount: 2750, senderconf: false, confirmed: false, usersend: { data: { id: '261' } }, userrecive: { data: { id: '258' } } } }]
    });
    await receiveDealMoney(w.run, '9', '258');
    expect(w.calls.find((c) => c.qid === '71.6confirmHaluka')!.vars).toMatchObject({ confirmed: true, senderconf: true });
  });

  it('a provider with no transfer to them confirms only their part', async () => {
    const w = world();
    const out = await receiveDealMoney(w.run, '9', '256');
    expect(w.calls.some((c) => c.qid === '71.6confirmHaluka')).toBe(false);
    expect(out.part!.state.confirmed).toEqual(['256']);
  });

  it('the deal-page button refuses a non-provider before writing anything', async () => {
    // 300 is a member who only received the payment, not a provider
    const w = world({
      transfers: [{ id: '42', attributes: { amount: 2750, senderconf: true, confirmed: false, usersend: { data: { id: '261' } }, userrecive: { data: { id: '300' } } } }]
    });
    await expect(receiveDealMoney(w.run, '9', '300', { requireProvider: true })).rejects.toBeInstanceOf(NotADealReceiverError);
    expect(w.calls.some((c) => c.qid === '71.6confirmHaluka' || c.qid === '213updateSheirut')).toBe(false);
    // …while the transfer card (no requireProvider) settles their transfer
    const w2 = world({
      transfers: [{ id: '42', attributes: { amount: 2750, senderconf: true, confirmed: false, usersend: { data: { id: '261' } }, userrecive: { data: { id: '300' } } } }]
    });
    const out = await receiveDealMoney(w2.run, '9', '300');
    expect(out.transfers.map((t) => t.id)).toEqual(['42']);
    expect(out.part).toBeNull();
  });

  it('a stranger, the customer, or a non-wish deal is refused', async () => {
    await expect(receiveDealMoney(world().run, '9', '999')).rejects.toBeInstanceOf(NotADealReceiverError);
    await expect(receiveDealMoney(world().run, '9', '261')).rejects.toBeInstanceOf(NotADealReceiverError);
    await expect(receiveDealMoney(world({ wish: false }).run, '9', '258')).rejects.toBeInstanceOf(NotADealReceiverError);
  });
});
