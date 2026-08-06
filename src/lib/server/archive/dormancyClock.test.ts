import { describe, it, expect } from 'vitest';
import { openDormancyProposal, touchDormancy } from './dormancyClock.js';

interface Shape {
  lifecycle?: string | null;
  hours?: number;
  finnishedMissions?: string[];
  activeTimer?: boolean;
  members?: string[];
  ownerId?: string | null;
  openDecisions?: string[];
  missionDays?: number | null;
  projectDays?: number | null;
  existingClockId?: string | null;
}

function fakeExec(shape: Shape = {}) {
  const sent: string[] = [];
  const {
    lifecycle = null,
    hours = 0,
    finnishedMissions = [],
    activeTimer = false,
    members = ['1', '2'],
    ownerId = '2',
    openDecisions = [],
    missionDays = null,
    projectDays = null,
    existingClockId = null,
  } = shape;

  const project = {
    data: {
      id: '5',
      attributes: {
        restime: 'sth',
        dormancyDays: projectDays,
        user_1s: { data: members.map((id) => ({ id })) },
      },
    },
  };

  const exec = async (query: string) => {
    sent.push(query);
    // touchDormancy's own read
    if (query.includes('timegramas(filters:')) {
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: '10',
              attributes: {
                lifecycle,
                dormancyDays: missionDays,
                project: { data: { id: '5', attributes: { dormancyDays: projectDays } } },
                timegramas: { data: existingClockId ? [{ id: existingClockId }] : [] },
              },
            },
          },
        },
      };
    }
    if (query.includes('mesimabetahalich(id:')) {
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: '10',
              attributes: {
                name: 'עיצוב לוגו',
                lifecycle,
                dormancyDays: missionDays,
                updatedAt: '2026-01-01T00:00:00.000Z',
                howmanyhoursalready: hours,
                perhour: 50,
                users_permissions_user: ownerId ? { data: { id: ownerId } } : { data: null },
                activeTimer: { data: activeTimer ? { id: '3' } : null },
                finnished_missions: { data: finnishedMissions.map((id) => ({ id })) },
                mission: { data: { id: '44' } },
                open_missions: { data: [{ id: '33' }] },
                project,
                archive_decisions: { data: openDecisions.map((id) => ({ id })) },
              },
            },
          },
        },
      };
    }
    if (query.includes('otherMissions:')) {
      const meta = (n: number) => ({ meta: { pagination: { total: n } } });
      return {
        data: {
          otherMissions: meta(1),
          otherResources: meta(0),
          finnishedMissions: meta(0),
          sales: meta(0),
          halukas: meta(0),
          openAsks: meta(0),
          openAskms: meta(0),
        },
      };
    }
    if (query.includes('createDecision')) {
      return { data: { createDecision: { data: { id: '500' } } } };
    }
    if (query.includes('createTimegrama')) {
      return { data: { createTimegrama: { data: { id: '600' } } } };
    }
    return { data: {} };
  };

  return { exec, sent, matching: (t: string) => sent.filter((q) => q.includes(t)) };
}

const DAY = 24 * 60 * 60 * 1000;

/** Days between now and the `date:` written into a timegrama mutation. */
function daysAhead(mutation: string): number {
  const iso = /date:\s*"([^"]+)"/.exec(mutation)?.[1];
  return Math.round((new Date(iso!).getTime() - Date.now()) / DAY);
}

