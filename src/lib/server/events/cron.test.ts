import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/mailer.js', () => ({ sendMailSafe: vi.fn(async () => ({ ok: true })) }));

import { planMail, planNewDate, promotions, type PlanRegistration } from '$lib/events/reminders';
import { runEventsCron } from './cron';
import { buildReminder } from './reminderMail';

const START = '2026-11-10T17:00:00.000Z';
const at = (minutesFromStart: number) => new Date(Date.parse(START) + minutesFromStart * 60_000);
const session = { key: 'aaaa1111', startsAt: START, durationMin: 60, state: 'open' };
const confirmedEarly = { confirm: '2026-11-01T10:00:00.000Z', confirmedAs: 'registered' as const, startsAt: START, seq: 0 };
const reg = (over: Partial<PlanRegistration> = {}): PlanRegistration => ({
  status: 'registered',
  sessionKey: 'aaaa1111',
  joinedAt: null,
  createdAt: '2026-11-01T10:00:00.000Z',
  sent: confirmedEarly,
  ...over
});

describe('planMail — reminders by the clock', () => {
  it('nothing too early, then tomorrow, then in an hour, then we started', () => {
    expect(planMail(reg(), session, at(-48 * 60))).toBeNull();
    expect(planMail(reg(), session, at(-25 * 60))?.kind).toBe('d1');
    expect(planMail(reg({ sent: { ...confirmedEarly, d1: 'x' } }), session, at(-60))?.kind).toBe('h1');
    expect(planMail(reg({ sent: { ...confirmedEarly, d1: 'x', h1: 'x' } }), session, at(5))?.kind).toBe('live');
  });

  it('never sends the same reminder twice', () => {
    expect(planMail(reg({ sent: { ...confirmedEarly, d1: 'x' } }), session, at(-25 * 60))).toBeNull();
    expect(planMail(reg({ sent: { ...confirmedEarly, d1: 'x', h1: 'x', live: 'x' } }), session, at(5))).toBeNull();
  });

  it('skips the reminders a fresh confirmation already covers', () => {
    const fresh = { ...confirmedEarly, confirm: at(-90).toISOString() };
    expect(planMail(reg({ sent: fresh }), session, at(-60))).toBeNull();
    const today = { ...confirmedEarly, confirm: at(-20 * 60).toISOString() };
    expect(planMail(reg({ sent: today }), session, at(-19 * 60))).toBeNull();
  });

  it('does not tell someone who already walked in that we started', () => {
    expect(planMail(reg({ joinedAt: at(-5).toISOString(), status: 'attended', sent: { ...confirmedEarly, d1: 'x', h1: 'x' } }), session, at(5))).toBeNull();
  });

  it('after: thanks to who came, "you missed it" (and no-show) to who did not', () => {
    const done = { ...confirmedEarly, d1: 'x', h1: 'x', live: 'x' };
    expect(planMail(reg({ status: 'attended', joinedAt: 'x', sent: done }), session, at(130))?.kind).toBe('thanks');
    const missed = planMail(reg({ sent: done }), session, at(130));
    expect(missed).toMatchObject({ kind: 'missed', status: 'noShow' });
    expect(planMail(reg({ sent: { ...done, after: 'x' } }), session, at(130))).toBeNull();
    expect(planMail(reg({ sent: done }), session, at(5 * 24 * 60))).toBeNull();
  });

  it('a moved date: one notice, the calendar sequence goes up, the reminders are owed again', () => {
    const moved = { ...session, startsAt: at(24 * 60).toISOString() };
    const p = planMail(reg({ sent: { ...confirmedEarly, d1: 'x' } }), moved, at(-3 * 24 * 60));
    expect(p).toMatchObject({ kind: 'moved', sent: { startsAt: moved.startsAt, seq: 1, d1: null, h1: null } });
  });

  it('a cancelled date: one notice to who holds a place or waits, nothing after', () => {
    const cancelled = { ...session, state: 'cancelled' };
    expect(planMail(reg(), cancelled, at(-60))?.kind).toBe('cancelled');
    expect(planMail(reg({ status: 'waitlist' }), cancelled, at(-60))?.kind).toBe('cancelled');
    expect(planMail(reg({ sent: { ...confirmedEarly, cancelled: 'x' } }), cancelled, at(-60))).toBeNull();
    expect(planMail(reg({ status: 'cancelled' }), cancelled, at(-60))).toBeNull();
  });

  it('a seat opened: the waiting-list confirmation becomes "it is yours"', () => {
    const p = planMail(reg({ sent: { ...confirmedEarly, confirmedAs: 'waitlist' } }), session, at(-3 * 24 * 60));
    expect(p).toMatchObject({ kind: 'promoted', sent: { confirmedAs: 'registered' } });
  });

  it('resends a confirmation that never went out', () => {
    expect(planMail(reg({ sent: {} }), session, at(-3 * 24 * 60))?.kind).toBe('confirm');
    expect(planMail(reg({ sent: {} }), session, at(10))?.kind).toBe('live');
  });

  it('a waiting row gets no reminders', () => {
    expect(planMail(reg({ status: 'waitlist', sent: { ...confirmedEarly, confirmedAs: 'waitlist' } }), session, at(-60))).toBeNull();
  });
});

