import { describe, expect, it, vi } from 'vitest';
import { partsState, providerParts, readPartEntries, withPartReceived } from '$lib/sheirut/partsReceived';
import { confirmPartReceived } from './partsReceived';

/** QA_CONCIERGE_E2E C-19 — a deal reads "paid" only once every provider has their part. */

const lines = [
  { providerId: '256', providerName: 'Dana', due: 300, cap: 600 },
  { providerId: '258', providerName: 'Ori', due: 1200, cap: 1200 },
  { providerId: '256', providerName: 'Dana', due: 100, cap: 100 },
  { providerId: null, due: 0, cap: 400 } // an open gap: nobody's part yet
];

describe('partsReceived (pure)', () => {
  it("a provider's part is the sum of what their lines are owed", () => {
    expect(providerParts(lines)).toEqual([
      { providerId: '256', name: 'Dana', due: 400, cap: 700 },
      { providerId: '258', name: 'Ori', due: 1200, cap: 1200 }
    ]);
  });

  it('paid only when every provider confirmed — one is not enough', () => {
    const parts = providerParts(lines);
    const one = withPartReceived([], '256');
    expect(partsState(parts, one)).toMatchObject({ confirmed: ['256'], pending: ['258'], allConfirmed: false });
    expect(partsState(parts, withPartReceived(one, '258')).allConfirmed).toBe(true);
    expect(partsState([], []).allConfirmed).toBe(false);
  });

  it('one entry per user; a rewrite keeps the existing row ids', () => {
    const entries = readPartEntries([{ id: '7', iGotMoney: false, users_permissions_user: { data: { id: '256' } } }]);
    expect(withPartReceived(entries, '256')).toEqual([{ id: '7', userId: '256', iGotMoney: true }]);
  });
});

function dueAnswer() {
  const user = (id: string, n: string) => ({ data: { id, attributes: { username: n } } });
  return {
    data: {
      sheirut: {
        data: {
          id: '8',
          attributes: {
            total: 1800,
            users_permissions_users: { data: [{ id: '261' }] },
            halukas: { data: [] },
            sales: { data: [] },
            matanot: {
              data: {
                id: '48',
                attributes: {
                  name: 'wish',
                  ratson: { data: { id: '16' } },
                  matanot_recipe_missions: {
                    data: [
                      { id: '70', attributes: { hoursPerUnit: 1, ratePerHour: 600, notes: 'a', assignedMember: user('256', 'Dana') } },
                      { id: '71', attributes: { hoursPerUnit: 1, ratePerHour: 1200, notes: 'b', assignedMember: user('258', 'Ori') } }
                    ]
                  },
                  matanot_recipe_resources: { data: [] }
                }
              }
            },
            project: { data: { id: '91', attributes: { user_1s: { data: [{ id: '256' }, { id: '258' }] }, mesimabetahaliches: { data: [] } } } }
          }
        }
      }
    }
  };
}

function world(confirmed: string[]) {
  const calls: { qid: string; vars: any }[] = [];
  const run = vi.fn(async (qid: string, vars: any) => {
    calls.push({ qid, vars });
    if (qid === '397sheirutDealDue') return dueAnswer();
    if (qid === '418dealPartsReceived') {
      return {
        data: {
          sheirut: {
            data: {
              id: '8',
              attributes: {
                moneyTransfered: false,
                iTransferMoney: true,
                iGotMoney: confirmed.map((u, i) => ({ id: String(i + 1), iGotMoney: true, users_permissions_user: { data: { id: u } } }))
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

describe('confirmPartReceived', () => {
  it('records the provider’s own confirmation; the deal is not paid while another waits', async () => {
    const w = world([]);
    const out = await confirmPartReceived(w.run, '8', '256');
    expect(out.becamePaid).toBe(false);
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars).toEqual({
      id: '8',
      data: { iGotMoney: [{ iGotMoney: true, users_permissions_user: '256' }] }
    });
  });

  it('the last provider to confirm makes the deal paid', async () => {
    const w = world(['258']);
    const out = await confirmPartReceived(w.run, '8', '256');
    expect(out.becamePaid).toBe(true);
    expect(w.calls.find((c) => c.qid === '213updateSheirut')!.vars.data).toMatchObject({ moneyTransfered: true, iTransferMoney: true });
  });

  it('nobody confirms on a provider’s behalf — not the customer, not a stranger', async () => {
    await expect(confirmPartReceived(world([]).run, '8', '261')).rejects.toThrow(/Only a provider/);
    await expect(confirmPartReceived(world([]).run, '8', '999')).rejects.toThrow(/Only a provider/);
  });

  it('refuses an amount that moved since it was shown — and writes nothing', async () => {
    const shown = (await confirmPartReceived(world([]).run, '8', '256')).state.parts.find((p) => p.providerId === '256')!.due;
    const w = world([]);
    await expect(confirmPartReceived(w.run, '8', '256', shown + 50)).rejects.toMatchObject({ code: 'AMOUNT_MOVED' });
    expect(w.calls.some((c) => c.qid === '213updateSheirut')).toBe(false);
    await expect(confirmPartReceived(world([]).run, '8', '256', shown)).resolves.toBeTruthy();
  });
});
