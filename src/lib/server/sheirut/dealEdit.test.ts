import { describe, expect, it, vi } from 'vitest';
import { dealSignersFor, loadMissionDeal, signersFromDeal, syncDealLine, type MissionDeal } from './dealEdit';

/** A qid-397 answer: one BOM line (10 h × 60) carried by mission 90, held by provider 1. */
function dealAnswer(sheirutId: string, total = 1800, quant = 1) {
  const user = (id: string) => ({ data: { id, attributes: { username: `u${id}` } } });
  return {
    data: {
      sheirut: {
        data: {
          id: sheirutId,
          attributes: {
            total,
            quant,
            users_permissions_users: { data: [{ id: '9' }] },
            halukas: { data: [] },
            sales: { data: [] },
            matanot: {
              data: {
                id: '48',
                attributes: {
                  name: 'wish',
                  ratson: { data: { id: '16' } },
                  matanot_recipe_missions: {
                    data: [{ id: '11', attributes: { hoursPerUnit: 10, ratePerHour: 60, assignedMember: user('1'), notes: 'Music' } }]
                  },
                  matanot_recipe_resources: { data: [] }
                }
              }
            },
            project: {
              data: {
                id: '91',
                attributes: {
                  user_1s: { data: [{ id: '1' }, { id: '2' }] },
                  mesimabetahaliches: {
                    data: [
                      {
                        id: '90',
                        attributes: { name: 'Music', hoursassinged: 10, perhour: 60, users_permissions_user: user('1'), finnished_missions: { data: [] } }
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
  };
}

function world(sheiruts: Array<{ id: string; wish: boolean }>, opts: { errors?: boolean } = {}) {
  const calls: Array<{ qid: string; vars: any }> = [];
  const run = vi.fn(async (qid: string, vars: any) => {
    calls.push({ qid, vars });
    if (qid === '398missionDeals') {
      if (opts.errors) return { errors: [{ message: 'Forbidden' }] };
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: String(vars.id),
              attributes: {
                project: {
                  data: {
                    id: '91',
                    attributes: {
                      sheiruts: {
                        data: sheiruts.map((s) => ({
                          id: s.id,
                          attributes: { matanot: { data: { id: '48', attributes: { ratson: { data: s.wish ? { id: '16' } : null } } } } }
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
    if (qid === '397sheirutDealDue') return dealAnswer(String(vars.id));
    return { data: { ok: true } };
  });
  return { run, calls };
}

const deal: MissionDeal = {
  missionId: '90',
  missionName: 'Music',
  sheirutId: '8',
  projectId: '91',
  dealTotal: 1800,
  quant: 1,
  clientIds: ['9'],
  lineKey: '11',
  cap: 600,
  missionHours: 10,
  missionRate: 60,
  providerId: '1',
  providerName: 'u1'
};

describe('loadMissionDeal', () => {
  it('finds the wish deal whose line the mission carries, reading only wish deals', async () => {
    const w = world([
      { id: '7', wish: false },
      { id: '8', wish: true }
    ]);
    const d = await loadMissionDeal(w.run, '90');
    expect(d).toMatchObject({ sheirutId: '8', lineKey: '11', cap: 600, clientIds: ['9'], missionHours: 10, missionRate: 60, dealTotal: 1800 });
    expect(w.calls.filter((c) => c.qid === '397sheirutDealDue').map((c) => c.vars.id)).toEqual(['8']);
  });

  it('an ordinary rikma costs one light read and answers null', async () => {
    const w = world([{ id: '7', wish: false }]);
    expect(await loadMissionDeal(w.run, '90')).toBeNull();
    expect(w.calls.map((c) => c.qid)).toEqual(['398missionDeals']);
  });

  it('a mission the deal does not carry is not a deal mission', async () => {
    const w = world([{ id: '8', wish: true }]);
    expect(await loadMissionDeal(w.run, '55')).toBeNull();
  });

  it('a failed read never passes for "no customer"', async () => {
    const w = world([], { errors: true });
    await expect(loadMissionDeal(w.run, '90')).rejects.toThrow(/Could not read the deal/);
  });
});

describe('syncDealLine', () => {
  it('raising: the line carries the new terms, the deal grows and is not fully paid any more', async () => {
    const w = world([]);
    expect(await syncDealLine(w.run, deal, { hm: 15 })).toEqual({ changed: true, delta: 300 });
    expect(w.calls).toEqual([
      { qid: '399updateDealLineTerms', vars: { id: '11', hoursPerUnit: 15, ratePerHour: 60 } },
      { qid: '213updateSheirut', vars: { id: '8', data: { total: 2100, price: 2100, moneyTransfered: false } } }
    ]);
  });

  it('lowering lowers her ceiling and the total', async () => {
    const w = world([]);
    expect(await syncDealLine(w.run, { ...deal, quant: 2, dealTotal: 3600 }, { hm: 8 })).toEqual({ changed: true, delta: -120 });
    expect(w.calls[1]).toEqual({ qid: '213updateSheirut', vars: { id: '8', data: { total: 3360, price: 1680 } } });
  });

  it('the same value writes nothing', async () => {
    const w = world([]);
    expect(await syncDealLine(w.run, deal, { hm: 12, price: 50 })).toEqual({ changed: false, delta: 0 });
    expect(w.calls).toEqual([]);
  });
});

describe('the deal’s signers', () => {
  it('need her on an edit that raises the part, never on a removal', () => {
    const s = signersFromDeal(vi.fn() as any, deal);
    const round = (over: any) => ({ ordern: 1, proposedById: null, zman: null, mode: 'keep', ...over });
    expect(s.ids).toEqual(['9']);
    expect(s.needed(round({ hm: 15 }) as any)).toBe(true);
    expect(s.needed(round({ hm: 8 }) as any)).toBe(false);
    expect(s.needed(round({ mode: 'archive', hm: 15 }) as any)).toBe(false);
  });

  it('only for an edit/removal on a mission in progress', async () => {
    const w = world([{ id: '8', wish: true }]);
    const of = dealSignersFor(w.run);
    const decision = (over: any) => ({ kind: 'editObject', targetKind: 'missionInProgress', targetId: '90', ...over }) as any;
    expect(await of(decision({}))).not.toBeNull();
    expect(await of(decision({ targetKind: 'openMission' }))).toBeNull();
    expect(await of(decision({ kind: 'stipendPledge' }))).toBeNull();
  });
});
