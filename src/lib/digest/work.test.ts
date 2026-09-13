import { describe, expect, it } from 'vitest';
import { DORMANCY_WARN_DAYS, processWork, siteDayKey } from './work';

// 09:00 in Israel (UTC+3 in September).
const NOW = Date.parse('2026-09-11T06:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const at = (ms: number) => new Date(ms).toISOString();

function mission(id: string, attrs: Record<string, unknown>) {
  return {
    id,
    attributes: {
      name: `M${id}`,
      howmanyhoursalready: 0,
      project: { data: { id: '3', attributes: { projectName: 'Garden', dormancyDays: 14 } } },
      activeTimer: { data: null },
      timegramas: { data: [] },
      acts: { data: [] },
      ...attrs
    }
  };
}
const act = (id: string, attrs: Record<string, unknown>) => ({ id, attributes: { shem: `T${id}`, ...attrs } });
const wrap = (missions: unknown[]) => ({
  data: { usersPermissionsUser: { data: { id: '7', attributes: { mesimabetahaliches: { data: missions } } } } }
});

describe('siteDayKey', () => {
  it('uses Israel time, not UTC', () => {
    // 22:30 UTC on the 10th is already the 11th in Jerusalem.
    expect(siteDayKey('2026-09-10T22:30:00.000Z')).toBe('2026-09-11');
  });
});

describe('processWork — missions', () => {
  it('splits running / not started', () => {
    const w = processWork(
      wrap([
        mission('1', { activeTimer: { data: { id: 't', attributes: { isActive: true } } } }),
        mission('2', {}),
        mission('3', { howmanyhoursalready: 4 })
      ]),
      NOW
    );
    expect(w.missions).toMatchObject({ active: 3, running: 1, notStarted: 1 });
  });

  it('warns about a dormancy clock running out within the warning window', () => {
    const w = processWork(
      wrap([
        mission('1', { timegramas: { data: [{ id: 'g', attributes: { date: at(NOW + 2 * DAY) } }] } }),
        mission('2', { timegramas: { data: [{ id: 'g', attributes: { date: at(NOW + (DORMANCY_WARN_DAYS + 2) * DAY) } }] } }),
        mission('3', { timegramas: { data: [{ id: 'g', attributes: { date: at(NOW - DAY) } }] } })
      ]),
      NOW
    );
    expect(w.missions.dormantSoon.map((m) => m.id)).toEqual(['1']);
    expect(w.missions.dormantSoon[0]).toMatchObject({ daysLeft: 2, periodDays: 14, projectName: 'Garden' });
  });

  it('never warns on a mission with hours or a running timer — the clock would not fire', () => {
    const clock = { data: [{ id: 'g', attributes: { date: at(NOW + DAY) } }] };
    const w = processWork(
      wrap([
        mission('1', { timegramas: clock, howmanyhoursalready: 1 }),
        mission('2', { timegramas: clock, activeTimer: { data: { attributes: { isActive: true } } } })
      ]),
      NOW
    );
    expect(w.missions.dormantSoon).toEqual([]);
  });
});

describe('processWork — tasks', () => {
  it('counts open tasks and tells overdue from due-soon by site day', () => {
    const w = processWork(
      wrap([
        mission('1', {
          acts: {
            data: [
              act('a', { dateF: at(NOW - 2 * DAY) }), // overdue
              act('b', { dateF: at(NOW + 3 * 60 * 60 * 1000) }), // today
              act('c', { dateF: at(NOW + DAY) }), // tomorrow
              act('d', { dateF: at(NOW + 9 * DAY) }), // later — open, not pressing
              act('e', {}), // undated
              act('f', { naasa: true, dateF: at(NOW - DAY) }) // done
            ]
          }
        })
      ]),
      NOW
    );
    expect(w.tasks).toMatchObject({ open: 5, overdue: 1, dueSoon: 2 });
    expect(w.tasks.items.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(w.tasks.items[0]).toMatchObject({ overdue: true, missionName: 'M1', projectId: '3' });
  });

  it('counts an act shared by two missions once', () => {
    const shared = act('x', { dateF: at(NOW - DAY) });
    const w = processWork(wrap([mission('1', { acts: { data: [shared] } }), mission('2', { acts: { data: [shared] } })]), NOW);
    expect(w.tasks.open).toBe(1);
    expect(w.tasks.overdue).toBe(1);
  });

  it('survives a missing user', () => {
    expect(processWork(null, NOW).missions.active).toBe(0);
  });
});