describe('touchDormancy', () => {
  it('creates the clock on first touch, at the rikma default', async () => {
    const s = fakeExec();
    const id = await touchDormancy(s.exec, '10');
    expect(id).toBe('600');
    const [created] = s.matching('createTimegrama');
    expect(created).toContain('whatami: "mesimabetahalich"');
    expect(created).toContain('mesimabetahalich: "10"');
    expect(daysAhead(created)).toBe(30);
  });

  it('pushes the existing clock instead of stacking a second one', async () => {
    const s = fakeExec({ existingClockId: '77' });
    const id = await touchDormancy(s.exec, '10');
    expect(id).toBe('77');
    expect(s.matching('createTimegrama')).toHaveLength(0);
    const [pushed] = s.matching('updateTimegrama');
    expect(pushed).toContain('done: false');
  });

  it('honours the mission’s own period over the rikma’s — urgent work, tighter clock', async () => {
    const s = fakeExec({ missionDays: 3, projectDays: 14 });
    await touchDormancy(s.exec, '10');
    expect(daysAhead(s.matching('createTimegrama')[0])).toBe(3);
  });

  it('falls back to the rikma’s period when the mission has none', async () => {
    const s = fakeExec({ projectDays: 14 });
    await touchDormancy(s.exec, '10');
    expect(daysAhead(s.matching('createTimegrama')[0])).toBe(14);
  });

  it('does not clock an object that is already on its way out', async () => {
    for (const lifecycle of ['archived', 'released']) {
      const s = fakeExec({ lifecycle, existingClockId: '77' });
      expect(await touchDormancy(s.exec, '10')).toBeNull();
      expect(s.matching('updateTimegrama')).toHaveLength(0);
    }
  });

  it('never throws into the caller — it runs inside timer and status actions', async () => {
    const boom = async () => {
      throw new Error('strapi down');
    };
    await expect(touchDormancy(boom, '10')).resolves.toBeNull();
  });
});

describe('openDormancyProposal', () => {
  it('opens the standard release proposal rather than cancelling outright', async () => {
    const s = fakeExec();
    const out = await openDormancyProposal(s.exec, '10');

    expect(out.opened).toBe(true);
    expect(out.decisionId).toBe('500');
    const [decision] = s.matching('createDecision');
    expect(decision).toContain('kind: archiveObject');
    expect(decision).toContain('archScope: release');
    expect(decision).toContain('archSource: dormancy');
    // Signed at round 1 so silence can complete it without anyone acting.
    expect(decision).toContain('order: 1');
    expect(decision).toContain('what: true');
    // And a restime clock, so the assignee still gets a turn.
    expect(s.matching('createTimegrama')[0]).toContain('whatami: "decision"');
  });

  it('marks the mission as under discussion without removing it', async () => {
    const s = fakeExec();
    await openDormancyProposal(s.exec, '10');
    expect(s.matching('lifecycle: archiveProposed')).toHaveLength(1);
    expect(s.matching('lifecycle: archived')).toHaveLength(0);
  });

  it('re-arms the clock instead of proposing when work happened after all', async () => {
    for (const shape of [{ hours: 4 }, { finnishedMissions: ['9'] }, { activeTimer: true }]) {
      const s = fakeExec(shape);
      const out = await openDormancyProposal(s.exec, '10');
      expect(out.opened).toBe(false);
      expect(out.reason).toBe('active-after-all');
      expect(s.matching('createDecision')).toHaveLength(0);
      // The clock was pushed rather than left expired.
      expect(s.matching('createTimegrama').concat(s.matching('updateTimegrama')).length).toBeGreaterThan(0);
    }
  });

  it('stays quiet when a proposal is already open on the mission', async () => {
    const s = fakeExec({ openDecisions: ['77'] });
    const out = await openDormancyProposal(s.exec, '10');
    expect(out).toMatchObject({ opened: false, reason: 'proposal-already-open' });
    expect(s.matching('createDecision')).toHaveLength(0);
  });

  it('stays quiet on an object that already left', async () => {
    for (const lifecycle of ['archived', 'released']) {
      const s = fakeExec({ lifecycle });
      expect((await openDormancyProposal(s.exec, '10')).reason).toBe('already-gone');
    }
  });

  it('stays quiet in a rikma of one — there is nobody to release it back to', async () => {
    const s = fakeExec({ members: ['2'] });
    const out = await openDormancyProposal(s.exec, '10');
    expect(out).toMatchObject({ opened: false, reason: 'sole-member' });
  });

  it('stays quiet when nobody carries the mission', async () => {
    const s = fakeExec({ ownerId: null });
    expect((await openDormancyProposal(s.exec, '10')).reason).toBe('no-assignee');
  });

  it('names the period in the reason, so the card explains itself', async () => {
    const s = fakeExec({ missionDays: 3 });
    await openDormancyProposal(s.exec, '10');
    expect(s.matching('createDecision')[0]).toContain('3');
  });
});
