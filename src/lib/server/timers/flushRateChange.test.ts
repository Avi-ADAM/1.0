import { describe, it, expect } from 'vitest';
import { flushHoursBeforeRateChange } from './flushRateChange.js';

const NOW = Date.parse('2026-08-20T12:00:00.000Z');

interface MissionShape {
  running?: boolean;
  segments?: Array<{ start: string; stop?: string | null }>;
  totalHours?: number;
  timerRate?: number | null;
  perhour?: number;
  members?: string[];
  rows?: Array<{ id: string; noofhours: number; perhour: number | null }>;
  noTimer?: boolean;
}

/** Answers the applier's reads and records every document it sends. */
function fakeExec(shape: MissionShape = {}) {
  const {
    running = true,
    segments = [{ start: '2026-08-20T10:00:00.000Z', stop: null }],
    totalHours = 0,
    timerRate = 50,
    perhour = 50,
    members = ['1', '2'],
    rows = [],
    noTimer = false,
  } = shape;

  const sent: string[] = [];
  const exec = async (query: string) => {
    sent.push(query);
    if (query.includes('mesimabetahalich(id:') && !query.startsWith('mutation')) {
      return {
        data: {
          mesimabetahalich: {
            data: {
              id: '10',
              attributes: {
                name: 'עיצוב לוגו',
                perhour,
                howmanyhoursalready: 4,
                totalHoursSaved: 9,
                users_permissions_user: { data: { id: '2' } },
                mission: { data: { id: '44' } },
                project: {
                  data: {
                    id: '5',
                    attributes: { restime: 'feh', user_1s: { data: members.map((id) => ({ id })) } },
                  },
                },
                activeTimer: noTimer
                  ? { data: null }
                  : {
                      data: {
                        id: '700',
                        attributes: { rate: timerRate, isActive: running, saved: false, totalHours, timers: segments },
                      },
                    },
                finnished_missions: {
                  data: rows.map((r) => ({
                    id: r.id,
                    attributes: { noofhours: r.noofhours, perhour: r.perhour },
                  })),
                },
              },
            },
          },
        },
      };
    }
    if (query.includes('createFiniapruval')) {
      return { data: { createFiniapruval: { data: { id: '801' } } } };
    }
    if (query.includes('createFinnishedMission')) {
      return { data: { createFinnishedMission: { data: { id: '901' } } } };
    }
    if (query.includes('createTimer')) {
      return { data: { createTimer: { data: { id: '701' } } } };
    }
    return { data: {} };
  };
  return { exec, sent, matching: (token: string) => sent.filter((q) => q.includes(token)) };
}

const flush = (exec: any, over: Record<string, unknown> = {}) =>
  flushHoursBeforeRateChange(exec, { missionId: '10', newRate: 80, now: NOW, ...over });

