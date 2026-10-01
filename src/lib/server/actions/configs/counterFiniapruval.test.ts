import { beforeEach, describe, expect, it, vi } from 'vitest';
import { counterFiniapruvalConfig } from './counterFiniapruval';
import { closeFiniapruvalConfig } from './closeFiniapruval';
import { encodeCounter, parseCounter, standingOrder } from '$lib/finiapruval/rounds';
import type { ActionExecutionHandler } from '../types';

/**
 * QA_CONCIERGE_E2E C-15 — there is no veto on a finish approval: the answer to a
 * claim you do not accept is the version you would sign (a counter), and the
 * claim goes round until everyone has signed the same one.
 */

const RIKMA = '5';
const MEMBERS = ['1', '2', '3']; // 1 filed the hours

const vot = (id: string, what: boolean, order?: number, why?: string) => ({
  what,
  why: why ?? null,
  order: order ?? null,
  ide: Number(id),
  zman: '2026-10-01T10:00:00.000Z',
  users_permissions_user: { data: { id } }
});

/** An in-memory Strapi holding one approval — enough for counter + close. */
function world(opts: { vots?: any[]; noofhours?: number; archived?: boolean; isTimerSave?: boolean } = {}) {
  const db = {
    vots: opts.vots ?? [vot('1', true)],
    noofhours: opts.noofhours ?? 5,
    archived: opts.archived ?? false,
    timegrama: { id: 'T1' } as { id: string } | null,
    calls: [] as { qid: string; vars: any }[],
    clocks: [] as any[]
  };
  const strapi = {
    execute: vi.fn(async (qid: string, vars: any) => {
      db.calls.push({ qid, vars });
      switch (qid) {
        case '117getFiniapruvalForClose':
          return {
            data: {
              finiapruval: {
                data: {
                  id: '77',
                  attributes: {
                    archived: db.archived,
                    isTimerSave: opts.isTimerSave ?? true,
                    noofhours: db.noofhours,
                    missname: 'שולחן',
                    why: 'חיתכתי',
                    perhour: 100,
                    vots: db.vots,
                    timegrama: { data: db.timegrama },
                    mesimabetahalich: {
                      data: {
                        id: '9',
                        attributes: {
                          perhour: 100,
                          totalHoursSaved: 0,
                          mission: { data: { id: '4' } },
                          project: {
                            data: { id: RIKMA, attributes: { user_1s: { data: MEMBERS.map((id) => ({ id })) } } }
                          },
                          finnished_missions: { data: [] }
                        }
                      }
                    },
                    project: { data: { id: RIKMA, attributes: { restime: 'sth', projectName: 'הרקמה' } } },
                    users_permissions_user: { data: { id: '1' } },
                    what: { data: [] },
                    timer: { data: null }
                  }
                }
              }
            }
          };
        case '386counterFiniapruval':
          db.vots = vars.vots.map((v: any) => ({
            ...v,
            users_permissions_user: { data: { id: String(v.users_permissions_user) } }
          }));
          db.noofhours = vars.noofhours;
          return { data: { updateFiniapruval: { data: { id: '77' } } } };
        case '118updateFiniapruvalVots':
          db.vots = vars.vots.map((v: any) => ({
            ...v,
            users_permissions_user: { data: { id: String(v.users_permissions_user) } }
          }));
          if (vars.archived) db.archived = true;
          return { data: {} };
        case '32createTimeGrama':
          db.clocks.push(vars);
          return { data: { createTimegrama: { data: { id: 'T2' } } } };
        default:
          return { data: {} };
      }
    })
  };
  const notifier = { notify: vi.fn(async () => ({})) };
  return { db, strapi, notifier };
}

const ctx = (userId: string) => ({ userId, jwt: 'jwt', fetch: (() => {}) as any }) as any;
const counter = counterFiniapruvalConfig.graphqlOperation as ActionExecutionHandler;
const close = closeFiniapruvalConfig.graphqlOperation as ActionExecutionHandler;

const asCounter = (w: ReturnType<typeof world>, who: string, hours: any, note = 'שלוש שעות זה מה שראיתי') =>
  counter({ finiapruvalId: '77', projectId: RIKMA, hours, note }, ctx(who), { strapi: w.strapi, notifier: w.notifier } as any);
const asVote = (w: ReturnType<typeof world>, who: string, vote = true, why?: string) =>
  close({ finiapruvalId: '77', projectId: RIKMA, vote, why }, ctx(who), { strapi: w.strapi } as any);

