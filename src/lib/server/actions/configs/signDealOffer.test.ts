import { describe, expect, it, vi } from 'vitest';
import { signDealOfferConfig } from './signDealOffer';
import { readDealOffers } from '$lib/server/deal/dealOffers';

/** QA_CONCIERGE_E2E C-19 — the customer signs a candidacy on a part of her deal. */

vi.mock('$lib/server/nego/timegrama.js', () => ({ ensureCandidacyTimegrama: vi.fn(async () => 'tg1') }));

const offer = {
  id: '300',
  attributes: {
    name: 'Laptop repair',
    noofhours: 4,
    perhour: 100,
    project: { data: { id: '91' } },
    pendm: {
      data: {
        id: '50',
        attributes: {
          matanot_recipe_missions: {
            data: [
              {
                id: '70',
                attributes: {
                  hoursPerUnit: 4,
                  ratePerHour: 100,
                  assignedMember: { data: null },
                  matanot: {
                    data: {
                      id: '48',
                      attributes: {
                        sheiruts: {
                          data: [{ id: '8', attributes: { quant: 1, total: 1800, project: { data: { id: '91' } }, users_permissions_users: { data: [{ id: '261' }] } } }]
                        }
                      }
                    }
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

function world(memberVoted: boolean) {
  const calls: { qid: string; vars: any }[] = [];
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      calls.push({ qid, vars });
      if (qid === '412askOfferDeal') return { data: { ask: { data: { id: '5', attributes: { open_mission: { data: offer } } } } } };
      if (qid === 'getAskNegoRounds') {
        return {
          data: {
            ask: {
              data: {
                id: '5',
                attributes: {
                  archived: false,
                  vots: memberVoted ? [{ what: true, order: 0, users_permissions_user: { data: { id: '256' } } }] : [],
                  users_permissions_user: { data: { id: '400' } },
                  open_mission: { data: { attributes: { isRishon: false } } },
                  project: { data: { attributes: { user_1s: { data: [{ id: '256' }, { id: '258' }] } } } },
                  negopendmissions: { data: [] }
                }
              }
            }
          }
        };
      }
      return { data: {} };
    })
  };
  return { strapi, calls };
}

const sign = (w: ReturnType<typeof world>, userId: string) =>
  (signDealOfferConfig.graphqlOperation as any)({ side: 'ask', id: '5' }, { userId, jwt: 'j', fetch: vi.fn() }, { strapi: w.strapi });

describe('signDealOffer', () => {
  it('records her yes at the standing round and tells the rikma', async () => {
    const w = world(false);
    const out = await sign(w, '261');
    const vots = w.calls.find((c) => c.qid === '120addVoteToAsk')!.vars.vots;
    expect(vots).toEqual([expect.objectContaining({ what: true, users_permissions_user: '261', order: 0 })]);
    expect(out.data).toMatchObject({ signed: true, approvable: false, pending: { members: true, candidate: false, clients: [] } });
    expect(out.recipientIds.sort()).toEqual(['256', '258']);
    expect(w.calls.some((c) => c.qid === 'mrResetTimegrama')).toBe(false);
  });

  it('when hers was the last signature missing, the clock is brought to now', async () => {
    const w = world(true);
    const out = await sign(w, '261');
    expect(out.data.approvable).toBe(true);
    expect(w.calls.find((c) => c.qid === 'mrResetTimegrama')!.vars.id).toBe('tg1');
  });

  it('only the customer of the deal signs', async () => {
    await expect(sign(world(true), '256')).rejects.toThrow(/Only the customer/);
  });

  it('refuses to sign a round other than the one she was shown — and writes nothing', async () => {
    const w = world(false);
    const run = (signDealOfferConfig.graphqlOperation as any)(
      { side: 'ask', id: '5', expectRound: 2 },
      { userId: '261', jwt: 'j', fetch: vi.fn() },
      { strapi: w.strapi }
    );
    await expect(run).rejects.toMatchObject({ code: 'ROUND_MOVED', details: { expected: 2, standing: 0 } });
    expect(w.calls.some((c) => c.qid === '120addVoteToAsk')).toBe(false);
  });
});

describe('readDealOffers — the deal page view', () => {
  it('runs each candidacy through the same gate the finalizers use', () => {
    const res = {
      sheirut: {
        data: {
          attributes: {
            users_permissions_users: { data: [{ id: '261' }] },
            project: { data: { attributes: { user_1s: { data: [{ id: '256' }] } } } },
            matanot: {
              data: {
                attributes: {
                  matanot_recipe_missions: {
                    data: [
                      {
                        attributes: {
                          assignedMember: { data: null },
                          pendm: {
                            data: {
                              attributes: {
                                open_mission: {
                                  data: {
                                    id: '300',
                                    attributes: {
                                      name: 'Laptop repair',
                                      noofhours: 4,
                                      perhour: 100,
                                      asks: {
                                        data: [
                                          {
                                            id: '5',
                                            attributes: {
                                              users_permissions_user: { data: { id: '400', attributes: { username: 'Noa' } } },
                                              vots: [{ what: true, order: 1, users_permissions_user: { data: { id: '256' } } }],
                                              negopendmissions: { data: [{ attributes: { ordern: 1, proposedBy: 'candidate', noofhours: 5, perhour: 120 } }] }
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  },
                  matanot_recipe_resources: { data: [] }
                }
              }
            }
          }
        }
      }
    };
    const v = readDealOffers(res, '261');
    expect(v.offers[0].candidacies[0]).toMatchObject({
      candidateName: 'Noa',
      amount: 5,
      unitPrice: 120,
      price: 600,
      signedByViewer: false,
      clientsPending: 1,
      membersSigned: true,
      candidateAgreed: true,
      approvable: false
    });
  });
});