describe('flushHoursBeforeRateChange', () => {
  it('sends the accrued hours to approval at the OLD value', async () => {
    const { exec, matching } = fakeExec();
    const res = await flush(exec);

    expect(res.flushed).toBe(true);
    expect(res.hours).toBeCloseTo(2); // 10:00 → 12:00
    expect(res.rate).toBe(50);

    const [approval] = matching('createFiniapruval');
    expect(approval).toContain('perhour: 50');
    expect(approval).not.toContain('perhour: 80');
    expect(approval).toContain('isTimerSave: true');
    // The standing yes is the member whose hours these are — nobody else.
    expect(approval).toContain('users_permissions_user: "2"');
  });

  it('gives silence the same power it has everywhere else', async () => {
    const { exec, matching } = fakeExec();
    await flush(exec);
    const [grama] = matching('createTimegrama');
    expect(grama).toContain('whatami: "finiapruval"');
    expect(grama).toContain('finiapruval: "801"');
  });

  it('closes the running segment and marks the timer saved', async () => {
    const { exec, matching } = fakeExec();
    await flush(exec);
    const [closed] = matching('updateTimer');
    expect(closed).toContain('saved: true');
    expect(closed).toContain('isActive: false');
    expect(closed).toContain('stop: "2026-08-20T12:00:00.000Z"');
  });

  it('hands a running timer straight back, stamped with the new value', async () => {
    const { exec, matching } = fakeExec();
    const res = await flush(exec);
    const [restarted] = matching('createTimer');
    expect(restarted).toContain('rate: 80');
    // No second is lost: the new timer starts where the old one stopped.
    expect(restarted).toContain('start: "2026-08-20T12:00:00.000Z"');
    expect(res.restartedTimerId).toBe('701');
  });

  it('does not restart a timer that was already paused', async () => {
    const { exec, matching } = fakeExec({
      running: false,
      segments: [{ start: '2026-08-20T10:00:00.000Z', stop: '2026-08-20T11:00:00.000Z' }],
    });
    const res = await flush(exec);
    expect(res.flushed).toBe(true);
    expect(res.hours).toBeCloseTo(1);
    expect(matching('createTimer')).toHaveLength(0);
  });

  it('credits a rikma of one outright, at the old value', async () => {
    const { exec, matching } = fakeExec({ members: ['2'] });
    const res = await flush(exec);
    expect(matching('createFiniapruval')).toHaveLength(0);
    const [row] = matching('createFinnishedMission');
    expect(row).toContain('perhour: 50');
    expect(row).toContain('total: 100');
    expect(res.finnishedMissionId).toBe('901');
  });

  it('grows the row of the same rate era rather than opening another', async () => {
    const { exec, matching } = fakeExec({
      members: ['2'],
      rows: [{ id: '77', noofhours: 5, perhour: 50 }],
    });
    await flush(exec);
    expect(matching('createFinnishedMission')).toHaveLength(0);
    const [grown] = matching('updateFinnishedMission');
    expect(grown).toContain('noofhours: 7');
    expect(grown).toContain('total: 350');
  });

  it('opens a new row when no row was priced this way', async () => {
    const { exec, matching } = fakeExec({
      members: ['2'],
      rows: [{ id: '77', noofhours: 5, perhour: 30 }],
    });
    await flush(exec);
    expect(matching('updateFinnishedMission')).toHaveLength(0);
    expect(matching('createFinnishedMission')[0]).toContain('perhour: 50');
  });

  it('prices unstamped legacy timers at the mission value, as before', async () => {
    const { exec, matching } = fakeExec({ timerRate: null, perhour: 40 });
    const res = await flush(exec);
    expect(res.rate).toBe(40);
    expect(matching('createFiniapruval')[0]).toContain('perhour: 40');
  });

  it('does nothing when there is no timer to close', async () => {
    const { exec, sent } = fakeExec({ noTimer: true });
    const res = await flush(exec);
    expect(res).toEqual({ flushed: false });
    expect(sent.filter((q) => q.startsWith('mutation'))).toHaveLength(0);
  });

  it('does nothing when the timer holds no hours', async () => {
    const { exec, sent } = fakeExec({ segments: [], totalHours: 0 });
    const res = await flush(exec);
    expect(res.flushed).toBe(false);
    expect(sent.filter((q) => q.startsWith('mutation'))).toHaveLength(0);
  });

  it('trusts totalHours when it is ahead of the segments', async () => {
    const { exec } = fakeExec({ segments: [], totalHours: 6 });
    const res = await flush(exec);
    expect(res.hours).toBe(6);
  });

  it('adds this month’s share to the mission counter and releases the timer', async () => {
    const { exec, matching } = fakeExec();
    await flush(exec);
    const [counter] = matching('updateMesimabetahalich');
    expect(counter).toContain('activeTimer: null');
    expect(counter).toMatch(/howmanyhoursalready: 6\b/); // 4 already + 2 now
  });

  it('never throws — a mission that cannot be closed still takes the decision', async () => {
    const exec = async () => {
      throw new Error('strapi is down');
    };
    await expect(flush(exec)).resolves.toEqual({ flushed: false });
  });
});
