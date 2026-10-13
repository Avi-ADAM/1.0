import { describe, it, expect, vi } from 'vitest';
import { resolveChannels, recipientTemplateLang, emailRecipients, deliveryPlan, voteIntent, CHANNELS_BY_INTENT, NOTIFICATION_INTENTS } from './intent';
import type { NotificationIntent } from './intent';
import { NotificationOrchestrator } from './NotificationOrchestrator';
import type { NotificationConfig, ActionContext } from '../actions/types';

describe('resolveChannels', () => {
  it('a consent request goes out on every channel — silence only counts if they could hear', () => {
    expect(resolveChannels({ intent: 'consent' }).sort()).toEqual(['email', 'push', 'socket', 'telegram']);
  });

  it('every tier keeps the socket, and each tier reaches no further than the one above it', () => {
    let prev: string[] | null = null;
    for (const intent of NOTIFICATION_INTENTS) {
      const ch = [...CHANNELS_BY_INTENT[intent]];
      expect(ch).toContain('socket');
      if (prev) for (const c of ch) expect(prev).toContain(c);
      prev = ch;
    }
  });

  it('intent wins over a legacy channel list', () => {
    expect(resolveChannels({ intent: 'ambient', channels: ['socket', 'email'] })).toEqual(['socket']);
  });

  it('intent can depend on the run (a counter resets the clock, a plain vote does not)', () => {
    const cfg = { intent: (p: any): NotificationIntent => (p.counter ? 'consent' : 'ambient') };
    expect(resolveChannels(cfg, { counter: true })).toContain('email');
    expect(resolveChannels(cfg, { counter: false })).toEqual(['socket']);
  });

  it('legacy configs keep their list; a config with neither is socket only', () => {
    expect(resolveChannels({ channels: ['socket', 'push'] })).toEqual(['socket', 'push']);
    expect(resolveChannels({})).toEqual(['socket']);
  });
});

describe('emailRecipients — email for whoever has no other channel', () => {
  const app = { id: 'app', telegramId: '', machshirs: [{ attributes: { jsoni: '{}' } }] };
  const bot = { id: 'bot', telegramId: 't9', machshirs: [] };
  const none = { id: 'none', telegramId: '', machshirs: [] };
  const deadDevice = { id: 'dead', telegramId: '', machshirs: [{ attributes: {} }] };
  const ids = (us: { id: string }[]) => us.map((u) => u.id);

  it('consent emails everyone', () => {
    expect(ids(emailRecipients([app, bot, none], resolveChannels({ intent: 'consent' })))).toEqual(['app', 'bot', 'none']);
  });

  it('personal emails only whoever has neither push nor telegram', () => {
    expect(ids(emailRecipients([app, bot, none, deadDevice], resolveChannels({ intent: 'personal' })))).toEqual(['none', 'dead']);
  });

  it('outcome has no telegram, so a telegram-only member gets the email too', () => {
    expect(ids(emailRecipients([app, bot, none], resolveChannels({ intent: 'outcome' })))).toEqual(['bot', 'none']);
  });

  it('ambient stays on the site', () => {
    expect(emailRecipients([app, bot, none], resolveChannels({ intent: 'ambient' }))).toEqual([]);
  });

  it('applies to legacy lists as well (push without email ⇒ email whoever has no device)', () => {
    expect(ids(emailRecipients([app, none], ['socket', 'push']))).toEqual(['none']);
  });
});

describe('deliveryPlan — review reaches each person once', () => {
  const app = { id: 'app', telegramId: '', machshirs: [{ attributes: { jsoni: '{}' } }] };
  const bot = { id: 'bot', telegramId: 't9', machshirs: [] };
  const both = { id: 'both', telegramId: 't8', machshirs: [{ attributes: { jsoni: '{}' } }] };
  const none = { id: 'none', telegramId: '', machshirs: [] };
  const ids = (us: { id: string }[]) => us.map((u) => u.id);

  it('telegram first, then a live device, then email — never two', () => {
    const plan = deliveryPlan([app, bot, both, none], resolveChannels({ intent: 'review' }), 'review');
    expect(ids(plan.telegram)).toEqual(['bot', 'both']);
    expect(ids(plan.push)).toEqual(['app']);
    expect(ids(plan.email)).toEqual(['none']);
  });

  it('every other intent keeps sending each channel to everyone on it', () => {
    const plan = deliveryPlan([bot, none], resolveChannels({ intent: 'consent' }), 'consent');
    expect(ids(plan.telegram)).toEqual(['bot', 'none']);
    expect(ids(plan.email)).toEqual(['bot', 'none']);
  });
});

