// S2b shadow-spec derivation (HANDOFF T4 step 6) — pure mapping tests,
// no crypto/IDB needed (same approach as shadowSign.test.ts).

import { describe, it, expect } from 'vitest';
import { deriveConsentEventFromAction, type SignableConsentEvent } from '$lib/client/shadowSign';
import { project } from '$lib/consent/projection';
import type { ConsentEvent } from '$lib/consent/event';
import { s2bShadowJobs } from './s2b';

describe('createMission shadow jobs', () => {
  const params = {
    projectId: 'p1', missionName: 'build', nhours: 10, valph: 50
  };

  it('maps the pendm branch to mission.create with branch:pend and the stage id', () => {
    const jobs = s2bShadowJobs.createMission(params, {
      missionId: '77', createdEntityId: '900', createdEntityType: 'pendm'
    });
    expect(jobs).toHaveLength(1);
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('mission.create');
    expect(ev?.subject).toEqual({ type: 'mission', id: '77' });
    expect(ev?.predicate).toMatchObject({
      name: 'build', hours: 10, perhour: 50, branch: 'pend', stageIds: ['900']
    });
  });

  it('maps mesimabetahalich to branch:self and an assigned multi-user to branch:ask', () => {
    const self = s2bShadowJobs.createMission(params, {
      missionId: '77', createdEntityId: '901', createdEntityType: 'mesimabetahalich'
    });
    expect(deriveConsentEventFromAction(self[0].spec, self[0].params)?.predicate)
      .toMatchObject({ branch: 'self' });

    const asked = s2bShadowJobs.createMission({ ...params, assignedUserId: '5' }, {
      missionId: '77', createdEntityId: '902', createdEntityType: 'openMission'
    });
    expect(deriveConsentEventFromAction(asked[0].spec, asked[0].params)?.predicate)
      .toMatchObject({ branch: 'ask', assignee: '5' });
  });

  it('shadow-skips when the server returned no missionId', () => {
    expect(s2bShadowJobs.createMission(params, {})).toEqual([]);
  });
});

