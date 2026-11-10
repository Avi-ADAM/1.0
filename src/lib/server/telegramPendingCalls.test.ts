/**
 * The webhook must not answer while a reply is still on its way out: on Vercel
 * the function freezes on response, and the reply then only leaves when the
 * next update wakes it — the "no answer, then two answers" report.
 *
 * Runs against the real Telegraf, because the fix depends on ctx.reply going
 * through the per-update client's callApi.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Telegraf, Telegram } from 'telegraf';
import { trackTelegramCalls } from './telegramPendingCalls.js';

const startUpdate = (update_id = 1): any => ({
  update_id,
  message: {
    message_id: 1,
    date: 0,
    text: '/start',
    entities: [{ type: 'bot_command', offset: 0, length: 6 }],
    chat: { id: 555, type: 'private' },
    from: { id: 555, is_bot: false, first_name: 'A' }
  }
});

/** A Bot API that answers only when the test says so. */
function controlledApi() {
  const calls: { method: string; resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = [];
  vi.spyOn(Telegram.prototype, 'callApi').mockImplementation(((method: string) =>
    new Promise((resolve, reject) => calls.push({ method, resolve, reject }))) as any);
  return calls;
}

function makeBot() {
  const bot = new Telegraf('TOKEN');
  bot.botInfo = { id: 1, is_bot: true, first_name: 'b', username: 'b' } as any;
  bot.use(async (ctx, next) => {
    const settled = trackTelegramCalls(ctx.telegram);
    try {
      await next();
    } finally {
      await settled();
    }
  });
  return bot;
}

/** Long enough for everything that is not waiting on the API to finish. */
const flush = () => new Promise((r) => setTimeout(r, 10));

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('trackTelegramCalls', () => {
  it('holds the update open until a reply nobody awaited has been sent', async () => {
    const calls = controlledApi();
    const bot = makeBot();
    bot.start((ctx) => {
      ctx.reply('hello');
    });

    let finished = false;
    const handling = bot.handleUpdate(startUpdate()).then(() => {
      finished = true;
    });

    await flush();
    expect(calls.map((c) => c.method)).toEqual(['sendMessage']);
    expect(finished).toBe(false);

    calls[0].resolve({});
    await handling;
    expect(finished).toBe(true);
  });

  it('also waits for a reply that a finished call released', async () => {
    const calls = controlledApi();
    const bot = makeBot();
    bot.start((ctx) => {
      ctx.reply('one').then(() => ctx.reply('two'));
    });

    let finished = false;
    const handling = bot.handleUpdate(startUpdate()).then(() => {
      finished = true;
    });

    await flush();
    calls[0].resolve({});
    await flush();
    expect(calls).toHaveLength(2);
    expect(finished).toBe(false);

    calls[1].resolve({});
    await handling;
    expect(finished).toBe(true);
  });

  it('a failed send is logged and does not fail the update', async () => {
    const calls = controlledApi();
    const bot = makeBot();
    bot.start((ctx) => {
      ctx.reply('hello');
    });

    const handling = bot.handleUpdate(startUpdate());
    await flush();
    calls[0].reject(Object.assign(new Error('x'), { description: 'bot was blocked by the user' }));

    await expect(handling).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage failed'),
      'bot was blocked by the user'
    );
  });

  it("leaves the caller's own promise and catch working", async () => {
    const calls = controlledApi();
    const bot = makeBot();
    const caught = vi.fn();
    let sent: unknown;
    bot.start(async (ctx) => {
      sent = await ctx.reply('hello');
      await ctx.reply('second').catch(caught);
    });

    const handling = bot.handleUpdate(startUpdate());
    await flush();
    calls[0].resolve({ message_id: 7 });
    await flush();
    calls[1].reject(new Error('nope'));
    await handling;

    expect(sent).toEqual({ message_id: 7 });
    expect(caught).toHaveBeenCalledTimes(1);
  });

  it('answers at once when the handler sent nothing', async () => {
    controlledApi();
    const bot = makeBot();
    bot.start(() => {});
    await expect(bot.handleUpdate(startUpdate())).resolves.toBeUndefined();
  });
});