describe('voteIntent — consent when a round opens, not on every signature', () => {
  it('a signature on the standing round stays on the site', () => {
    expect(voteIntent({}, { data: { consensus: false, newVote: {} } })).toBe('ambient');
    expect(voteIntent({}, undefined)).toBe('ambient');
  });

  it('a vote that puts a version on the table asks everyone else', () => {
    expect(voteIntent({}, { data: { consensus: false, opensRound: true } })).toBe('consent');
  });

  it('maturing, or closing on an all-no, is an outcome', () => {
    expect(voteIntent({}, { data: { consensus: true } })).toBe('outcome');
    expect(voteIntent({}, { data: { consensus: false, archived: true } })).toBe('outcome');
    expect(voteIntent({}, { data: { consensus: true, opensRound: true } })).toBe('outcome');
  });

  it('resolves to channels through resolveChannels', () => {
    expect(resolveChannels({ intent: voteIntent }, {}, { data: { consensus: true } }).sort()).toEqual(['push', 'socket']);
    expect(resolveChannels({ intent: voteIntent }, {}, { data: {} })).toEqual(['socket']);
  });
});

describe('recipientTemplateLang', () => {
  it("keeps the reader's language when a template exists for it", () => {
    expect(recipientTemplateLang('he')).toBe('he');
    expect(recipientTemplateLang('en')).toBe('en');
    expect(recipientTemplateLang('ar')).toBe('ar');
  });

  it('reads ru / es in English rather than in Hebrew', () => {
    expect(recipientTemplateLang('ru')).toBe('en');
    expect(recipientTemplateLang('es')).toBe('en');
  });
});

