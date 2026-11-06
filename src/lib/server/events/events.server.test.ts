import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/mailer.js', () => ({ sendMailSafe: vi.fn(async () => ({ ok: true })) }));
vi.mock('$lib/server/actions', () => ({ strapiClient: { execute: vi.fn() } }));

import { buildConfirmation, mailLang } from './mail';
import { mergeSessions, eventData } from './store';
import { applyEventDecision } from './publish';
import { validateEventDraft } from '$lib/events/validate';

describe('confirmation email', () => {
  const base = {
    event: { title: 'וובינר <b>', tagline: 'שורה' },
    session: { startsAt: '2026-11-10T17:00:00.000Z', timezone: 'Asia/Jerusalem', durationMin: 60 },
    name: 'דנה',
    lang: 'he',
    pageUrl: 'https://www.1lev1.com/e/tok123',
    waitlist: false,
    registrationId: '42'
  };

  it('writes in the recipient’s language, escapes, links to the personal page and attaches the calendar', () => {
    const m = buildConfirmation(base);
    expect(m.subject).toBe('נרשמת: וובינר <b>');
    expect(m.html).toContain('dir="rtl"');
    expect(m.html).toContain('וובינר &lt;b&gt;');
    expect(m.html).toContain('https://www.1lev1.com/e/tok123');
    expect(m.ics).toContain('UID:event-registration-42@1lev1.com');
    expect(m.html).not.toContain('zoom');
  });

  it('a waiting-list row gets no calendar and says so', () => {
    const m = buildConfirmation({ ...base, waitlist: true, lang: 'en' });
    expect(m.subject).toContain('waiting list');
    expect(m.ics).toBeNull();
    expect(m.html).toContain('dir="ltr"');
  });

  it('falls back to Hebrew for an unknown language', () => {
    expect(mailLang('xx')).toBe('he');
    expect(mailLang('ru')).toBe('ru');
  });
});

describe('mergeSessions', () => {
  it('keeps the stored room and a done state by key, and nothing for a new session', () => {
    const v = validateEventDraft({
      title: 'T',
      kind: 'webinar',
      sessions: [
        { key: 'aaaa1111', startsAt: '2026-12-01T10:00:00Z', room: 'meetings', state: 'open' },
        { key: 'bbbb2222', startsAt: '2026-12-02T10:00:00Z' }
      ]
    });
    if (!v.ok) throw new Error('draft');
    const stored = {
      attributes: {
        sessions: [{ key: 'aaaa1111', state: 'done', pgisha: { data: { id: 9 } } }]
      }
    };
    const out = mergeSessions(v.value, stored);
    expect(out[0]).toMatchObject({ key: 'aaaa1111', pgisha: '9', state: 'done' });
    expect(out[1].pgisha).toBeUndefined();
    expect(eventData(v.value, out)).toMatchObject({ title: 'T', sessions: out });
  });
});

describe('applyEventDecision', () => {
  const decision = (status: string, kind = 'event', pid = '5') => ({
    data: {
      decision: {
        data: {
          attributes: {
            kind,
            projects: { data: [{ id: '5' }] },
            rikma_event: { data: { id: '7', attributes: { status, project: { data: { id: pid } } } } }
          }
        }
      }
    }
  });

  it('publishes a proposal that matured', async () => {
    const run = vi.fn(async (qid: string) => (qid === 'eventDecision' ? decision('proposed') : { data: {} }));
    expect(await applyEventDecision(run, '1', '5')).toBe(true);
    expect(run).toHaveBeenCalledWith('eventUpdate', expect.objectContaining({ id: '7', data: expect.objectContaining({ status: 'published' }) }));
  });

  it('leaves alone anything that is not a waiting proposal of this rikma', async () => {
    for (const d of [decision('published'), decision('draft'), decision('proposed', 'look'), decision('proposed', 'event', '6')]) {
      const run = vi.fn(async (qid: string) => (qid === 'eventDecision' ? d : { data: {} }));
      expect(await applyEventDecision(run, '1', '5')).toBe(false);
      expect(run).not.toHaveBeenCalledWith('eventUpdate', expect.anything());
    }
  });
});
