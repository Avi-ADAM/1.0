import { describe, expect, it, vi } from 'vitest';
import { receiveDealMoney } from './dealMoney';
import { loadParts, settlePartsFromSplit } from './partsReceived';
import { carveConfirmedParts } from './splitCarriage';
import { ActionError } from '$lib/server/actions/errors';

/**
 * A provider's part that reaches them through the rikma's split is ONE fact with their
 * "I received my part" on the deal (`$lib/sheirut/splitCarriage`). The world is deal 9 of
 * 2026-10-07: customer 261 paid 2,750 to 258 (table, 2,250), 256 holds the computer part
 * (500); the payment was recorded as Sale 7 held by 258.
 */

const user = (id: string, n: string) => ({ data: { id, attributes: { username: n } } });

interface World {
  /** The split transfer 258 → 256 on split 70, if a split took Sale 7. */
  split?: { confirmed: boolean } | null;
  /** iGotMoney already written. */
  partsConfirmed?: string[];
}

function world(opts: World = {}) {
  const calls: { qid: string; vars: any }[] = [];
  const split = opts.split ?? null;
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
                halukas: {
                  data: [
                    { id: '40', attributes: { amount: 2750, senderconf: true, confirmed: true, usersend: { data: { id: '261' } }, userrecive: { data: { id: '258' } } } }
                  ]
                },
                sales: { data: [{ id: '7', attributes: { in: 2750, externalId: 'sheirut-payment:haluka:40' } }] },
                matanot: {
                  data: {
                    id: '50',
                    attributes: {
                      name: 'workspace',
                      ratson: { data: { id: '18' } },
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
                project: {
                  data: {
                    id: '92',
                    attributes: {
                      user_1s: { data: [{ id: '256' }, { id: '258' }] },
                      // the hours the rikma approved: 15h table, 2h computer — each part is its full price
                      mesimabetahaliches: {
                        data: [
                          { id: 'm80', attributes: { name: 'table', hoursassinged: 15, perhour: 150, finnished: true, users_permissions_user: user('258', 'Claude 2'), finnished_missions: { data: [{ id: 'f1', attributes: { noofhours: 15, total: 2250 } }] } } },
                          { id: 'm81', attributes: { name: 'pc', hoursassinged: 2, perhour: 250, finnished: true, users_permissions_user: user('256', 'Claude'), finnished_missions: { data: [{ id: 'f2', attributes: { noofhours: 2, total: 500 } }] } } }
                        ]
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
    if (qid === '437dealSplitCarriage') {
      return {
        data: {
          sheirut: {
            data: {
              id: '9',
              attributes: {
                sales: {
                  data: [
                    {
                      id: '7',
                      attributes: {
                        in: 2750,
                        externalId: 'sheirut-payment:haluka:40',
                        splited: !!split,
                        users_permissions_user: { data: { id: '258' } },
                        tosplits: {
                          data: split
                            ? [
                                {
                                  id: '70',
                                  attributes: {
                                    project: { data: { id: '92' } },
                                    halukas: {
                                      data: [
                                        {
                                          id: '81',
                                          attributes: {
                                            amount: 500,
                                            confirmed: split.confirmed,
                                            senderconf: split.confirmed,
                                            usersend: user('258', 'Claude 2'),
                                            userrecive: user('256', 'Claude'),
                                            forum: { data: { id: '600' } }
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              ]
                            : []
                        }
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
    if (qid === '439tosplitDeals') {
      return {
        data: {
          tosplit: {
            data: {
              id: '70',
              attributes: {
                sales: {
                  data: [
                    { id: '7', attributes: { externalId: 'sheirut-payment:haluka:40', sheiruts: { data: [{ id: '9' }] } } },
                    // a sale of another product in the same split — not a deal payment
                    { id: '5', attributes: { externalId: null, sheiruts: { data: [{ id: '3' }] } } }
                  ]
                }
              }
            }
          }
        }
      };
    }
    if (qid === '395sheirutPaymentContext') {
      return {
        data: {
          sheirut: {
            data: {
              id: '9',
              attributes: {
                project: { data: { id: '92' } },
                matanot: { data: { id: '50', attributes: { ratson: { data: { id: '18' } } } } },
                users_permissions_users: { data: [{ id: '261' }] }
              }
            }
          }
        }
      };
    }
    if (qid === '396createSheirutPaymentSale') return { data: { createSale: { data: { id: '99', attributes: { in: vars.in } } } } };
    return { data: {} };
  });
  return { run, calls };
}

const writes = (w: ReturnType<typeof world>, qid: string) => w.calls.filter((c) => c.qid === qid).map((c) => c.vars);

describe('the split carries 256’s part: the deal never asks it a second time', () => {
  it('the deal page’s generic button refuses — the part is confirmed on its transfer, "I received it from 258"', async () => {
    const w = world({ split: { confirmed: false } });
    const err = await receiveDealMoney(w.run, '9', '256', { requireProvider: true }).catch((e) => e);
    expect(err).toBeInstanceOf(ActionError);
    expect(err.code).toBe('PART_VIA_SPLIT');
    expect(err.details.transfers).toEqual([{ id: '81', amount: 500, senderId: '258', senderName: 'Claude 2' }]);
    expect(writes(w, '213updateSheirut')).toEqual([]);
  });

  it('confirming the split transfer writes 256’s part on the deal (iGotMoney) — the same fact', async () => {
    const w = world({ split: { confirmed: true }, partsConfirmed: ['258'] });
    const out = await settlePartsFromSplit(w.run, '70', '256');
    expect(out.map((d) => d.sheirutId)).toEqual(['9']);
    const data = writes(w, '213updateSheirut')[0].data;
    expect(data.iGotMoney).toEqual(
      expect.arrayContaining([
        { id: '1', iGotMoney: true, users_permissions_user: '258' },
        { iGotMoney: true, users_permissions_user: '256' }
      ])
    );
    // 256 was the last provider: the deal is paid
    expect(out[0].becamePaid).toBe(true);
    expect(data.moneyTransfered).toBe(true);
  });

  it('a split transfer not yet arrived writes nothing', async () => {
    const w = world({ split: { confirmed: false } });
    expect(await settlePartsFromSplit(w.run, '70', '256')).toEqual([]);
    expect(writes(w, '213updateSheirut')).toEqual([]);
  });

  it('someone who is not a provider of the deal (258 sends, it is not their part) changes nothing', async () => {
    const w = world({ split: { confirmed: true } });
    expect(await settlePartsFromSplit(w.run, '70', '258')).toEqual([]);
  });

  it('read before anything is written: an arrived split transfer already reads as 256’s part received', async () => {
    const parts = await loadParts(world({ split: { confirmed: true } }).run, '9');
    expect(parts!.confirmed).toEqual(['256']);
    expect(parts!.pending).toEqual(['258']);
  });
});

describe('256 already has their part before a split took the payment: no second debt', () => {
  it('the deal page confirms 256’s part and carves 500 out of 258’s Sale into one held by 256', async () => {
    const w = world();
    await receiveDealMoney(w.run, '9', '256', { requireProvider: true });
    expect(writes(w, '396createSheirutPaymentSale')).toEqual([
      expect.objectContaining({ holder: '256', in: 500, unit: 0, sheirut: '9', project: '92', matanot: '50', externalId: 'sheirut-payment:haluka:40:part:256' })
    ]);
    expect(writes(w, '438reduceDealPaymentSale')).toEqual([{ id: '7', in: 2250 }]);
  });

  it('nothing is carved while the provider has not confirmed', async () => {
    const w = world();
    expect(await carveConfirmedParts(w.run, '9', { parts: [{ providerId: '256', name: 'Claude', due: 500, cap: 500 }], confirmed: [] })).toEqual([]);
    expect(writes(w, '396createSheirutPaymentSale')).toEqual([]);
  });

  it('a payment a split already took is never carved — its transfer is how the part travels', async () => {
    const w = world({ split: { confirmed: false } });
    expect(await carveConfirmedParts(w.run, '9', { parts: [{ providerId: '256', name: 'Claude', due: 500, cap: 500 }], confirmed: ['256'] })).toEqual([]);
    expect(writes(w, '438reduceDealPaymentSale')).toEqual([]);
  });
});
