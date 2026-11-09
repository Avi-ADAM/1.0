import { describe, it, expect } from 'vitest';
import { normalizeEventSlug, suggestEventSlug, validateEventDraft, publishProblems, validateRegistration } from './validate';
import { toEventView, parseForm, lines } from './model';
import { sessionPhase, admissionFor, canRegister, openSessions, takenBySession, JOIN_OPENS_MIN } from './sessions';
import { buildIcs, foldLine, icsText, googleCalendarUrl } from './ics';

const NOW = new Date('2026-11-05T10:00:00Z');
const inHours = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();

describe('event slug', () => {
  it('normalizes to ascii lowercase with single hyphens', () => {
    expect(normalizeEventSlug('  Business Owners__Webinar!! ')).toBe('business-owners-webinar');
    expect(normalizeEventSlug('--a--')).toBe('a');
    expect(normalizeEventSlug('וובינר')).toBe('');
  });
  it('suggests from a Hebrew title, falling back to kind + date', () => {
    expect(suggestEventSlug('וובינר', 'webinar', NOW)).toMatch(/^[a-z0-9-]+$/);
    expect(suggestEventSlug('!!', 'workshop', NOW)).toBe('workshop-2026-11-05');
  });
});

describe('validateEventDraft', () => {
  const base = {
    title: 'מה 1lev1 נותן לבעלי עסקים',
    kind: 'webinar',
    slug: 'business',
    sessions: [{ startsAt: inHours(48), durationMin: 60, externalUrl: 'https://zoom.us/j/123' }],
    consentText: 'מאשר/ת'
  };

  it('accepts a minimal draft and gives every session a key', () => {
    const r = validateEventDraft(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.sessions[0].key).toMatch(/^[a-z0-9]{8}$/);
      expect(r.value.sessions[0].room).toBe('external');
    }
  });

  it('keeps an existing session key so registrations stay attached', () => {
    const r = validateEventDraft({ ...base, sessions: [{ ...base.sessions[0], key: 'abcd1234' }] });
    expect(r.ok && r.value.sessions[0].key).toBe('abcd1234');
  });

  it('refuses a missing title, a bad date, a bad link and a javascript: after-url', () => {
    expect(validateEventDraft({ ...base, title: ' ' })).toMatchObject({ ok: false, problem: 'title' });
    expect(validateEventDraft({ ...base, sessions: [{ startsAt: 'soon' }] })).toMatchObject({ ok: false, problem: 'sessionDate' });
    expect(
      validateEventDraft({ ...base, sessions: [{ startsAt: inHours(2), externalUrl: 'zoom' }] })
    ).toMatchObject({ ok: false, problem: 'sessionLink' });
    expect(validateEventDraft({ ...base, afterUrl: 'javascript:alert(1)' })).toMatchObject({ ok: false, problem: 'afterUrl' });
    expect(validateEventDraft({ ...base, afterUrl: '/hascama' }).ok).toBe(true);
  });

  it('sorts sessions by date', () => {
    const r = validateEventDraft({
      ...base,
      sessions: [{ startsAt: inHours(72) }, { startsAt: inHours(24) }]
    });
    expect(r.ok && r.value.sessions.map((s) => s.startsAt)).toEqual([inHours(24), inHours(72)]);
  });

  it('says what blocks publishing', () => {
    const ok = validateEventDraft(base);
    expect(ok.ok && publishProblems(ok.value, NOW)).toEqual([]);
    const noLink = validateEventDraft({ ...base, sessions: [{ startsAt: inHours(5) }], consentText: '' });
    expect(noLink.ok && publishProblems(noLink.value, NOW)).toEqual(['missingLink', 'noConsentText']);
    const past = validateEventDraft({ ...base, sessions: [{ startsAt: inHours(-5), externalUrl: 'https://x.y' }] });
    expect(past.ok && publishProblems(past.value, NOW)).toContain('noFutureSession');
    const ownRoom = validateEventDraft({ ...base, sessions: [{ startsAt: inHours(5), room: 'meetings' }] });
    expect(ownRoom.ok && publishProblems(ownRoom.value, NOW)).toEqual([]);
  });
});

describe('parseForm', () => {
  it('drops malformed fields, duplicates and selects without options; caps at five', () => {
    const f = parseForm([
      { key: 'biz', label: 'סוג העסק', type: 'select', options: ['מסחר', ''] },
      { key: 'biz', label: 'dup' },
      { key: 'Bad key', label: 'x' },
      { key: 'q', label: 'שאלה' },
      { key: 's', label: 'ריק', type: 'select', options: [] },
      { key: 'a1', label: '1' },
      { key: 'a2', label: '2' },
      { key: 'a3', label: '3' },
      { key: 'a4', label: '4' }
    ]);
    expect(f.map((x) => x.key)).toEqual(['biz', 'q', 'a1', 'a2', 'a3']);
    expect(f[0].options).toEqual(['מסחר']);
  });
});

