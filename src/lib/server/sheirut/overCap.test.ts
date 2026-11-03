import { afterEach, describe, expect, it, vi } from 'vitest';
import { capApproval, keepVots, overrunRound, releaseHeldHours } from './overCap';
import type { MissionDeal } from './dealEdit';

// The track is read only while the switch is on (P3); each fixed-price test turns it on.
const flag = vi.hoisted(() => ({ on: false }));
vi.mock('$lib/sheirut/pricingTracksFlag', () => ({ pricingTracksEnabled: () => flag.on }));
afterEach(() => {
  flag.on = false;
});

/** Answers qid 472 with `track` for every deal asked about, and passes the rest to `run`. */
const withTrack = (run: any, track: string) =>
  vi.fn(async (qid: string, vars: any) =>
    qid === '472sheirutPricingTracks'
      ? { data: { sheiruts: { data: vars.ids.map((id: string) => ({ id, attributes: { pricingTrack: track } })) } } }
      : run(qid, vars)
  );

/**
 * One wish deal (Sheirut 8) with one part: mission 90, provider 1, `hours × 60` agreed,
 * `filed` hours already in the books. Members 1 and 2; customer 9.
 */
function world(opts: {
  lineHours: number;
  filed: number;
  wish?: boolean;
  approvals?: Array<{ id: string; hours: number; clockDone: boolean | null; signedBy: string[]; no?: boolean; timer?: boolean }>;
}) {
  const calls: Array<{ qid: string; vars: any }> = [];
  const user = (id: string) => ({ data: { id, attributes: { username: `u${id}` } } });
  const approvals = opts.approvals ?? [];
  const run = vi.fn(async (qid: string, vars: any) => {
    calls.push({ qid, vars });
    if (qid === '398missionDeals') {
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: '90',
              attributes: {
                project: {
                  data: {
                    id: '91',
                    attributes: {
                      sheiruts: {
                        data: [
                          {
                            id: '8',
                            attributes: {
                              matanot: { data: { id: '48', attributes: { ratson: { data: opts.wish === false ? null : { id: '16' } } } } }
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
      };
    }
    if (qid === '397sheirutDealDue') {
      return {
        data: {
          sheirut: {
            data: {
              id: '8',
              attributes: {
                total: opts.lineHours * 60,
                quant: 1,
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
                        data: [
                          { id: '11', attributes: { hoursPerUnit: opts.lineHours, ratePerHour: 60, assignedMember: user('1'), notes: 'Music' } }
                        ]
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
                            attributes: {
                              name: 'Music',
                              hoursassinged: opts.lineHours,
                              perhour: 60,
                              users_permissions_user: user('1'),
                              finnished_missions: {
                                data: opts.filed
                                  ? [{ id: '500', attributes: { noofhours: opts.filed, total: opts.filed * 60 } }]
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
            }
          }
        }
      };
    }
    if (qid === '468missionOpenFiniapruvals') {
      return {
        data: {
          finiapruvals: {
            data: approvals.map((a) => ({
              id: a.id,
              attributes: { timegrama: { data: a.clockDone == null ? null : { id: `t${a.id}`, attributes: { done: a.clockDone } } } }
            }))
          }
        }
      };
    }
    if (qid === '117getFiniapruvalForClose') {
      const a = approvals.find((x) => x.id === String(vars.id))!;
      return {
        data: {
          finiapruval: {
            data: {
              id: a.id,
              attributes: {
                archived: false,
                isTimerSave: a.timer !== false,
                noofhours: a.hours,
                missname: 'Music',
                perhour: 60,
                vots: [
                  ...a.signedBy.map((u) => ({ what: true, order: 1, users_permissions_user: { data: { id: u } } })),
                  ...(a.no ? [{ what: false, order: 1, users_permissions_user: { data: { id: '2' } } }] : [])
                ],
                mesimabetahalich: {
                  data: {
                    id: '90',
                    attributes: {
                      perhour: 60,
                      totalHoursSaved: opts.filed,
                      mission: { data: { id: '70' } },
                      project: { data: { id: '91', attributes: { user_1s: { data: [{ id: '1' }, { id: '2' }] } } } },
                      finnished_missions: {
                        data: opts.filed ? [{ id: '500', attributes: { noofhours: opts.filed, perhour: 60 } }] : []
                      }
                    }
                  }
                },
                project: { data: { id: '91' } },
                users_permissions_user: { data: { id: '1' } }
              }
            }
          }
        }
      };
    }
    return { data: { ok: true } };
  });
  return { run, calls, writes: () => calls.filter((c) => !['398missionDeals', '397sheirutDealDue', '468missionOpenFiniapruvals', '117getFiniapruvalForClose'].includes(c.qid)) };
}

describe('capApproval', () => {
  it('files a mission that is not a part of a wish deal whole', async () => {
    const w = world({ lineHours: 10, filed: 9, wish: false });
    expect(await capApproval(w.run, '90', 5, 60)).toBeNull();
  });

  it('splits an approval at the part’s ceiling', async () => {
    // agreed 10 h × 60 = 600, 9 h (540) already filed → 1 h fits, 2 h wait for her
    const w = world({ lineHours: 10, filed: 9 });
    const c = await capApproval(w.run, '90', 3, 60);
    expect(c?.deal.cap).toBe(600);
    expect(c?.deal.approved).toBe(540);
    expect(c?.split).toMatchObject({ inHours: 1, overHours: 2, overValue: 120 });
  });

  it('refuses to guess when the deal cannot be read', async () => {
    const run = vi.fn(async () => ({ errors: [{ message: 'Forbidden' }] }));
    await expect(capApproval(run, '90', 3, 60)).rejects.toThrow();
  });
});

describe('overrunRound', () => {
  it('raises the part by exactly the held value, at the same rate', () => {
    const deal = { cap: 600, missionRate: 60, missionHours: 10 } as MissionDeal;
    const r = overrunRound(deal, { inHours: 1, overHours: 2, headroom: 60, overValue: 120 }, 'why');
    expect(r).toMatchObject({ mode: 'keep', hm: 12, price: null });
  });
});

describe('releaseHeldHours', () => {
  it('files held hours the raised ceiling now covers, and closes the approval', async () => {
    // the part was raised to 12 h × 60 = 720; 540 filed → 180 of headroom = 3 h
    const w = world({ lineHours: 12, filed: 9, approvals: [{ id: '50', hours: 3, clockDone: true, signedBy: ['1', '2'] }] });
    const out = await releaseHeldHours(w.run, '90');
    expect(out).toEqual({ filed: 3, stillHeld: 0 });
    const qids = w.writes().map((c) => c.qid);
    expect(qids).toContain('114updateFinnishedMissionHours');
    const upd = w.writes().find((c) => c.qid === '114updateFinnishedMissionHours')!;
    expect(upd.vars).toMatchObject({ id: '500', noofhours: 12, total: 720 });
    const close = w.writes().find((c) => c.qid === '118updateFiniapruvalVots')!;
    expect(close.vars).toMatchObject({ id: '50', archived: true });
  });

  it('keeps holding what still does not fit', async () => {
    // raised to 11 h × 60 = 660, 600 already filed → 1 h of the 3 fits
    const w = world({ lineHours: 11, filed: 10, approvals: [{ id: '50', hours: 3, clockDone: true, signedBy: ['1', '2'] }] });
    expect(await releaseHeldHours(w.run, '90')).toEqual({ filed: 1, stillHeld: 2 });
    const held = w.writes().find((c) => c.qid === '386counterFiniapruval')!;
    expect(held.vars).toMatchObject({ id: '50', noofhours: 2 });
    expect(w.writes().some((c) => c.qid === '118updateFiniapruvalVots')).toBe(false);
  });

  it('never touches an approval the rikma is still deciding', async () => {
    const w = world({ lineHours: 12, filed: 9, approvals: [{ id: '50', hours: 3, clockDone: false, signedBy: ['1'] }] });
    expect(await releaseHeldHours(w.run, '90')).toEqual({ filed: 0, stillHeld: 0 });
    expect(w.writes()).toEqual([]);
  });

  it('never touches a disputed approval', async () => {
    const w = world({ lineHours: 12, filed: 9, approvals: [{ id: '50', hours: 3, clockDone: true, signedBy: ['1'], no: true }] });
    expect(await releaseHeldHours(w.run, '90')).toEqual({ filed: 0, stillHeld: 0 });
    expect(w.writes()).toEqual([]);
  });

  it('releases a held finish approval as a final row and marks the mission done', async () => {
    const w = world({ lineHours: 12, filed: 9, approvals: [{ id: '50', hours: 2, clockDone: true, signedBy: ['1', '2'], timer: false }] });
    expect(await releaseHeldHours(w.run, '90')).toEqual({ filed: 2, stillHeld: 0 });
    const fin = w.writes().find((c) => c.qid === '119createFinnishedMissionFinal')!;
    expect(fin.vars).toMatchObject({ noofhours: 2, total: 120, finiapruvals: ['50'] });
    expect(w.writes().some((c) => c.qid === '105updateMesimabetahalichForFinish')).toBe(true);
  });
});

describe('keepVots', () => {
  it('writes back every vote whole', () => {
    expect(
      keepVots([{ what: true, order: 2, why: 'x', zman: 'z', ide: 1, users_permissions_user: { data: { id: '1' } } }])
    ).toEqual([{ what: true, order: 2, why: 'x', zman: 'z', ide: 1, users_permissions_user: '1' }]);
  });
});

describe('P3 — capApproval on a fixed price', () => {
  it('files the approval whole: an overrun is the rikma’s own risk there', async () => {
    flag.on = true;
    const w = world({ lineHours: 10, filed: 9 });
    expect(await capApproval(withTrack(w.run, 'fixed'), '90', 3, 60)).toBeNull();
  });

  it('an at-cost part still splits at its ceiling', async () => {
    flag.on = true;
    const w = world({ lineHours: 10, filed: 9 });
    expect((await capApproval(withTrack(w.run, 'atCost'), '90', 3, 60))?.split).toMatchObject({ inHours: 1, overHours: 2 });
  });
});
