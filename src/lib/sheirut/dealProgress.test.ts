import { describe, expect, it } from 'vitest';
import { missionsFromDue, missionCounts, workProgressPct, readProgressUpdates } from './dealProgress';

const line = (o: Record<string, unknown>) =>
  ({ key: 'k', kind: 'mission', name: 'n', providerId: '256', cap: 600, approved: 0, closed: false, due: 0, overrun: 0, ...o }) as any;

describe('dealProgress (QA C-21)', () => {
  it('turns the mission lines into the page mission list', () => {
    const list = missionsFromDue({
      lines: [
        line({ key: 'a', name: 'desk', missionId: '195', agreedHours: 10, approvedHours: 4, providerName: 'sup2' }),
        line({ key: 'b', name: 'pc', missionId: '194', agreedHours: 2, approvedHours: 2, closed: true }),
        line({ key: 'c', name: 'gap', providerId: null }),
        line({ key: 'r', kind: 'resource', name: 'wood' })
      ]
    });
    expect(list.map((m) => [m.id, m.status, m.hours, m.hoursDone])).toEqual([
      ['195', 'in-progress', 10, 4],
      ['194', 'done', 2, 2],
      ['c', 'waiting', 0, 0]
    ]);
    expect(missionCounts(list)).toEqual({ done: 1, inProgress: 1, total: 3 });
    // (0.4 + 1) / 2 — the unmeasured gap is left out
    expect(workProgressPct(list)).toBe(70);
  });

  it('caps a part that ran long', () => {
    const list = missionsFromDue({ lines: [line({ agreedHours: 2, approvedHours: 9 }), line({ agreedHours: 2, approvedHours: 0 })] });
    expect(workProgressPct(list)).toBe(50);
  });

  it('has no progress to show without measurable parts', () => {
    expect(workProgressPct([])).toBeNull();
  });

  it('reads the providers notes, newest first, dropping empty ones', () => {
    const res = {
      data: {
        timers: {
          data: [
            { id: '1', attributes: { saveText: 'cut the boards', totalHours: 3, updatedAt: '2026-10-02T10:00:00Z', users_permissions_user: { data: { attributes: { username: 'sup2' } } }, mesimabetahalich: { data: { attributes: { name: 'desk' } } } } },
            { id: '2', attributes: { saveText: '  ', updatedAt: '2026-10-03T10:00:00Z' } },
            { id: '3', attributes: { saveText: 'ordered parts', updatedAt: '2026-10-03T09:00:00Z' } }
          ]
        }
      }
    };
    expect(readProgressUpdates(res).map((u) => [u.id, u.text, u.who])).toEqual([
      ['3', 'ordered parts', ''],
      ['1', 'cut the boards', 'sup2']
    ]);
  });
});