describe('planNewDate', () => {
  it('tells a notify-me row once per new open date', () => {
    const r = reg({ sessionKey: null, status: 'waitlist', sent: {} });
    expect(planNewDate(r, [])).toBeNull();
    expect(planNewDate(r, ['k1', 'k2'])).toMatchObject({ kind: 'newDate', sent: { offered: ['k1', 'k2'] } });
    expect(planNewDate({ ...r, sent: { offered: ['k1', 'k2'] } }, ['k1', 'k2'])).toBeNull();
    expect(planNewDate(reg(), ['k1'])).toBeNull();
  });
});

describe('promotions', () => {
  const rows = [
    { id: '1', status: 'registered', sessionKey: 'aaaa1111', createdAt: '2026-11-01T00:00:00Z' },
    { id: '3', status: 'waitlist', sessionKey: 'aaaa1111', createdAt: '2026-11-03T00:00:00Z' },
    { id: '2', status: 'waitlist', sessionKey: 'aaaa1111', createdAt: '2026-11-02T00:00:00Z' },
    { id: '4', status: 'cancelled', sessionKey: 'aaaa1111', createdAt: '2026-10-01T00:00:00Z' }
  ];
  it('fills free seats with the earliest waiting, and nothing once the session is near', () => {
    expect(promotions({ ...session, capacity: 2 }, rows, at(-3 * 24 * 60)).map((r) => r.id)).toEqual(['2']);
    expect(promotions({ ...session, capacity: 1 }, rows, at(-3 * 24 * 60))).toEqual([]);
    expect(promotions({ ...session, capacity: null }, rows, at(-3 * 24 * 60)).map((r) => r.id)).toEqual(['2', '3']);
    expect(promotions({ ...session, capacity: 5 }, rows, at(-10))).toEqual([]);
    expect(promotions({ ...session, capacity: 5, state: 'cancelled' }, rows, at(-3 * 24 * 60))).toEqual([]);
  });
});

describe('buildReminder', () => {
  const base = {
    registrationId: '9',
    name: 'Dana',
    lang: 'en',
    event: { title: 'Webinar', tagline: null, afterUrl: '/hascama' },
    session: { startsAt: START, durationMin: 60, timezone: 'Asia/Jerusalem', recordingUrl: null },
    pageUrl: 'https://www.1lev1.com/e/tok',
    eventUrl: 'https://www.1lev1.com/r/x/e/web',
    origin: 'https://www.1lev1.com',
    seq: 2
  };
  it('"we started" goes straight through the join step', () => {
    expect(buildReminder({ ...base, kind: 'live' }).html).toContain('https://www.1lev1.com/e/tok/join');
  });
  it('a move carries an updated calendar entry; a cancellation removes it', () => {
    const moved = buildReminder({ ...base, kind: 'moved' });
    expect(moved.ics).toContain('SEQUENCE:2');
    expect(moved.icsMethod).toBe('PUBLISH');
    const cancelled = buildReminder({ ...base, kind: 'cancelled' });
    expect(cancelled.ics).toContain('METHOD:CANCEL');
    expect(cancelled.icsMethod).toBe('CANCEL');
  });
  it('thanks points at the next step on the site', () => {
    expect(buildReminder({ ...base, kind: 'thanks' }).html).toContain('https://www.1lev1.com/hascama');
  });
  it('writes Hebrew right to left', () => {
    const m = buildReminder({ ...base, lang: 'he', kind: 'd1' });
    expect(m.subject).toBe('מחר: Webinar');
    expect(m.html).toContain('dir="rtl"');
  });
});

