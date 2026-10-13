/**
 * /api/ste must not let a stranger message our users through the bot.
 *
 * With `isNew` the caller chose the chat and the HTML, and the endpoint had no
 * authentication — anyone could send any text, under 1lev1's name, to every
 * person who ever started the bot. That shape now answers only to this server
 * (the internal secret, $lib/server/internalOnly.js). The owner-telemetry shape
 * stays open to the browser, but always lands in the owner's chat, as plain
 * text, rate-limited.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { ADMINMONTHER: 'test-admin-token', TELEGRAM_BOT_TOKEN_NEW: 'BOT', NEW_TELEGRAM: '42' }
}));

// What handleFetch / TelegramService send — internalSecret.js's derivation for the mocked env.
const INTERNAL = createHash('sha256').update('test-admin-token:internal-proxy:v1').digest('hex');

const telegram = vi.fn(async (_url: string, _init?: RequestInit) => new Response('{}', { status: 200 }));

/** Fresh module per test, so the in-memory limiter starts empty. */
async function route() {
  vi.resetModules();
  return (await import('./+server.js')).POST;
}

function event(body: unknown, { headers = {}, ip = '1.2.3.4' }: { headers?: Record<string, string>; ip?: string } = {}) {
  const request = new Request('http://localhost/api/ste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  return { request, getClientAddress: () => ip } as any;
}

/** The JSON the endpoint sent to Telegram on its n-th call. */
function sent(n = 0) {
  const [url, init] = telegram.mock.calls[n];
  return { url, body: JSON.parse(String(init?.body)) };
}

const phish = {
  isNew: true,
  chat_id: '123456789',
  det: '1lev1 security',
  message: '<a href="https://evil.example">verify your account</a>'
};

beforeEach(() => {
  vi.stubGlobal('fetch', telegram);
  telegram.mockClear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the targeted shape (chosen chat) is server-only', () => {
  it('refuses a browser request', async () => {
    const res = await (await route())(event(phish));
    expect(res.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it('refuses a chat_id without isNew — the destination is what is guarded', async () => {
    const { isNew: _drop, ...noFlag } = phish;
    const res = await (await route())(event(noFlag));
    expect(res.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it('refuses any truthy spelling of isNew', async () => {
    const res = await (await route())(event({ ...phish, isNew: '1' }));
    expect(res.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it('refuses a forged header (the raw admin token is not the secret)', async () => {
    const res = await (await route())(event(phish, { headers: { 'x-internal-secret': 'test-admin-token' } }));
    expect(res.status).toBe(403);
    expect(telegram).not.toHaveBeenCalled();
  });

  it('sends for the server: chosen chat, HTML, buttons only on 1lev1', async () => {
    const res = await (await route())(
      event(
        {
          ...phish,
          message: 'a vote is waiting',
          lang: 'en',
          buttons: [
            { text: 'Vote page', path: '/moach/7/votes' },
            { text: 'Heart', path: 'lev' },
            { text: '', path: 'ignored' },
            { text: 'no path' }
          ]
        },
        { headers: { 'x-internal-secret': INTERNAL } }
      )
    );
    expect(res.status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(1);
    const { url, body } = sent();
    expect(url).toBe('https://api.telegram.org/botBOT/sendMessage');
    expect(body.chat_id).toBe('123456789');
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('<b>1lev1 security</b>');
    expect(body.reply_markup.inline_keyboard).toEqual([
      [{ text: 'Vote page', url: 'https://www.1lev1.com/moach/7/votes' }],
      [{ text: 'Heart', url: 'https://www.1lev1.com/lev' }]
    ]);
  });

  it('falls back to the one urladd button', async () => {
    await (await route())(event({ ...phish, urladd: 'deals' }, { headers: { 'x-internal-secret': INTERNAL } }));
    expect(sent().body.reply_markup.inline_keyboard).toEqual([
      [{ text: 'לצפייה ב-1💗1', url: 'https://www.1lev1.com/deals' }]
    ]);
  });

  it('reports a refusal from Telegram instead of a silent 200', async () => {
    telegram.mockResolvedValueOnce(new Response('{}', { status: 403 }));
    const res = await (await route())(event(phish, { headers: { 'x-internal-secret': INTERNAL } }));
    expect(res.status).toBe(502);
  });
});

describe('the owner-telemetry shape', () => {
  it('always goes to the owner, as plain text in a JSON body', async () => {
    const res = await (await route())(
      event({ name: 'dana', action: 'created a rikma:', det: 'Bread & Co #1 <b>x</b>' })
    );
    expect(res.status).toBe(200);
    const { url, body } = sent();
    // Nothing the caller wrote is spliced into the URL any more.
    expect(url).toBe('https://api.telegram.org/botBOT/sendMessage');
    expect(body).toEqual({ chat_id: '42', text: 'dana\ncreated a rikma:\nBread & Co #1 <b>x</b>' });
  });

  it('skips missing fields instead of printing "undefined"', async () => {
    await (await route())(event({ name: 'x', action: 'signed' }));
    expect(sent().body.text).toBe('x\nsigned');
  });

  it('caps each field', async () => {
    await (await route())(event({ name: 'n', action: 'a', det: 'x'.repeat(5000) }));
    expect(sent().body.text.length).toBeLessThan(1100);
  });

  it('refuses an empty message and bad JSON', async () => {
    const post = await route();
    expect((await post(event({}))).status).toBe(400);
    expect((await post(event('not json'))).status).toBe(400);
    expect(telegram).not.toHaveBeenCalled();
  });

  it('limits one address, not its neighbours', async () => {
    const post = await route();
    for (let i = 0; i < 20; i++) {
      expect((await post(event({ name: 'n', action: `${i}` }))).status).toBe(200);
    }
    expect((await post(event({ name: 'n', action: 'one too many' }))).status).toBe(429);
    expect((await post(event({ name: 'n', action: 'other' }, { ip: '5.6.7.8' }))).status).toBe(200);
    expect(telegram).toHaveBeenCalledTimes(21);
  });

  it('limits rotating addresses overall', async () => {
    const post = await route();
    for (let i = 0; i < 200; i++) {
      expect((await post(event({ name: 'n', action: 'a' }, { ip: `10.0.${i >> 8}.${i & 255}` }))).status).toBe(200);
    }
    expect((await post(event({ name: 'n', action: 'a' }, { ip: '9.9.9.9' }))).status).toBe(429);
  });

  it('does not limit the server itself (vocab/create telemetry)', async () => {
    const post = await route();
    for (let i = 0; i < 25; i++) {
      const res = await post(event({ name: 'n', action: 'a' }, { headers: { 'x-internal-secret': INTERNAL } }));
      expect(res.status).toBe(200);
    }
  });
});

// ── Guard: browser code only ever uses the owner-telemetry shape ─────────────
//
// A .svelte file that posts a chat_id would be broken (403) and a sign that
// someone is trying to reopen the targeted shape for the browser.
const ROOT = join(__dirname, '../../../..');

function svelteFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) svelteFiles(full, out);
    else if (name.endsWith('.svelte')) out.push(full);
  }
  return out;
}

const CLIENT_CALLERS = svelteFiles(join(ROOT, 'src'))
  .map((f) => relative(ROOT, f).split('\\').join('/'))
  .filter((rel) => /\/api\/ste['"`]/.test(readFileSync(join(ROOT, rel), 'utf8')));

describe('browser callers of /api/ste', () => {
  it('finds the ones we know about (the scan works)', () => {
    expect(CLIENT_CALLERS).toContain('src/lib/components/addnew/baci.svelte');
  });

  it.each(CLIENT_CALLERS)('%s sends no chat_id / isNew', (rel) => {
    expect(readFileSync(join(ROOT, rel), 'utf8')).not.toMatch(/\b(isNew|chat_id)\b/);
  });
});