describe('NotificationOrchestrator — the actor is never notified outside the site', () => {
  function setup() {
    const profiles: Record<string, any> = {
      '1': { id: '1', attributes: { username: 'actor', email: 'a@x', lang: 'he', telegramId: 't1', machshirs: { data: [{ id: 'd1', attributes: { jsoni: '{}' } }] } } },
      '2': { id: '2', attributes: { username: 'other', email: 'o@x', lang: 'he', telegramId: 't2', machshirs: { data: [{ id: 'd2', attributes: { jsoni: '{}' } }] } } }
    };
    const strapi: any = {
      execute: vi.fn(async (_qid: string, vars: any) => ({
        data: { usersPermissionsUser: { data: profiles[vars.uid] } }
      }))
    };
    const orch = new NotificationOrchestrator(strapi, 'http://socket.test');
    const sent: Record<string, string[][]> = { socket: [], email: [], telegram: [], push: [] };
    vi.spyOn(orch.getSocketIOServer(), 'broadcastToUsers').mockImplementation(async (r: any) => {
      sent.socket.push(r.map((u: any) => u.id));
      return undefined as any;
    });
    vi.spyOn(orch.getEmailService(), 'sendBulk').mockImplementation(async (r: any) => {
      sent.email.push(r.map((u: any) => u.id));
    });
    vi.spyOn(orch.getTelegramService(), 'sendBulk').mockImplementation(async (r: any) => {
      sent.telegram.push(r.map((u: any) => u.id));
    });
    vi.spyOn(orch.getPushService(), 'sendBulk').mockImplementation(async (r: any) => {
      sent.push.push(r.map((u: any) => u.id));
    });
    return { orch, sent };
  }

  const context = { userId: '1', jwt: 'j', lang: 'he', fetch: vi.fn() } as unknown as ActionContext;
  const config = (over: Partial<NotificationConfig> = {}): NotificationConfig => ({
    recipients: { type: 'specificUsers', config: { userIdsParam: 'userIds' } },
    templates: { title: { he: 'כ', en: 't' }, body: { he: 'ג', en: 'b' } },
    intent: 'consent',
    ...over
  });

  it('without excludeSender: the actor still gets the socket event, but no push / telegram / email', async () => {
    const { orch, sent } = setup();
    await orch.notify(config(), { userIds: ['1', '2'] }, {}, context);
    expect(sent.socket).toEqual([['1', '2']]);
    expect(sent.email).toEqual([['2']]);
    expect(sent.telegram).toEqual([['2']]);
    expect(sent.push).toEqual([['2']]);
  });

  it('when the actor is the only recipient, nothing leaves the site', async () => {
    const { orch, sent } = setup();
    await orch.notify(config(), { userIds: ['1'] }, {}, context);
    expect(sent.socket).toEqual([['1']]);
    expect(sent.email).toEqual([]);
    expect(sent.telegram).toEqual([]);
    expect(sent.push).toEqual([]);
  });

  it('an outcome reaches a member with no app and no bot by email', async () => {
    const { orch, sent } = setup();
    vi.spyOn(orch as any, 'getUserProfile').mockImplementation(async (id: any) =>
      id === '3' ? { id: '3', username: 'offline', email: 'f@x', lang: 'he', telegramId: '', machshirs: [] } : null
    );
    await orch.notify(config({ intent: 'outcome' }), { userIds: ['3'] }, {}, context);
    expect(sent.email).toEqual([['3']]);
  });

  it('the channels come from the intent', async () => {
    const { orch, sent } = setup();
    await orch.notify(config({ intent: 'outcome' }), { userIds: ['2'] }, {}, context);
    expect(sent.push).toEqual([['2']]);
    expect(sent.telegram).toEqual([]);
    expect(sent.email).toEqual([]);
  });

  it('a review reaches a member on telegram only, not telegram + push + email', async () => {
    const { orch, sent } = setup();
    await orch.notify(config({ intent: 'review' }), { userIds: ['1', '2'] }, {}, context);
    expect(sent.socket).toEqual([['1', '2']]);
    expect(sent.telegram).toEqual([['2']]);
    expect(sent.push).toEqual([]);
    expect(sent.email).toEqual([]);
  });

  it('an empty recipient list is nobody — never the whole rikma (N4)', async () => {
    const { orch, sent } = setup();
    const members = vi.spyOn(orch as any, 'getProjectMembers');
    await orch.notify(config(), { userIds: [], projectId: '12' }, {}, context);
    expect(members).not.toHaveBeenCalled();
    expect(sent.socket).toEqual([]);
    expect(sent.email).toEqual([]);
  });

  it('a missing recipient list is nobody too — no fallback to the rikma (N4)', async () => {
    const { orch, sent } = setup();
    const members = vi.spyOn(orch as any, 'getProjectMembers');
    await orch.notify(config(), { projectId: '12' }, { data: { projectId: '12' } }, context);
    expect(members).not.toHaveBeenCalled();
    expect(sent.socket).toEqual([]);
  });

  it('templatesFor words this run; undefined keeps the static templates (B14)', async () => {
    const { orch } = setup();
    const titles: string[] = [];
    vi.spyOn(orch.getSocketIOServer(), 'broadcastToUsers').mockImplementation(async (_r: any, n: any) => {
      titles.push(n.title.he);
      return undefined as any;
    });
    const proposed = { title: { he: 'הוצע', en: 'proposed' }, body: { he: 'ב', en: 'b' } };
    const c = config({ templatesFor: (_p, r) => (r?.data?.decisionsCreated ? proposed : undefined) });
    await orch.notify(c, { userIds: ['2'] }, { data: { decisionsCreated: 2 } }, context);
    await orch.notify(c, { userIds: ['2'] }, { data: {} }, context);
    expect(titles).toEqual(['הוצע', 'כ']);
  });

  it('a single id is a list of one', async () => {
    const { orch, sent } = setup();
    await orch.notify(config({ recipients: { type: 'specificUsers', config: { userIdsParam: 'requesterId' } } }), { requesterId: '2' }, {}, context);
    expect(sent.socket).toEqual([['2']]);
  });
});

describe('updateProjectDetails (B14)', () => {
  it('an edit that opened votes asks for consent, in words that say so; a direct edit stays ambient', async () => {
    const { updateProjectDetailsConfig } = await import('../actions/configs/updateProjectDetails');
    const n = updateProjectDetailsConfig.notification!;
    const voted = { data: { decisionsCreated: 2 } };
    const applied = { data: { projectName: 'x' } };
    expect(resolveChannels(n, {}, voted)).toEqual(CHANNELS_BY_INTENT.consent);
    expect(resolveChannels(n, {}, applied)).toEqual(CHANNELS_BY_INTENT.ambient);
    expect(n.templatesFor!({}, voted)?.title.he).toContain('הוצע');
    expect(n.templatesFor!({}, applied)).toBeUndefined();
  });
});
