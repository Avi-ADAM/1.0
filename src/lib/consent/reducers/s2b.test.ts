// S2b (HANDOFF T4) — the category-A reducer expansion.
//
// Every entity follows the recipe from the handoff: (a) a valid event changes
// state as expected; (b) any arrival order of the same events converges to
// the same state (checked via canonical bytes); (c) a duplicate event does
// not apply twice.

import { describe, it, expect } from 'vitest';
import { project } from '../projection';
import { canonicalBytesOfState } from '../stateRoot';
import type { ConsentEvent } from '../event';

function ev(p: Partial<ConsentEvent> & { id: string; action: string }): ConsentEvent {
  return {
    v: 1,
    id: p.id,
    actor: p.actor ?? 'A',
    device: 'd',
    action: p.action as ConsentEvent['action'],
    subject: p.subject ?? { type: 'project', id: 'p1' },
    predicate: p.predicate,
    parents: p.parents ?? [],
    ts: p.ts ?? 0,
    nonce: 'n',
    sig: 's'
  } as ConsentEvent;
}

/** Same event set in the given order and fully reversed → identical bytes. */
function expectOrderIndependent(events: ConsentEvent[], projectId: string | null = null) {
  const a = canonicalBytesOfState(project(events, projectId));
  const b = canonicalBytesOfState(project([...events].reverse(), projectId));
  expect(Array.from(a)).toEqual(Array.from(b));
}

// ---------------------------------------------------------------- missions

const join = (who: string, ts: number) =>
  ev({ id: `j${who}`, actor: who, action: 'project.join',
       subject: { type: 'project', id: 'p1' }, ts });