describe('completeMission / createChatMessage / createHaluka shadow jobs', () => {
  it('completeMission signs mission.complete with hoursDone + why', () => {
    const jobs = s2bShadowJobs.completeMission(
      { missionId: 'mb-3', hoursdon: '8', why: 'done' }, {}
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('mission.complete');
    expect(ev?.subject).toEqual({ type: 'mission', id: 'mb-3' });
    expect(ev?.predicate).toMatchObject({ hoursDone: 8, why: 'done' });
  });

  it('createChatMessage signs message.post with the message as subject', () => {
    const jobs = s2bShadowJobs.createChatMessage(
      { forumId: 'F1', message: 'hello' }, { messageId: 'm-42' }
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('message.post');
    expect(ev?.subject).toEqual({ type: 'message', id: 'm-42' });
    expect(ev?.predicate).toMatchObject({ forumId: 'F1', body: 'hello' });
    // no messageId → skip, never throw
    expect(s2bShadowJobs.createChatMessage({ forumId: 'F1', message: 'x' }, {})).toEqual([]);
  });

  it('createHaluka signs haluka.create from the GraphQL result shape', () => {
    const jobs = s2bShadowJobs.createHaluka(
      { data: { usersend: '1', userrecive: '2', tosplit: 'T1', amount: 120, matbea: 'ILS' } },
      { createHaluka: { data: { id: 'H9' } } }
    );
    const ev = deriveConsentEventFromAction(jobs[0].spec, jobs[0].params);
    expect(ev?.action).toBe('haluka.create');
    expect(ev?.subject).toEqual({ type: 'haluka', id: 'H9' });
    expect(ev?.predicate).toMatchObject({
      from: '1', to: '2', tosplitId: 'T1', amount: 120, code: 'ILS'
    });
  });
});

// ------------------------------------------------------------- A2: the split
// The events these jobs sign are run through the real reducers: the
// predicate must be exactly what the projection reads, and none of them may
// move a balance (A2 card — Strapi hervachti is per user, not per rikma).

let seq = 0;
function asEvent(t: SignableConsentEvent | null, actor: string, ts: number): ConsentEvent {
  if (!t) throw new Error('template expected');
  return {
    v: 1, id: `e${++seq}`, actor, device: 'd', action: t.action, subject: t.subject,
    predicate: t.predicate, parents: [], ts, nonce: 'n', sig: 's'
  } as ConsentEvent;
}

const derive = (jobs: ReturnType<(typeof s2bShadowJobs)[string]>) =>
  jobs.map((j) => deriveConsentEventFromAction(j.spec, j.params));

describe('createTosplit shadow job', () => {
  const params = {
    data: { project: '45', halukas: ['H1', { id: 'H2' }], sales: [7, 8], hervachti: [{ amount: 100 }] }
  };

  it('signs tosplit.create from the raw GraphQL result, ids only', () => {
    const [t] = derive(s2bShadowJobs.createTosplit(params, { data: { createTosplit: { data: { id: 'T5' } } } }));
    expect(t?.action).toBe('tosplit.create');
    expect(t?.subject).toEqual({ type: 'tosplit', id: 'T5' });
    expect(t?.predicate).toEqual({ halukaIds: ['H1', 'H2'], saleIds: ['7', '8'] });
  });

  it('routes into the rikma from data.project', () => {
    const [job] = s2bShadowJobs.createTosplit(params, { createTosplit: { data: { id: 'T5' } } });
    expect(job.spec.projectIdFromParams?.(job.params)).toBe('45');
  });

  it('shadow-skips a failed create', () => {
    expect(s2bShadowJobs.createTosplit(params, { errors: [{}] })).toEqual([]);
  });
});

describe('approveHaluka shadow job', () => {
  it('one haluka.approve per transfer, with the split it belongs to and no deltas', () => {
    const ts = derive(
      s2bShadowJobs.approveHaluka(
        { tosplitId: 'T5', projectId: '45', halukot: ['H1', { id: 'H2' }], hervachUpdates: [{ userId: '1', amountDelta: 50 }] },
        {}
      )
    );
    expect(ts.map((t) => t?.subject)).toEqual([
      { type: 'haluka', id: 'H1' },
      { type: 'haluka', id: 'H2' }
    ]);
    for (const t of ts) {
      expect(t?.action).toBe('haluka.approve');
      expect(t?.predicate).toEqual({ tosplitId: 'T5' });
    }
  });

  it('a split with nothing to transfer signs nothing', () => {
    expect(s2bShadowJobs.approveHaluka({ tosplitId: 'T5', projectId: '45', halukot: [] }, {})).toEqual([]);
    expect(s2bShadowJobs.approveHaluka({ projectId: '45', halukot: ['H1'] }, {})).toEqual([]);
  });
});

describe('confirmHaluka shadow job', () => {
  it('the receiver signs haluka.confirm', () => {
    const [t] = derive(s2bShadowJobs.confirmHaluka({ halukaId: 'H1', projectId: '45', kind: 'receive' }, {}));
    expect(t?.action).toBe('haluka.confirm');
    expect(t?.subject).toEqual({ type: 'haluka', id: 'H1' });
    expect(t?.predicate).toEqual({});
  });

  it("the sender's confirmation has no chain event", () => {
    expect(s2bShadowJobs.confirmHaluka({ halukaId: 'H1', projectId: '45', kind: 'send' }, {})).toEqual([]);
  });

  it('no project (the deals page passes "") falls back to the mirror path', () => {
    const [job] = s2bShadowJobs.confirmHaluka({ halukaId: 'H1', projectId: '', kind: 'receive' }, {});
    expect(job.params.projectId).toBeUndefined();
  });
});

describe('the split lifecycle through the reducers', () => {
  it('create → haluka.create → approve → confirm: statuses move, balances do not', () => {
    const tosplit = derive(
      s2bShadowJobs.createTosplit({ data: { project: '45', halukas: ['H1'] } }, { data: { createTosplit: { data: { id: 'T5' } } } })
    )[0];
    const haluka = derive(
      s2bShadowJobs.createHaluka(
        { data: { project: '45', usersend: '256', userrecive: '258', tosplit: 'T5', amount: 120, matbea: 'ILS' } },
        { createHaluka: { data: { id: 'H1' } } }
      )
    )[0];
    const approve = derive(s2bShadowJobs.approveHaluka({ tosplitId: 'T5', projectId: '45', halukot: ['H1'] }, {}))[0];
    const confirm = derive(s2bShadowJobs.confirmHaluka({ halukaId: 'H1', projectId: '45', kind: 'receive' }, {}))[0];

    const events = [
      asEvent(tosplit, '256', 1),
      asEvent(haluka, '256', 2),
      asEvent(approve, '261', 3),
      asEvent(confirm, '258', 4)
    ];
    const state = project(events, '45');

    expect(state.tosplits.get('T5')?.predicate).toEqual({ halukaIds: ['H1'], saleIds: [] });
    expect(state.halukas.get('H1')).toMatchObject({ from: '256', to: '258', tosplitId: 'T5', status: 'confirmed' });
    expect(state.balances.size).toBe(0);

    // stop before the receipt: approved, not confirmed
    expect(project(events.slice(0, 3), '45').halukas.get('H1')?.status).toBe('approved');
  });

  it("a confirm signed by anyone but the receiver changes nothing", () => {
    const haluka = derive(
      s2bShadowJobs.createHaluka(
        { data: { usersend: '256', userrecive: '258', tosplit: 'T5', amount: 1 } },
        { createHaluka: { data: { id: 'H1' } } }
      )
    )[0];
    const confirm = derive(s2bShadowJobs.confirmHaluka({ halukaId: 'H1', projectId: '45', kind: 'receive' }, {}))[0];
    const state = project([asEvent(haluka, '256', 1), asEvent(confirm, '261', 2)], '45');
    expect(state.halukas.get('H1')?.status).toBe('pending');
  });
});

describe('timer shadow jobs (time.tick)', () => {
  const t0 = '2026-10-30T09:00:00.000Z';
  const t1 = '2026-10-30T10:30:00.000Z';
  const t2 = '2026-10-30T11:00:00.000Z';
  const t3 = '2026-10-30T11:20:00.000Z';
  const ms = (iso: string) => Date.parse(iso);

  it('a new timer: start on the created id, fresh, ordered by its first interval', () => {
    const [ev] = derive(
      s2bShadowJobs.timerStart(
        { missionId: 'M9', projectId: '45', userId: '256', timerId: '0', start: t0, timers: [{ start: t0 }] },
        { createTimer: { data: { id: '71' } } }
      )
    );
    expect(ev?.action).toBe('time.tick');
    expect(ev?.subject).toEqual({ type: 'timer', id: '71' });
    expect(ev?.predicate).toEqual({ op: 'start', order: ms(t0), sessionMs: undefined, fresh: true, mission: 'M9' });
  });

  it('a resume: start on the existing id, ordered by newStart, not fresh', () => {
    const [ev] = derive(
      s2bShadowJobs.timerStart(
        { missionId: 'M9', projectId: '45', timerId: '71', newStart: t2, timers: [{ start: t0, stop: t1 }, { start: t2 }] },
        {}
      )
    );
    expect(ev?.subject.id).toBe('71');
    expect(ev?.predicate).toMatchObject({ op: 'start', order: ms(t2) });
    expect(ev?.predicate?.fresh).toBeUndefined();
  });

  it('a manual timer, or a start with no id or time, signs nothing', () => {
    expect(s2bShadowJobs.timerStart({ missionId: 'M9', projectId: '45', manual: true }, { createTimer: { data: { id: '72' } } })).toEqual([]);
    expect(s2bShadowJobs.timerStart({ timerId: '0', start: t0 }, {})).toEqual([]);
    expect(s2bShadowJobs.timerStart({ timerId: '71' }, {})).toEqual([]);
  });

  it('a stop declares exactly the interval(s) it closed', () => {
    const [ev] = derive(
      s2bShadowJobs.timerStop(
        { timerId: '71', projectId: '45', isActive: false, timers: [{ start: t0, stop: t1 }, { start: t2, stop: t3 }] },
        {}
      )
    );
    expect(ev?.predicate).toMatchObject({ op: 'stop', order: ms(t3), sessionMs: 20 * 60_000 });
  });

  it('a stop that closed two open intervals at once declares both', () => {
    const closed = s2bShadowJobs.timerStop(
      { timerId: '71', isActive: false, timers: [{ start: t0, stop: t3 }, { start: t2, stop: t3 }] },
      {}
    );
    expect(closed[0].params.sessionMs).toBe(ms(t3) - ms(t0) + (ms(t3) - ms(t2)));
  });

  it('an update that leaves the timer running, or has nothing closed, is not a stop', () => {
    expect(s2bShadowJobs.timerStop({ timerId: '71', isActive: true, timers: [{ start: t0, stop: t1 }] }, {})).toEqual([]);
    expect(s2bShadowJobs.timerStop({ timerId: '71', isActive: false, timers: [{ start: t0 }] }, {})).toEqual([]);
    expect(s2bShadowJobs.timerStop({ timerId: '71', isActive: false }, {})).toEqual([]);
  });

  it('through the reducer: start and stop both count, a repeated stop folds into the first', () => {
    const start = derive(
      s2bShadowJobs.timerStart(
        { missionId: 'M9', projectId: '45', timerId: '0', start: t0 },
        { createTimer: { data: { id: '71' } } }
      )
    )[0];
    const stopParams = { timerId: '71', projectId: '45', isActive: false, timers: [{ start: t0, stop: t1 }] };
    const stop = derive(s2bShadowJobs.timerStop(stopParams, {}))[0];
    const again = derive(s2bShadowJobs.timerStop(stopParams, {}))[0];

    const once = project([asEvent(start, '256', ms(t0)), asEvent(stop, '256', ms(t1))], '45');
    expect(once.timers.get('71')).toEqual({ id: '71', totalMs: 90 * 60_000 });

    const twice = project(
      [asEvent(start, '256', ms(t0)), asEvent(stop, '256', ms(t1)), asEvent(again, '256', ms(t1) + 5_000)],
      '45'
    );
    expect(twice.timers.get('71')?.totalMs).toBe(90 * 60_000);
  });
});
