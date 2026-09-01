import { describe, it, expect } from 'vitest';
import { buildTimerSessions, dayKeyOf, timerState } from './timerSessions.js';

/** Local-time ISO string, so the tests read the same day the code does. */
function at(y: number, m: number, d: number, h = 0, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

function timer(id: string, attrs: Record<string, unknown>) {
  return { id, attributes: attrs };
}

describe('dayKeyOf', () => {
  it('reads the local calendar day, not the UTC one', () => {
    expect(dayKeyOf(new Date(2026, 7, 3, 23, 30))).toBe('2026-08-03');
    expect(dayKeyOf(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('returns an empty key for junk', () => {
    expect(dayKeyOf(new Date('nope'))).toBe('');
  });
});

describe('timerState', () => {
  it('ranks running over approved over saved', () => {
    expect(timerState({ isActive: true, appruved: true, saved: true })).toBe('running');
    expect(timerState({ appruved: true, saved: true })).toBe('approved');
    expect(timerState({ saved: true })).toBe('saved');
    expect(timerState({})).toBe('open');
    expect(timerState(null)).toBe('open');
  });
});

describe('buildTimerSessions', () => {
  it('unrolls one row per recorded stretch, newest first', () => {
    const result = buildTimerSessions([
      timer('7', {
        saved: true,
        saveText: '  bug hunt  ',
        timers: [
          { start: at(2026, 8, 3, 9, 0), stop: at(2026, 8, 3, 11, 30) },
          { start: at(2026, 8, 5, 14, 0), stop: at(2026, 8, 5, 15, 0) }
        ],
        users_permissions_user: { data: { id: '4', attributes: { username: 'dana' } } },
        acts: { data: [{ attributes: { shem: 'login form' } }, { attributes: {} }] }
      })
    ]);

    expect(result.sessions.map((s) => s.hours)).toEqual([1, 2.5]);
    expect(result.sessions[0].start).toBe(at(2026, 8, 5, 14, 0));
    expect(result.sessions[0].key).toBe('7-1');
    expect(result.sessions[0].user?.username).toBe('dana');
    expect(result.sessions[0].note).toBe('bug hunt');
    expect(result.sessions[0].acts).toEqual(['login form']);
    expect(result.totalHours).toBe(3.5);
    expect(result.running).toBe(false);
  });

  it('groups by the day a session started on, newest day first', () => {
    const result = buildTimerSessions([
      timer('1', {
        timers: [
          { start: at(2026, 8, 3, 9, 0), stop: at(2026, 8, 3, 10, 0) },
          { start: at(2026, 8, 3, 20, 0), stop: at(2026, 8, 3, 21, 0) },
          { start: at(2026, 8, 4, 8, 0), stop: at(2026, 8, 4, 9, 0) }
        ]
      })
    ]);

    expect(result.days.map((d) => d.key)).toEqual(['2026-08-04', '2026-08-03']);
    expect(result.days[1].hours).toBe(2);
    expect(result.days[1].sessions.map((s) => s.startMs)).toEqual([
      new Date(at(2026, 8, 3, 20, 0)).getTime(),
      new Date(at(2026, 8, 3, 9, 0)).getTime()
    ]);
    expect(result.days[1].date.getMonth()).toBe(7);
    expect(result.days[1].date.getDate()).toBe(3);
  });

  it('keeps a midnight-crossing session whole and flags it', () => {
    const result = buildTimerSessions([
      timer('1', { timers: [{ start: at(2026, 8, 3, 23, 0), stop: at(2026, 8, 4, 1, 0) }] })
    ]);

    expect(result.days).toHaveLength(1);
    expect(result.days[0].key).toBe('2026-08-03');
    expect(result.sessions[0].crossesDay).toBe(true);
    expect(result.sessions[0].hours).toBe(2);
  });

  it('measures a running session up to now and marks only that segment', () => {
    const now = new Date(at(2026, 8, 5, 12, 0)).getTime();
    const result = buildTimerSessions(
      [
        timer('9', {
          isActive: true,
          timers: [
            { start: at(2026, 8, 5, 8, 0), stop: at(2026, 8, 5, 9, 0) },
            { start: at(2026, 8, 5, 11, 0), stop: null }
          ]
        })
      ],
      now
    );

    expect(result.running).toBe(true);
    expect(result.sessions[0].running).toBe(true);
    expect(result.sessions[0].state).toBe('running');
    expect(result.sessions[0].hours).toBe(1);
    // the closed segment of a running timer is not itself ticking
    expect(result.sessions[1].running).toBe(false);
    expect(result.sessions[1].state).toBe('open');
    expect(result.totalHours).toBe(2);
  });

  it('falls back to a pre-component timer without double counting', () => {
    const result = buildTimerSessions([
      timer('3', { start: at(2026, 8, 1, 9, 0), finnish: at(2026, 8, 1, 12, 0), saved: true })
    ]);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].legacy).toBe(true);
    expect(result.sessions[0].hours).toBe(3);
  });

  it('shows a corrupt stop-before-start row at zero instead of dropping it', () => {
    const result = buildTimerSessions([
      timer('4', { timers: [{ start: at(2026, 8, 2, 10, 0), stop: at(2026, 8, 2, 9, 0) }] })
    ]);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].hours).toBe(0);
    expect(result.totalHours).toBe(0);
  });

  it('survives empty and malformed input', () => {
    expect(buildTimerSessions(null).sessions).toEqual([]);
    expect(buildTimerSessions([]).days).toEqual([]);
    expect(buildTimerSessions([null, {}, { attributes: {} }]).sessions).toEqual([]);
    expect(buildTimerSessions([timer('5', { timers: [{ start: 'junk', stop: null }] })].slice()).sessions).toEqual(
      []
    );
  });
});