describe('runEventsCron', () => {
  function fakeStrapi(now: Date) {
    const regs: any[] = [
      { id: 1, attributes: { sessionKey: 'aaaa1111', name: 'A', email: 'a@x.co', status: 'registered', token: 'tokA', sent: confirmedEarly, lead: { data: { id: 50 } } } },
      { id: 2, attributes: { sessionKey: 'aaaa1111', name: 'B', email: 'b@x.co', status: 'waitlist', token: 'tokB', createdAt: '2026-11-02T00:00:00Z', sent: { ...confirmedEarly, confirmedAs: 'waitlist' } } },
      { id: 3, attributes: { sessionKey: null, name: 'C', email: 'c@x.co', status: 'waitlist', token: 'tokC', sent: {} } }
    ];
    const updates: any[] = [];
    const run = vi.fn(async (qid: string, vars: any) => {
      if (qid === 'eventsForCron') {
        return {
          data: {
            rikmaEvents: {
              data: [
                {
                  id: 7,
                  attributes: {
                    slug: 'web',
                    title: 'Webinar',
                    project: { data: { id: 5, attributes: { slug: 'bees' } } },
                    hosts: { data: [{ id: 11 }] },
                    sessions: [{ key: 'aaaa1111', startsAt: START, durationMin: 60, capacity: 2, state: 'open' }]
                  }
                },
                // Long over: not even read.
                { id: 8, attributes: { slug: 'old', title: 'Old', project: { data: { id: 5 } }, sessions: [{ key: 'zzzz9999', startsAt: '2026-01-01T10:00:00Z', durationMin: 60 }] } }
              ]
            }
          }
        };
      }
      if (qid === 'eventRegistrationsForCron') {
        expect(vars.eid).toBe('7');
        return { data: { eventRegistrations: { data: regs } } };
      }
      if (qid === 'eventRegistrationUpdate') {
        updates.push(vars);
        return { data: { updateEventRegistration: { data: { id: vars.id } } } };
      }
      throw new Error(`unexpected ${qid}`);
    });
    return { run, updates, now };
  }

  it('promotes into a free seat, claims before it sends, and sends the most urgent first', async () => {
    const { run, updates } = fakeStrapi(at(-25 * 60));
    const sent: Array<{ to: string; subject: string }> = [];
    const report = await runEventsCron({
      run,
      origin: 'https://www.1lev1.com',
      now: () => at(-25 * 60),
      send: async (to, m) => {
        // The claim for this mail is already written.
        expect(updates.some((u) => u.data?.sent)).toBe(true);
        sent.push({ to, subject: m.subject });
        return { ok: true };
      }
    });
    expect(report.events).toBe(1);
    expect(report.promoted).toBe(1);
    expect(updates[0]).toEqual({ id: '2', data: { status: 'registered' } });
    // B: a seat opened; A: tomorrow; C: a new date.
    expect(sent.map((s) => s.to)).toEqual(['b@x.co', 'a@x.co', 'c@x.co']);
    expect(report.sent).toEqual({ promoted: 1, d1: 1, newDate: 1 });
  });

  it('dry run claims and sends nothing', async () => {
    const { run, updates } = fakeStrapi(at(-25 * 60));
    const send = vi.fn();
    const report = await runEventsCron({ run, origin: 'https://x', now: () => at(-25 * 60), send, dry: true });
    expect(send).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
    expect(report.planned).toBe(3);
  });

  it('logs on the lead whether they came', async () => {
    const { run } = fakeStrapi(at(130));
    const logLead = vi.fn(async () => {});
    await runEventsCron({ run, origin: 'https://x', now: () => at(130), send: async () => ({ ok: true }), logLead });
    expect(logLead).toHaveBeenCalledWith('50', 'Webinar · ✗', null);
  });

  it('stops at the time budget and leaves the rest for the next run', async () => {
    const { run } = fakeStrapi(at(-25 * 60));
    const report = await runEventsCron({ run, origin: 'https://x', now: () => at(-25 * 60), send: async () => ({ ok: true }), budgetMs: -1 });
    expect(report.deferred).toBe(3);
  });
});
