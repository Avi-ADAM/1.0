import { describe, it, expect, vi } from 'vitest';
import { subjectBodies, notifyLinks } from './subjectNotice';
import { NotificationOrchestrator } from '../notifications/NotificationOrchestrator';
import type { ActionContext, NotificationConfig } from '../actions/types';
import { noticeSubject } from '$lib/notices/links';

const rel = (attributes: any) => ({ data: { id: '1', attributes } });
const askRead = {
  project: rel({ projectName: 'Studio Gefen' }),
  ask: rel({
    users_permissions_user: rel({ username: 'Dana' }),
    timegrama: rel({ date: '2026-10-20T17:47:00.000Z' }),
    open_mission: rel({ name: 'Logo', noofhours: 5, perhour: 60 })
  })
};

describe('subjectBodies — the sentence in every language', () => {
  const notice = {
    ani: 'askedcoin',
    sentence: { key: 'notices.lev.askedcoin', params: { who: { text: 'Dana' }, item: { text: 'Logo' }, rikma: { text: 'Gefen' } } },
    terms: [{ kind: 'hours' as const, value: 5 }],
    deadline: '2026-10-20T17:47:00.000Z'
  };

  it('five locales, each with the names, the figures and the clock', () => {
    const b = subjectBodies(notice, { clock: true, now: Date.parse('2026-10-18T00:00:00Z') });
    expect(Object.keys(b).sort()).toEqual(['ar', 'en', 'es', 'he', 'ru']);
    expect(b.he).toContain('Dana');
    expect(b.he).toContain('Logo');
    expect(b.he).toContain('5 שעות');
    expect(b.he).toContain('יאושר אוטומטית');
    expect(b.en).toContain('approved automatically');
    // never a raw key in front of a person
    for (const s of Object.values(b)) expect(s).not.toMatch(/notices\.|lev\.list/);
  });

  it('no clock line when silence is not consent here', () => {
    expect(subjectBodies(notice).he).not.toContain('יאושר אוטומטית');
  });
});

describe('notifyLinks — the rikma page first, then the heart, labelled', () => {
  it('two labelled links', () => {
    const links = notifyLinks({ rikma: '/moach/5/votes/ask/1', lev: '/lev?focus=askedcoin&project=5' });
    expect(links.map((l) => l.kind)).toEqual(['rikma', 'lev']);
    expect(links[0].label.he).toBeTruthy();
    expect(links[1].label.ru).toBeTruthy();
  });
});

describe('NotificationOrchestrator — a vote notice says what waits and where to answer it', () => {
  function setup(read: any = askRead) {
    const profile = (id: string, lang = 'he') => ({
      id,
      attributes: { username: `u${id}`, email: `${id}@x`, lang, telegramId: `t${id}`, machshirs: { data: [] } }
    });
    const strapi: any = {
      execute: vi.fn(async (qid: string, vars: any) =>
        qid === '460noticeSubject' ? { data: read } : { data: { usersPermissionsUser: { data: profile(vars.uid, vars.uid === '3' ? 'ru' : 'he') } } }
      )
    };
    const orch = new NotificationOrchestrator(strapi, 'http://socket.test');
    const out: { telegram: any[] } = { telegram: [] };
    vi.spyOn(orch.getSocketIOServer(), 'broadcastToUsers').mockResolvedValue(undefined as any);
    vi.spyOn(orch.getEmailService(), 'sendBulk').mockResolvedValue();
    vi.spyOn(orch.getPushService(), 'sendBulk').mockResolvedValue();
    vi.spyOn(orch.getTelegramService(), 'sendBulk').mockImplementation(async (_r: any, data: any) => {
      out.telegram.push(data);
    });
    return { orch, strapi, out };
  }
  const context = { userId: '1', jwt: 'j', lang: 'he', fetch: vi.fn() } as unknown as ActionContext;
  const config = (over: Partial<NotificationConfig> = {}): NotificationConfig => ({
    recipients: { type: 'specificUsers', config: { userIdsParam: 'userIds' } },
    templates: { title: { he: 'בקשה', en: 'Request' }, body: { he: 'יש בקשה', en: 'There is a request' } },
    intent: 'consent',
    subject: (p) => noticeSubject('ask', p.askId, p.projectId),
    ...over
  });

  it('the body becomes the sentence; both links travel; the default is the vote page', async () => {
    const { orch, strapi, out } = setup();
    await orch.notify(config(), { userIds: ['2'], askId: '7', projectId: '5' }, {}, context);
    const sent = out.telegram[0];
    expect(sent.title.he).toBe('בקשה');
    expect(sent.body.he).toContain('Dana');
    expect(sent.body.ru).toContain('Dana');
    expect(sent.links.map((l: any) => l.href)).toEqual(['/moach/5/votes/ask/7', '/lev?focus=askedcoin&project=5']);
    expect(sent.metadata.url).toBe('/moach/5/votes/ask/7');
    // read with the service token, not the actor's
    const call = strapi.execute.mock.calls.find((c: any[]) => c[0] === '460noticeSubject');
    expect(call[1]).toMatchObject({ pid: '5', id: '7', isAsk: true, isPendm: false });
    expect(call[2]).toBeUndefined();
  });

  it("`before` keeps the action's own words under the sentence", async () => {
    const { orch, out } = setup();
    await orch.notify(config({ subjectText: 'before' }), { userIds: ['2'], askId: '7', projectId: '5' }, {}, context);
    expect(out.telegram[0].body.he).toMatch(/Dana[\s\S]*\n\nיש בקשה$/);
  });

  it('`links` leaves the body alone and adds only the links', async () => {
    const { orch, strapi, out } = setup();
    await orch.notify(config({ subjectText: 'links' }), { userIds: ['2'], askId: '7', projectId: '5' }, {}, context);
    expect(out.telegram[0].body.he).toBe('יש בקשה');
    expect(out.telegram[0].links).toHaveLength(2);
    expect(strapi.execute.mock.calls.some((c: any[]) => c[0] === '460noticeSubject')).toBe(false);
  });

  it('an outcome is about a vote that is over — no sentence, no links', async () => {
    const { orch, out } = setup();
    await orch.notify(config({ intent: 'outcome' }), { userIds: ['2'], askId: '7', projectId: '5' }, {}, context);
    expect(out.telegram[0]?.body.he ?? 'יש בקשה').toBe('יש בקשה');
    expect(out.telegram[0]?.links ?? []).toEqual([]);
  });

  it('a failed read keeps the template and still offers the links', async () => {
    const { orch, out } = setup({ project: null, ask: { data: null } });
    await orch.notify(config(), { userIds: ['2'], askId: '7', projectId: '5' }, {}, context);
    expect(out.telegram[0].body.he).toBe('יש בקשה');
    expect(out.telegram[0].links).toHaveLength(2);
  });
});
