/**
 * Only one route may read a Telegram update, and it is /api/newTelegram.
 *
 * /api/yy was an old webhook with no authentication. It took the destination
 * chat from `message.from.id` in the POST body and put the `un` part of
 * `/start <userId>_<code>_<un>_<lang>` into the text, which it concatenated
 * unencoded into a sendMessage URL under the bot token — so anyone could make
 * the 1lev1 bot message anyone who ever started it, with partly chosen text.
 * Nothing called it and the bot's webhook points at /api/newTelegram, so it
 * was deleted (PLAN_PROXY_SECURITY §14.6).
 *
 * A route that consumes an update trusts whatever chat and user the body
 * names. A new one is gated on Telegram's `X-Telegram-Bot-Api-Secret-Token`
 * header (the `secret_token` given to setWebhook), or it is listed here with
 * the reason it is not.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '../../../..');

// Empty: /api/newTelegram checks the header since 2026-10-14 (§14.6) and has its
// own tests in server.test.ts.
const REVIEWED_WEBHOOKS: Record<string, string> = {};

function serverFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) serverFiles(full, out);
    else if (/^\+server\.(js|ts)$/.test(name)) out.push(full);
  }
  return out;
}

// What reading an incoming update looks like: a field of the update itself, or
// handing the body to telegraf.
const READS_UPDATE = /\bmessage\??\.from\b|\bcallback_query\b|\bupdate_id\b|\.handleUpdate\(/;
const WEBHOOKS = serverFiles(join(ROOT, 'src/routes'))
  .map((f) => relative(ROOT, f).split('\\').join('/'))
  .filter((rel) => READS_UPDATE.test(readFileSync(join(ROOT, rel), 'utf8')));

describe('Telegram webhook routes', () => {
  it('the old unauthenticated /api/yy is gone', () => {
    expect(existsSync(join(ROOT, 'src/routes/api/yy'))).toBe(false);
  });

  it('finds the live webhook (the scan works)', () => {
    expect(WEBHOOKS).toContain('src/routes/api/newTelegram/+server.js');
  });

  it.each(WEBHOOKS)('%s is gated on the secret header or reviewed', (rel) => {
    const gated = /x-telegram-bot-api-secret-token/i.test(readFileSync(join(ROOT, rel), 'utf8'));
    expect(
      gated || rel in REVIEWED_WEBHOOKS,
      `${rel} reads a Telegram update but neither checks X-Telegram-Bot-Api-Secret-Token nor is reviewed in REVIEWED_WEBHOOKS`
    ).toBe(true);
  });

  it('nothing still calls /api/yy', () => {
    const callers = sourceFiles(join(ROOT, 'src'))
      .filter((f) => /['"`]\/api\/yy\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f));
    expect(callers).toEqual([]);
  });
});

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(svelte|js|ts)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(full);
  }
  return out;
}
