import { describe, it, expect } from 'vitest';
import { withEventRef, isSignupLink, type RegistrationView, type SessionState } from './model';
import { liveRows, liveStage, pickLiveSession } from './live';
import { notifyBatch } from './reminders';

describe('withEventRef', () => {
  it('adds the token only to our own signup link', () => {
    expect(withEventRef('/hascama', 'T'.repeat(30))).toBe(`/hascama?event=${'T'.repeat(30)}`);
    expect(withEventRef('/hascama?intent=x#top', 'tok')).toBe('/hascama?intent=x&event=tok#top');
    expect(withEventRef('https://example.com/hascama', 'tok')).toBe('https://example.com/hascama');
    expect(withEventRef('/hascamaX', 'tok')).toBe('/hascamaX');
    expect(withEventRef(null, 'tok')).toBeNull();
    expect(isSignupLink('/hascama?x=1')).toBe(true);
    expect(isSignupLink('/onboard')).toBe(false);
  });
});

const reg = (over: Partial<RegistrationView>): RegistrationView => ({
  id: '1',
  eventId: '7',
  sessionKey: 'k1',
  name: 'A',
  email: 'a@x.co',
  phone: null,
  answers: {},
  status: 'registered',
  joinedAt: null,
  createdAt: null,
  leadId: null,
  lang: null,
  userId: null,
  onboardingStatus: null,
  ...over
});

describe('live screen', () => {
  it('puts whoever is in the room without an account first', () => {
    const { rows, counts } = liveRows(
      [
        reg({ id: '1', name: 'Done', joinedAt: 'x', userId: '9', onboardingStatus: 'done' }),
        reg({ id: '2', name: 'Away' }),
        reg({ id: '3', name: 'Stuck', joinedAt: 'x' }),
        reg({ id: '4', name: 'Half', joinedAt: 'x', userId: '8', onboardingStatus: 'email_pending' }),
        reg({ id: '5', name: 'Other date', sessionKey: 'k2', joinedAt: 'x' }),
        reg({ id: '6', name: 'Waiting', status: 'waitlist' })
      ],
      'k1'
    );
    expect(rows.map((r) => r.name)).toEqual(['Stuck', 'Half', 'Done', 'Away']);
    expect(counts).toEqual({ joinedNoAccount: 1, accountNotOnboarded: 1, onboarded: 1, notJoined: 1, total: 4 });
    expect(liveStage(reg({ userId: '1', onboardingStatus: 'done' }))).toBe('onboarded');
  });

  it('picks the date that is on, else the next, else the last', () => {
    const now = new Date('2026-11-10T17:10:00Z');
    const s = (key: string, startsAt: string, state: SessionState = 'open') => ({ key, startsAt, durationMin: 60, state });
    const list = [s('past', '2026-11-01T17:00:00Z'), s('on', '2026-11-10T17:00:00Z'), s('next', '2026-11-20T17:00:00Z')];
    expect(pickLiveSession(list, now)?.key).toBe('on');
    expect(pickLiveSession([list[0], list[2]], now)?.key).toBe('next');
    expect(pickLiveSession([list[0]], now)?.key).toBe('past');
    expect(pickLiveSession(list, now, 'next')?.key).toBe('next');
    expect(pickLiveSession([s('x', '2026-11-10T17:00:00Z', 'cancelled')], now)).toBeNull();
  });
});

describe('notifyBatch', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  const row = (id: string, createdAt: string, sent = {}, status = 'registered') => ({ id, status, createdAt, sent });
  it('collects the unannounced rows, once an hour per event, never ancient or cancelled ones', () => {
    const regs = [
      row('1', '2026-11-10T11:00:00Z'),
      row('2', '2026-11-10T11:30:00Z'),
      row('3', '2026-10-01T10:00:00Z'),
      row('4', '2026-11-10T11:40:00Z', {}, 'cancelled')
    ];
    expect(notifyBatch(regs, now).map((r) => r.id)).toEqual(['1', '2']);
    const recently = [...regs, row('5', '2026-11-10T09:00:00Z', { notified: '2026-11-10T11:20:00Z' })];
    expect(notifyBatch(recently, now)).toEqual([]);
    const longAgo = [...regs, row('5', '2026-11-10T09:00:00Z', { notified: '2026-11-10T10:30:00Z' })];
    expect(notifyBatch(longAgo, now).map((r) => r.id)).toEqual(['1', '2']);
  });
});