describe('validateRegistration', () => {
  const form = parseForm([
    { key: 'biz', label: 'סוג העסק', type: 'select', options: ['מסחר', 'שירותים'], required: true },
    { key: 'note', label: 'מה מעניין', type: 'text' }
  ]);
  const good = { name: 'דנה', email: ' Dana@Example.com ', consent: true, answers: { biz: 'מסחר' }, sessionKey: 'abcd1234' };

  it('normalizes the email and keeps only known answers', () => {
    const r = validateRegistration({ ...good, answers: { biz: 'מסחר', evil: 'x' } }, form);
    expect(r.ok && r.value.email).toBe('dana@example.com');
    expect(r.ok && r.value.answers).toEqual({ biz: 'מסחר' });
  });

  it('requires consent, a valid email, required answers and a known option', () => {
    expect(validateRegistration({ ...good, consent: false }, form)).toMatchObject({ ok: false, problem: 'consent' });
    expect(validateRegistration({ ...good, email: 'nope' }, form)).toMatchObject({ ok: false, problem: 'email' });
    expect(validateRegistration({ ...good, answers: {} }, form)).toMatchObject({ ok: false, problem: 'answer', field: 'biz' });
    expect(validateRegistration({ ...good, answers: { biz: 'other' } }, form)).toMatchObject({ ok: false, problem: 'answer' });
    expect(validateRegistration({ ...good, phone: 'call me' }, form)).toMatchObject({ ok: false, problem: 'phone' });
  });

  it('keeps only utm keys it knows', () => {
    const r = validateRegistration({ ...good, utm: { source: 'fb', hack: 'x' } }, form);
    expect(r.ok && r.value.utm).toEqual({ source: 'fb' });
  });
});

describe('toEventView', () => {
  const node = {
    id: 7,
    attributes: {
      slug: 'biz',
      title: 'T',
      kind: 'webinar',
      status: 'published',
      outcomes: '- one\n\n• two',
      project: { data: { id: 3 } },
      sessions: [
        { key: 'bbbb2222', startsAt: inHours(48), durationMin: 60, externalUrl: 'https://zoom.us/j/1', room: 'external' },
        { key: 'aaaa1111', startsAt: inHours(24), durationMin: 45 }
      ]
    }
  };

  it('never carries the join link in the public shape', () => {
    const v = toEventView(node)!;
    expect(v.sessions.map((s) => s.key)).toEqual(['aaaa1111', 'bbbb2222']);
    expect(JSON.stringify(v)).not.toContain('zoom.us');
    expect(v.outcomes).toEqual(['one', 'two']);
    expect(v.projectId).toBe('3');
  });

  it('carries it for members', () => {
    const v = toEventView(node, { withSecrets: true })!;
    expect(v.sessions[1].externalUrl).toBe('https://zoom.us/j/1');
  });
});

describe('sessions', () => {
  const s = { startsAt: inHours(1), durationMin: 60, state: 'open' as const, capacity: 2 };

  it('opens the join window shortly before the start and closes it after the end', () => {
    expect(sessionPhase(s, NOW)).toBe('upcoming');
    expect(sessionPhase(s, new Date(Date.parse(s.startsAt) - (JOIN_OPENS_MIN - 1) * 60_000))).toBe('joinable');
    expect(sessionPhase(s, new Date(Date.parse(s.startsAt) + 80 * 60_000))).toBe('joinable');
    expect(sessionPhase(s, new Date(Date.parse(s.startsAt) + 100 * 60_000))).toBe('ended');
    expect(sessionPhase({ ...s, state: 'cancelled' }, NOW)).toBe('cancelled');
  });

  it('puts the person past capacity on the waiting list', () => {
    expect(admissionFor(s, 1)).toBe('registered');
    expect(admissionFor(s, 2)).toBe('waitlist');
    expect(admissionFor({ ...s, capacity: null }, 999)).toBe('registered');
  });

  it('only offers future, not-cancelled sessions', () => {
    const list = [
      { key: 'a', startsAt: inHours(-1), state: 'open' as const },
      { key: 'b', startsAt: inHours(3), state: 'cancelled' as const },
      { key: 'c', startsAt: inHours(2), state: 'open' as const }
    ];
    expect(openSessions(list, NOW).map((x) => x.key)).toEqual(['c']);
    expect(canRegister(list[0], NOW)).toBe(false);
  });

  it('counts seats from holding statuses only', () => {
    expect(
      takenBySession([
        { sessionKey: 'a', status: 'registered' },
        { sessionKey: 'a', status: 'cancelled' },
        { sessionKey: 'a', status: 'waitlist' },
        { sessionKey: 'a', status: 'attended' },
        { sessionKey: null, status: 'registered' }
      ])
    ).toEqual({ a: 2 });
  });
});

describe('ics', () => {
  it('escapes text and folds long lines at 75 octets', () => {
    expect(icsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const folded = foldLine('DESCRIPTION:' + 'א'.repeat(60));
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
  });

  it('builds a calendar with a stable uid and the personal page as location', () => {
    const ics = buildIcs({
      uid: 'reg-12@1lev1.com',
      title: 'וובינר',
      startsAt: '2026-11-10T17:00:00.000Z',
      durationMin: 90,
      url: 'https://www.1lev1.com/e/tok',
      now: NOW
    });
    expect(ics).toContain('UID:reg-12@1lev1.com');
    expect(ics).toContain('DTSTART:20261110T170000Z');
    expect(ics).toContain('DTEND:20261110T183000Z');
    expect(ics).toContain('LOCATION:https://www.1lev1.com/e/tok');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.endsWith('\r\n')).toBe(true);
    const cancel = buildIcs({ uid: 'u', title: 't', startsAt: NOW.toISOString(), durationMin: 5, url: 'https://x', cancel: true, sequence: 1 });
    expect(cancel).toContain('METHOD:CANCEL');
    expect(cancel).not.toContain('VALARM');
  });

  it('links to Google Calendar with UTC dates', () => {
    const u = new URL(googleCalendarUrl({ title: 't', startsAt: '2026-11-10T17:00:00Z', durationMin: 60, url: 'https://x' }));
    expect(u.searchParams.get('dates')).toBe('20261110T170000Z/20261110T180000Z');
  });
});

describe('lines', () => {
  it('splits bullets', () => expect(lines('* a\n - b \n')).toEqual(['a', 'b']));
});
