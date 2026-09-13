import { describe, expect, it } from 'vitest';
import type { DigestCounts, DigestPayload } from './compose';
import {
  decideDigest,
  effectiveFrequency,
  isUnchanged,
  isWithinDigestWindow,
  resolveChannels
} from './policy';

// Friday 2026-09-11, 07:30 in Israel (UTC+3).
const MORNING = new Date('2026-09-11T04:30:00.000Z');
const NOON = new Date('2026-09-11T09:00:00.000Z');
// Sunday 2026-09-13, 07:30 in Israel.
const SUNDAY_MORNING = new Date('2026-09-13T04:30:00.000Z');

const counts = (over: Partial<DigestCounts> = {}): DigestCounts => ({
  votes: 2,
  urgent: 0,
  missions: 1,
  dormantSoon: 0,
  tasksOpen: 0,
  overdue: 0,
  dueSoon: 0,
  suggestions: 0,
  freshSuggestions: 0,
  whatsNew: 0,
  urgentKeys: [],
  ...over
});
const payload = (isEmpty = false) => ({ isEmpty }) as DigestPayload;
const mailUser = { email: 'a@b.c' };

describe('send window & frequency', () => {
  it('07:00–09:00 site time', () => {
    expect(isWithinDigestWindow(MORNING)).toBe(true);
    expect(isWithinDigestWindow(NOON)).toBe(false);
  });
  it('null frequency is daily (the null rule)', () => {
    expect(effectiveFrequency(null)).toBe('daily');
    expect(effectiveFrequency(undefined)).toBe('daily');
    expect(effectiveFrequency('off')).toBe('off');
  });
});

describe('resolveChannels', () => {
  it('defaults to ONE channel: telegram, else mail, else push', () => {
    expect(resolveChannels(null, { telegramId: '1', email: 'a@b.c' })).toEqual(['telegram']);
    expect(resolveChannels(null, { email: 'a@b.c' })).toEqual(['mail']);
    expect(resolveChannels(null, { email: 'a@b.c', noMail: true, pushDevices: 2 })).toEqual(['push']);
    expect(resolveChannels(null, {})).toEqual([]);
  });
  it('explicit prefs pick several, but only reachable ones', () => {
    expect(resolveChannels({ mail: true, telegram: true }, { telegramId: '1', email: 'a@b.c' })).toEqual([
      'telegram',
      'mail'
    ]);
    // noMail still wins over a mail preference
    expect(resolveChannels({ mail: true }, { email: 'a@b.c', noMail: true })).toEqual([]);
    // whatsapp has no sender yet
    expect(resolveChannels({ whatsapp: true }, { email: 'a@b.c' })).toEqual([]);
  });
  it('prefs with nothing turned on fall back to the default', () => {
    expect(resolveChannels({ mail: false }, { email: 'a@b.c' })).toEqual(['mail']);
  });
});

describe('isUnchanged (rule 4)', () => {
  it('same numbers, nothing new ⇒ unchanged', () => {
    expect(isUnchanged(counts(), counts())).toBe(true);
  });
  it('no previous digest is never unchanged', () => {
    expect(isUnchanged(counts(), null)).toBe(false);
  });
  it('anything new is a change', () => {
    expect(isUnchanged(counts({ whatsNew: 1 }), counts())).toBe(false);
  });
  it('a vote that turned urgent overnight is a change even at the same count', () => {
    const last = counts({ urgent: 1, urgentKeys: ['fiapp:1'] });
    expect(isUnchanged(counts({ urgent: 1, urgentKeys: ['fiapp:2'] }), last)).toBe(false);
    expect(isUnchanged(counts({ urgent: 1, urgentKeys: ['fiapp:1'] }), last)).toBe(true);
  });
});

describe('decideDigest', () => {
  it('sends a non-empty digest in the window', () => {
    expect(decideDigest(payload(), counts(), null, mailUser, { now: MORNING })).toEqual({
      send: true,
      reason: null,
      channels: ['mail'],
      forced: false
    });
  });

  it('rule 1: empty is never sent, even forced', () => {
    const d = decideDigest(payload(true), counts(), null, mailUser, { now: MORNING, force: true });
    expect(d).toMatchObject({ send: false, reason: 'empty' });
  });

  it('rule 2: one a day — 20h, forced skips it', () => {
    const state = { lastSentAt: new Date(MORNING.getTime() - 10 * 60 * 60 * 1000).toISOString() };
    expect(decideDigest(payload(), counts(), state, mailUser, { now: MORNING })).toMatchObject({ reason: 'tooSoon' });
    expect(decideDigest(payload(), counts(), state, mailUser, { now: MORNING, force: true }).send).toBe(true);
    const yesterday = { lastSentAt: new Date(MORNING.getTime() - 23.5 * 60 * 60 * 1000).toISOString() };
    expect(decideDigest(payload(), counts(), yesterday, mailUser, { now: MORNING }).send).toBe(true);
  });

  it('rule 3: outside the window nothing goes out', () => {
    expect(decideDigest(payload(), counts(), null, mailUser, { now: NOON })).toMatchObject({ reason: 'outsideWindow' });
  });

  it('rule 4: unchanged since last time is skipped', () => {
    const d = decideDigest(payload(), counts(), { lastCounts: counts() }, mailUser, { now: MORNING });
    expect(d).toMatchObject({ reason: 'unchanged' });
  });

  it('rule 5: the user decides', () => {
    expect(decideDigest(payload(), counts(), { frequency: 'off' }, mailUser, { now: MORNING })).toMatchObject({
      reason: 'off'
    });
    expect(decideDigest(payload(), counts(), { frequency: 'weekly' }, mailUser, { now: MORNING })).toMatchObject({
      reason: 'notThisWeekday'
    });
    expect(decideDigest(payload(), counts(), { frequency: 'weekly' }, mailUser, { now: SUNDAY_MORNING }).send).toBe(true);
  });

  it('no reachable channel ⇒ skipped, not sent into the void', () => {
    expect(decideDigest(payload(), counts(), null, {}, { now: MORNING })).toMatchObject({ reason: 'noChannel' });
  });
});