describe('mission lifecycle (create → pendm.vote → complete → approve)', () => {
  const create = ev({ id: 'm1', actor: 'A', action: 'mission.create',
    subject: { type: 'mission', id: 'M1' },
    predicate: { name: 'build', hours: 10, perhour: 50, branch: 'pend', stageIds: ['pend-7'] },
    ts: 10 });

  it('mission.create plants a pend mission', () => {
    const s = project([join('A', 1), join('B', 2), create], 'p1');
    expect(s.missions.get('M1')).toMatchObject({
      name: 'build', state: 'pend', createdBy: 'A', hours: 10, perhour: 50
    });
  });

  it('branch self starts inProgress; assignee!=actor starts proposed', () => {
    const self = project([
      ev({ id: 'm1', actor: 'A', action: 'mission.create',
        subject: { type: 'mission', id: 'M1' }, predicate: { branch: 'self' }, ts: 1 })
    ]);
    expect(self.missions.get('M1')?.state).toBe('inProgress');

    const asked = project([
      ev({ id: 'm2', actor: 'A', action: 'mission.create',
        subject: { type: 'mission', id: 'M2' }, predicate: { assignee: 'B' }, ts: 1 })
    ]);
    expect(asked.missions.get('M2')?.state).toBe('proposed');
  });

  it('unanimous pendm.vote (via the stage id) moves the mission to inProgress', () => {
    const s = project([
      join('A', 1), join('B', 2), create,
      ev({ id: 'vA', actor: 'A', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 11 }),
      ev({ id: 'vB', actor: 'B', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 12 })
    ], 'p1');
    expect(s.stageVotes.get('pend:pend-7')?.approved).toBe(true);
    expect(s.missions.get('M1')?.state).toBe('inProgress');
  });

  it('a missing vote keeps the mission pend', () => {
    const s = project([
      join('A', 1), join('B', 2), create,
      ev({ id: 'vA', actor: 'A', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 11 })
    ], 'p1');
    expect(s.stageVotes.get('pend:pend-7')?.approved).toBe(false);
    expect(s.missions.get('M1')?.state).toBe('pend');
  });

  it('mission.complete records the completion; mission.approve credits and closes', () => {
    const s = project([
      join('A', 1), join('B', 2), create,
      ev({ id: 'vA', actor: 'A', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 11 }),
      ev({ id: 'vB', actor: 'B', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 12 }),
      ev({ id: 'done', actor: 'B', action: 'mission.complete',
        subject: { type: 'mission', id: 'M1' },
        predicate: { hoursDone: 8, why: 'shipped it' }, parents: ['vB'], ts: 20 }),
      ev({ id: 'appr', actor: 'A', action: 'mission.approve',
        subject: { type: 'mission', id: 'M1' },
        predicate: { payee: 'B', amount: { amount: '400', code: 'ILS' } },
        parents: ['done'], ts: 30 })
    ], 'p1');
    const m = s.missions.get('M1');
    expect(m?.state).toBe('approved');
    expect(m?.completion).toMatchObject({ by: 'B', hoursDone: 8, why: 'shipped it' });
    expect(m?.approval).toMatchObject({ by: 'A' });
    expect(s.balances.get('B')).toBe(400n);
  });

  it('mission.complete on a legacy mission (no create event) plants a stub', () => {
    const s = project([
      ev({ id: 'done', actor: 'B', action: 'mission.complete',
        subject: { type: 'mission', id: 'legacy-9' }, predicate: { hoursDone: 3 }, ts: 5 })
    ]);
    expect(s.missions.get('legacy-9')).toMatchObject({ state: 'completed' });
  });

  it('is order-independent and dedupes', () => {
    const events = [
      join('A', 1), join('B', 2), create,
      ev({ id: 'vA', actor: 'A', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 11 }),
      ev({ id: 'vB', actor: 'B', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pend-7' }, predicate: { what: true, order: 0 }, ts: 12 })
    ];
    expectOrderIndependent(events, 'p1');
    // duplicate create (same dedupe key) applies once
    const dup = project([...events, { ...create }], 'p1');
    const single = project(events, 'p1');
    expect(Array.from(canonicalBytesOfState(dup)))
      .toEqual(Array.from(canonicalBytesOfState(single)));
  });
});

// ---------------------------------------------------------------- halukas

describe('haluka lifecycle (create → approve → confirm)', () => {
  const create = ev({ id: 'h1', actor: 'A', action: 'haluka.create',
    subject: { type: 'haluka', id: 'H1' },
    predicate: { from: 'A', to: 'B', tosplitId: 'T1', amount: 120, code: 'ILS' }, ts: 1 });

  it('creates pending, approve marks + applies declared hervach deltas', () => {
    const s = project([
      create,
      ev({ id: 'ap', actor: 'A', action: 'haluka.approve',
        subject: { type: 'haluka', id: 'H1' },
        predicate: { hervachDeltas: [
          { member: 'C', amount: { amount: '40', code: 'ILS' } },
          { member: 'D', amount: { amount: '-40', code: 'ILS' } }
        ] },
        parents: ['h1'], ts: 2 })
    ]);
    expect(s.halukas.get('H1')?.status).toBe('approved');
    expect(s.balances.get('C')).toBe(40n);
    expect(s.balances.get('D')).toBe(-40n);
  });

  it('only the receiver can confirm', () => {
    const confirmByStranger = ev({ id: 'cX', actor: 'Z', action: 'haluka.confirm',
      subject: { type: 'haluka', id: 'H1' }, ts: 3 });
    const confirmByReceiver = ev({ id: 'cB', actor: 'B', action: 'haluka.confirm',
      subject: { type: 'haluka', id: 'H1' }, ts: 4 });

    const s1 = project([create, confirmByStranger]);
    expect(s1.halukas.get('H1')?.status).toBe('pending');

    const s2 = project([create, confirmByReceiver]);
    expect(s2.halukas.get('H1')?.status).toBe('confirmed');
  });

  it('malformed create (from === to) is ignored silently', () => {
    const s = project([
      ev({ id: 'bad', actor: 'A', action: 'haluka.create',
        subject: { type: 'haluka', id: 'HX' }, predicate: { from: 'A', to: 'A' }, ts: 1 })
    ]);
    expect(s.halukas.size).toBe(0);
  });

  it('is order-independent and a duplicate approve applies once', () => {
    const approve = ev({ id: 'ap', actor: 'A', action: 'haluka.approve',
      subject: { type: 'haluka', id: 'H1' },
      predicate: { hervachDeltas: [{ member: 'C', amount: { amount: '40', code: 'ILS' } }] },
      parents: ['h1'], ts: 2 });
    expectOrderIndependent([create, approve]);
    const dup = project([create, approve, { ...approve }]);
    expect(dup.balances.get('C')).toBe(40n); // not 80n
  });
});

// ---------------------------------------------------------------- decisions

describe('decision.create + generic decision.vote tally', () => {
  it('records the decision and tallies votes with member unanimity', () => {
    const s = project([
      join('A', 1), join('B', 2),
      ev({ id: 'd1', actor: 'A', action: 'decision.create',
        subject: { type: 'decision', id: 'D1' }, predicate: { kind: 'pubdes', ref: 'pic-3' }, ts: 3 }),
      ev({ id: 'vA', actor: 'A', action: 'decision.vote',
        subject: { type: 'decision', id: 'D1' }, predicate: { what: true, order: 0 }, ts: 4 }),
      ev({ id: 'vB', actor: 'B', action: 'decision.vote',
        subject: { type: 'decision', id: 'D1' }, predicate: { what: true, order: 0 }, ts: 5 })
    ], 'p1');
    expect(s.decisions.get('D1')).toMatchObject({ kind: 'pubdes', ref: 'pic-3' });
    expect(s.stageVotes.get('decision:D1')?.approved).toBe(true);
  });

  it('does not disturb the bilateral saleClaim path', () => {
    const s = project([
      ev({ id: 'r1', actor: 'A', action: 'sale.record',
        subject: { type: 'sale', id: 's1' },
        predicate: { holder: 'B', total: 100, holderStatus: 'open', decisionId: 'DC1', order: 1 }, ts: 1 }),
      ev({ id: 'vB', actor: 'B', action: 'decision.vote',
        subject: { type: 'decision', id: 'DC1' }, predicate: { what: true, order: 1 }, ts: 2 })
    ]);
    expect(s.sales.get('s1')?.status).toBe('confirmed');
    expect(s.stageVotes.has('decision:DC1')).toBe(false); // bilateral, not tallied generically
  });
});

// ---------------------------------------------------------------- timers

describe('time.tick work timer', () => {
  const sub = { type: 'mission', id: 'M1' };

  it('start/stop accumulates elapsed time', () => {
    const s = project([
      ev({ id: 't1', actor: 'A', action: 'time.tick', subject: sub,
        predicate: { op: 'start', order: 100 }, ts: 100 }),
      ev({ id: 't2', actor: 'A', action: 'time.tick', subject: sub,
        predicate: { op: 'stop', order: 250 }, parents: ['t1'], ts: 250 })
    ]);
    expect(s.timers.get('M1')).toMatchObject({ totalMs: 150 });
    expect(s.timers.get('M1')?.runningSince).toBeUndefined();
  });

  it('a declared sessionMs wins over wall-clock, and works without a start', () => {
    const s = project([
      ev({ id: 't2', actor: 'A', action: 'time.tick', subject: sub,
        predicate: { op: 'stop', sessionMs: 5000, order: 1 }, ts: 999 })
    ]);
    expect(s.timers.get('M1')?.totalMs).toBe(5000);
  });

  it('double start is ignored; stop without any segment is ignored', () => {
    const s = project([
      ev({ id: 't1', actor: 'A', action: 'time.tick', subject: sub,
        predicate: { op: 'start', order: 1 }, ts: 100 }),
      ev({ id: 't1b', actor: 'B', action: 'time.tick', subject: sub,
        predicate: { op: 'start', order: 2 }, ts: 120 })
    ]);
    expect(s.timers.get('M1')?.runningSince).toBe(100);
    expect(s.timers.get('M1')?.runningBy).toBe('A');

    const s2 = project([
      ev({ id: 'tz', actor: 'A', action: 'time.tick', subject: sub,
        predicate: { op: 'stop', order: 1 }, ts: 50 })
    ]);
    expect(s2.timers.size).toBe(0);
  });
});

// ---------------------------------------------------------------- forums

describe('forum.create / message.post / payload.redact', () => {
  const forum = ev({ id: 'f1', actor: 'A', action: 'forum.create',
    subject: { type: 'forum', id: 'F1' }, predicate: { kind: 'vote' }, ts: 1 });
  const msg = (id: string, by: string, ts: number, body: string) =>
    ev({ id, actor: by, action: 'message.post',
      subject: { type: 'message', id },
      predicate: { forumId: 'F1', body, order: ts }, ts });

  it('posts land in the forum sorted by (ts, id)', () => {
    const s = project([forum, msg('m2', 'B', 20, 'second'), msg('m1', 'A', 10, 'first')]);
    const f = s.forums.get('F1');
    expect(f?.kind).toBe('vote');
    expect(f?.messages.map((m) => m.body)).toEqual(['first', 'second']);
  });

  it('a post to an unknown forum plants an implicit stub; a later create fills metadata without losing messages', () => {
    const s = project([msg('m1', 'A', 10, 'early'), forum]);
    const f = s.forums.get('F1');
    expect(f?.messages).toHaveLength(1);
    expect(f?.kind).toBe('vote');
    expect(f?.createdBy).toBe('A');
  });

  it('payload.redact blanks the body only for the author', () => {
    const redactByStranger = ev({ id: 'rX', actor: 'Z', action: 'payload.redact',
      subject: { type: 'message', id: 'm1' }, ts: 30 });
    const redactByAuthor = ev({ id: 'rA', actor: 'A', action: 'payload.redact',
      subject: { type: 'message', id: 'm1' }, ts: 31 });

    const s1 = project([forum, msg('m1', 'A', 10, 'secret'), redactByStranger]);
    expect(s1.forums.get('F1')?.messages[0].body).toBe('secret');

    const s2 = project([forum, msg('m1', 'A', 10, 'secret'), redactByAuthor]);
    expect(s2.forums.get('F1')?.messages[0]).toMatchObject({ redacted: true });
    expect(s2.forums.get('F1')?.messages[0].body).toBeUndefined();
  });

  it('payload.redact blanks a mission completion why for its author', () => {
    const s = project([
      ev({ id: 'done', actor: 'B', action: 'mission.complete',
        subject: { type: 'mission', id: 'M1' }, predicate: { hoursDone: 2, why: 'private' }, ts: 1 }),
      ev({ id: 'rB', actor: 'B', action: 'payload.redact',
        subject: { type: 'mission', id: 'M1' }, parents: ['done'], ts: 2 })
    ]);
    expect(s.missions.get('M1')?.completion).toMatchObject({ redacted: true, hoursDone: 2 });
    expect(s.missions.get('M1')?.completion?.why).toBeUndefined();
  });

  it('is order-independent', () => {
    expectOrderIndependent([forum, msg('m1', 'A', 10, 'x'), msg('m2', 'B', 20, 'y')]);
  });
});

// ---------------------------------------------------------------- meetings

describe('pgisha.create / pgisha.approve', () => {
  const create = ev({ id: 'g1', actor: 'A', action: 'pgisha.create',
    subject: { type: 'pgisha', id: 'G1' }, predicate: { date: '2026-08-01', name: 'sync' }, ts: 1 });

  it('the proposer is pre-approved; members add approvals', () => {
    const s = project([
      create,
      ev({ id: 'gB', actor: 'B', action: 'pgisha.approve',
        subject: { type: 'pgisha', id: 'G1' }, parents: ['g1'], ts: 2 })
    ]);
    expect([...(s.meetings.get('G1')?.approvals ?? [])].sort()).toEqual(['A', 'B']);
  });

  it('approve of an unknown meeting is ignored', () => {
    const s = project([
      ev({ id: 'gB', actor: 'B', action: 'pgisha.approve',
        subject: { type: 'pgisha', id: 'GX' }, ts: 2 })
    ]);
    expect(s.meetings.size).toBe(0);
  });
});

// ---------------------------------------------------------------- project meta

describe('project.create / project.amend / member.away', () => {
  it('project.create binds the id, seats the creator, seeds settings', () => {
    const s = project([
      ev({ id: 'g', actor: 'A', action: 'project.create',
        subject: { type: 'project', id: 'p1' },
        predicate: { settings: { restime: 'feh', name: 'coop' } }, ts: 1 })
    ], 'p1');
    expect(s.projectId).toBe('p1');
    expect(s.members.has('A')).toBe(true);
    expect(s.settings.get('restime')).toBe('feh');
  });

  it('project.amend sets a value by path', () => {
    const s = project([
      ev({ id: 'a1', actor: 'A', action: 'project.amend',
        subject: { type: 'project', id: 'p1' },
        predicate: { path: 'restime', value: 'sevend', order: 1 }, ts: 2 })
    ]);
    expect(s.settings.get('restime')).toBe('sevend');
  });

  it('member.away plants and clears the mark', () => {
    const s = project([
      ev({ id: 'w1', actor: 'A', action: 'member.away',
        subject: { type: 'project', id: 'p1' }, predicate: { until: 500, order: 1 }, ts: 100 })
    ]);
    expect(s.away.get('A')).toMatchObject({ since: 100, until: 500 });

    const s2 = project([
      ev({ id: 'w1', actor: 'A', action: 'member.away',
        subject: { type: 'project', id: 'p1' }, predicate: { until: 500, order: 1 }, ts: 100 }),
      ev({ id: 'w2', actor: 'A', action: 'member.away',
        subject: { type: 'project', id: 'p1' }, predicate: { back: true, order: 2 }, ts: 200 })
    ]);
    expect(s2.away.has('A')).toBe(false);
  });
});

// ---------------------------------------------------------------- state root

describe('stateRoot v2 covers the new maps', () => {
  it('a mission changes the root', async () => {
    const empty = project([]);
    const withMission = project([
      ev({ id: 'm1', actor: 'A', action: 'mission.create',
        subject: { type: 'mission', id: 'M1' }, predicate: { name: 'x' }, ts: 1 })
    ]);
    expect(Array.from(canonicalBytesOfState(empty)))
      .not.toEqual(Array.from(canonicalBytesOfState(withMission)));
  });

  it('sales participate in the root now (v2)', () => {
    const empty = project([]);
    const withSale = project([
      ev({ id: 'r1', actor: 'A', action: 'sale.record',
        subject: { type: 'sale', id: 's1' },
        predicate: { holder: 'A', total: 10, holderStatus: 'self', order: 1 }, ts: 1 })
    ]);
    expect(Array.from(canonicalBytesOfState(empty)))
      .not.toEqual(Array.from(canonicalBytesOfState(withSale)));
  });

  it('a big mixed log is order-independent end-to-end', () => {
    const events = [
      join('A', 1), join('B', 2),
      ev({ id: 'm1', actor: 'A', action: 'mission.create',
        subject: { type: 'mission', id: 'M1' },
        predicate: { branch: 'pend', stageIds: ['pd1'] }, ts: 3 }),
      ev({ id: 'vA', actor: 'A', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pd1' }, predicate: { what: true, order: 0 }, ts: 4 }),
      ev({ id: 'vB', actor: 'B', action: 'pendm.vote',
        subject: { type: 'pend', id: 'pd1' }, predicate: { what: true, order: 0 }, ts: 5 }),
      ev({ id: 'h1', actor: 'A', action: 'haluka.create',
        subject: { type: 'haluka', id: 'H1' }, predicate: { from: 'A', to: 'B', amount: 9 }, ts: 6 }),
      ev({ id: 'f1', actor: 'A', action: 'forum.create',
        subject: { type: 'forum', id: 'F1' }, ts: 7 }),
      ev({ id: 'ms1', actor: 'B', action: 'message.post',
        subject: { type: 'message', id: 'ms1' },
        predicate: { forumId: 'F1', body: 'hi', order: 8 }, ts: 8 }),
      ev({ id: 'g1', actor: 'B', action: 'pgisha.create',
        subject: { type: 'pgisha', id: 'G1' }, ts: 9 }),
      ev({ id: 't1', actor: 'B', action: 'time.tick',
        subject: { type: 'mission', id: 'M1' }, predicate: { op: 'start', order: 10 }, ts: 10 }),
      ev({ id: 't2', actor: 'B', action: 'time.tick',
        subject: { type: 'mission', id: 'M1' }, predicate: { op: 'stop', order: 11 }, ts: 11 })
    ];
    expectOrderIndependent(events, 'p1');
  });
});
