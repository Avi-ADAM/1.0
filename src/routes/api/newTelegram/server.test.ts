/**
 * /api/newTelegram must only act on updates that Telegram sent.
 *
 * The handler maps an update's chat id to a member by `telegramId` and then
 * runs timers and service-token reads as them, so a forged update with a known
 * chat id used to be enough to act as that member. Telegram proves an update is
 * its own with `X-Telegram-Bot-Api-Secret-Token` (setWebhook's secret_token),
 * checked against TELEGRAM_WEBHOOK_SECRET (PLAN_PROXY_SECURITY §14.6).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  env: {
    TELEGRAM_BOT_TOKEN_NEW: 'BOT',
    GEMINI_API_KEY: 'GEMINI',
    TELEGRAM_WEBHOOK_SECRET: 'right-secret' as string | undefined
  },
  handleUpdate: null as any,
  sendToSer: null as any
}));

vi.mock('$env/dynamic/private', () => ({ env: h.env }));

// The bot registers dozens of handlers at import; only handleUpdate matters here.
vi.mock('telegraf', () => {
  const anything: any = new Proxy(() => anything, { get: () => anything, apply: () => anything });
  class Telegraf {
    constructor() {
      return new Proxy(
        {},
        { get: (_t, key) => (key === 'handleUpdate' ? h.handleUpdate : () => undefined) }
      );
    }
  }
  return { Telegraf, Markup: anything };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {};
    }
  }
}));
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer: (...args: unknown[]) => h.sendToSer(...args) }));
vi.mock('$lib/func/timers.js', () => ({
  startTimer: vi.fn(),
  stopTimer: vi.fn(),
  saveTimer: vi.fn(),
  updateTimer: vi.fn(),
  calculateTotalHours: vi.fn()
}));
vi.mock('$lib/server/actions/index.js', () => ({ actionService: { executeAction: vi.fn() } }));

/** Fresh module per test: the redelivery set and the "unset" warning are per process. */
async function route() {
  vi.resetModules();
  return (await import('./+server.js')).POST;
}

let nextUpdateId = 1000;

/** A message from chat 555 — what an attacker would send naming a member's chat. */
function event(headers: Record<string, string> = {}) {
  const update = {
    update_id: nextUpdateId++,
    message: { message_id: 1, date: 0, text: '/start', chat: { id: 555, type: 'private' }, from: { id: 555 } }
  };
  const request = new Request('http://localhost/api/newTelegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(update)
  });
  return { request, fetch: vi.fn() } as any;
}

beforeEach(() => {
  h.env.TELEGRAM_WEBHOOK_SECRET = 'right-secret';
  h.handleUpdate = vi.fn(async () => {});
  h.sendToSer = vi.fn(async () => ({ data: { usersPermissionsUsers: { data: [] } } }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/newTelegram — secret header', () => {
  it('rejects an update with no secret header, and handles nothing', async () => {
    const POST = await route();
    const res = await POST(event());
    expect(res.status).toBe(401);
    expect(h.handleUpdate).not.toHaveBeenCalled();
    expect(h.sendToSer).not.toHaveBeenCalled(); // not even the user-list read
  });

  it('rejects a wrong secret header, and handles nothing', async () => {
    const POST = await route();
    const res = await POST(event({ 'X-Telegram-Bot-Api-Secret-Token': 'wrong-secret' }));
    expect(res.status).toBe(401);
    expect(h.handleUpdate).not.toHaveBeenCalled();
    expect(h.sendToSer).not.toHaveBeenCalled();
  });

  it('rejects a prefix of the secret (length differs)', async () => {
    const POST = await route();
    const res = await POST(event({ 'X-Telegram-Bot-Api-Secret-Token': 'right' }));
    expect(res.status).toBe(401);
    expect(h.handleUpdate).not.toHaveBeenCalled();
  });

  it('handles an update that carries the right secret', async () => {
    const POST = await route();
    const res = await POST(event({ 'X-Telegram-Bot-Api-Secret-Token': 'right-secret' }));
    expect(res.status).toBe(200);
    expect(h.handleUpdate).toHaveBeenCalledTimes(1);
    expect(h.handleUpdate.mock.calls[0][0]).toMatchObject({ message: { chat: { id: 555 } } });
  });

  it('header name is case-insensitive, as HTTP headers are', async () => {
    const POST = await route();
    const res = await POST(event({ 'x-telegram-bot-api-secret-token': 'right-secret' }));
    expect(res.status).toBe(200);
    expect(h.handleUpdate).toHaveBeenCalledTimes(1);
  });

  describe('transitional: TELEGRAM_WEBHOOK_SECRET unset', () => {
    beforeEach(() => {
      h.env.TELEGRAM_WEBHOOK_SECRET = undefined;
    });

    it('still handles an update without the header, and logs that it is unchecked', async () => {
      const POST = await route();
      const res = await POST(event());
      expect(res.status).toBe(200);
      expect(h.handleUpdate).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('TELEGRAM_WEBHOOK_SECRET is not set'),
        expect.any(String),
        false
      );
    });

    it('handles an update that already carries a header (setWebhook re-run first)', async () => {
      const POST = await route();
      const res = await POST(event({ 'X-Telegram-Bot-Api-Secret-Token': 'anything' }));
      expect(res.status).toBe(200);
      expect(h.handleUpdate).toHaveBeenCalledTimes(1);
    });

    it('logs the unset secret once per process, not on every update', async () => {
      const POST = await route();
      await POST(event());
      await POST(event());
      const unset = vi
        .mocked(console.warn)
        .mock.calls.filter((c) => String(c[0]).includes('TELEGRAM_WEBHOOK_SECRET is not set'));
      expect(unset).toHaveLength(1);
      expect(h.handleUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
