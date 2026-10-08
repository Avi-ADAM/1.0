import { describe, it, expect, vi } from 'vitest';
import { resolveChannels, recipientTemplateLang, CHANNELS_BY_INTENT, NOTIFICATION_INTENTS } from './intent';
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
      '1': { id: '1', attributes: { username: 'actor', email: 'a@x', lang: 'he', telegramId: 't1', machshirs: { data: [{ id: 'd1' }] } } },
      '2': { id: '2', attributes: { username: 'other', email: 'o@x', lang: 'he', telegramId: 't2', machshirs: { data: [{ id: 'd2' }] } } }
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

  it('the channels come from the intent', async () => {
    const { orch, sent } = setup();
    await orch.notify(config({ intent: 'outcome' }), { userIds: ['2'] }, {}, context);
    expect(sent.push).toEqual([['2']]);
    expect(sent.telegram).toEqual([]);
    expect(sent.email).toEqual([]);
  });
});