describe('counterFiniapruval — the version I would sign', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('opens the next round with the new hours, and the proposer signs it', async () => {
    const w = world();
    const out: any = await asCounter(w, '2', 3);

    expect(out.data).toMatchObject({ hours: 3, from: 5, order: 1 });
    expect(w.db.noofhours).toBe(3);
    expect(standingOrder(w.db.vots)).toBe(1);

    const mine = w.db.vots.find((v: any) => v.users_permissions_user.data.id === '2');
    expect(mine).toMatchObject({ what: true, order: 1 });
    expect(parseCounter(mine.why)).toEqual({ from: 5, to: 3, note: 'שלוש שעות זה מה שראיתי' });
  });

  it('keeps the earlier signatures as history — whole', async () => {
    const w = world({ vots: [vot('1', true), vot('3', true, undefined, 'looks right')] });
    await asCounter(w, '2', 3);
    const old = w.db.vots.filter((v: any) => (v.order ?? 0) === 0);
    expect(old.map((v: any) => v.users_permissions_user.data.id).sort()).toEqual(['1', '3']);
    expect(old.find((v: any) => v.users_permissions_user.data.id === '3').why).toBe('looks right');
  });

  it('resets the silence clock: the old timegrama is closed, a new one a restime ahead', async () => {
    const w = world();
    const before = Date.now();
    await asCounter(w, '2', 3);

    expect(w.db.calls.some((c) => c.qid === '35updateTimeGrama' && c.vars.id === 'T1' && c.vars.done === true)).toBe(true);
    expect(w.db.clocks).toHaveLength(1);
    expect(w.db.clocks[0]).toMatchObject({ whatami: 'finiapruval', finiapruval: '77' });
    // the rikma's restime is "sth" = 72 hours
    const due = new Date(w.db.clocks[0].date).getTime() - before;
    expect(due).toBeGreaterThan(71.9 * 3600_000);
    expect(due).toBeLessThan(72.1 * 3600_000);
  });

  it('tells everyone but the proposer', async () => {
    const w = world();
    await asCounter(w, '2', 3);
    const [, params] = w.notifier.notify.mock.calls[0] as any;
    expect(params.recipients.sort()).toEqual(['1', '3']);
  });

  it('“I do not credit these hours” is a counter to 0, not a veto', async () => {
    const w = world();
    const out: any = await asCounter(w, '2', 0, 'the table was never delivered');
    expect(out.data.hours).toBe(0);
    expect(w.db.noofhours).toBe(0);
  });

  it('the claimant can answer a counter with another one — the round count keeps going', async () => {
    const w = world();
    await asCounter(w, '2', 3);
    // 1 signed round 0 only, so the version on the table (round 1) is not yet theirs
    const out: any = await asCounter(w, '1', 4, 'four, I stayed for the glue to dry');
    expect(out.data).toMatchObject({ from: 3, hours: 4, order: 2 });
    expect(w.db.noofhours).toBe(4);
  });

  it('refuses a member who already stands behind the version on the table', async () => {
    const w = world(); // 1 filed it — and signed it
    await expect(asCounter(w, '1', 3)).rejects.toThrow(/already stand behind/);
    expect(w.db.noofhours).toBe(5);
  });

  it('refuses someone outside the rikma, even with a valid project id', async () => {
    const w = world();
    await expect(asCounter(w, '99', 3)).rejects.toThrow(/member of this rikma/);
  });

  it('refuses a counter that changes nothing, a bad number, or a bare number with no reason', async () => {
    const w = world();
    await expect(asCounter(w, '2', 5)).rejects.toThrow(/change the hours/);
    await expect(asCounter(w, '2', -2)).rejects.toThrow(/between 0 and/);
    await expect(asCounter(w, '2', 'abc')).rejects.toThrow(/between 0 and/);
    await expect(asCounter(w, '2', 3, 'no')).rejects.toThrow(/Say why/);
    expect(w.db.noofhours).toBe(5);
    expect(w.db.calls.some((c) => c.qid === '386counterFiniapruval')).toBe(false);
  });

  it('refuses an approval that is already resolved', async () => {
    const w = world({ archived: true });
    await expect(asCounter(w, '2', 3)).rejects.toThrow(/already resolved/);
  });
});

describe('closeFiniapruval — only the version on the table can close', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('a counter sends it back: the old signatures do not close it, the new ones do', async () => {
    const w = world({ vots: [vot('1', true), vot('3', true)] }); // 1 + 3 signed 5h
    await asCounter(w, '2', 3); // 2 would sign 3h → 1 and 3 are asked again

    const first: any = await asVote(w, '1');
    expect(first.closed).toBe(false);
    expect(w.db.archived).toBe(false);

    const last: any = await asVote(w, '3');
    expect(last.closed).toBe(true);
    expect(w.db.archived).toBe(true);
    // what is credited is the version they all signed — 3 hours, not 5
    const filed = w.db.calls.find((c) => c.qid === '113createFinnishedMissionForTimerSave');
    expect(filed?.vars.noofhours).toBe(3);
    expect(filed?.vars.total).toBe(300);
  });

  it('a vote keeps the negotiation: earlier rounds, reasons and times survive it', async () => {
    const w = world();
    await asCounter(w, '2', 3);
    await asVote(w, '1');

    const counterVote = w.db.vots.find((v: any) => v.users_permissions_user.data.id === '2');
    expect(parseCounter(counterVote.why)?.to).toBe(3); // the reason was not erased by the next vote
    expect(counterVote.order).toBe(1);
    const myVote = w.db.vots.find((v: any) => v.users_permissions_user.data.id === '1' && v.order === 1);
    expect(myVote).toMatchObject({ what: true, order: 1 });
    // …and my signature on the old version is still there, as history
    expect(w.db.vots.some((v: any) => v.users_permissions_user.data.id === '1' && (v.order ?? 0) === 0)).toBe(true);
  });

  it('a legacy objection (a "no") at the standing round still blocks — a counter on top is the way out', async () => {
    const w = world({ vots: [vot('1', true), vot('2', false, undefined, 'not what I saw')] });
    const blocked: any = await asVote(w, '3');
    expect(blocked.closed).toBe(false);

    await asCounter(w, '2', 4, 'four is what I would sign'); // 2 answers their own objection with a version
    await asVote(w, '1');
    const done: any = await asVote(w, '3');
    expect(done.closed).toBe(true);
  });

  it('refuses a vote from outside the approval’s own rikma', async () => {
    const w = world();
    await expect(asVote(w, '99')).rejects.toThrow(/member of this rikma/);
    expect(w.db.calls.some((c) => c.qid === '118updateFiniapruvalVots')).toBe(false);
  });

  it('a vote from before rounds existed (no order) closes exactly as it always did', async () => {
    const w = world({ vots: [vot('1', true), vot('2', true)] });
    const out: any = await asVote(w, '3');
    expect(out.closed).toBe(true);
    expect(encodeCounter).toBeTypeOf('function');
  });
});
