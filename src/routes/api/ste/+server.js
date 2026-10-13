// The Telegram bot relay. Two shapes, two audiences:
//
// - **Targeted** (`isNew` / `chat_id`): the caller picks the chat and the HTML.
//   Only this server may use it (TelegramService, /api/demo). Open to the
//   browser, it let anyone message every person who ever started the bot,
//   with any text, under the platform's name — a phishing kit with our logo.
//   Gated with the internal secret exactly like /api/sendMail
//   ($lib/server/internalOnly.js). TelegramService posts to the absolute
//   www URL, which handleFetch does not stamp from the VPS, so it sends the
//   header itself.
// - **Owner telemetry** (`name`, `action`, `det`): always the owner's chat
//   (env.NEW_TELEGRAM), never the caller's. Browsers use it (rikma created,
//   client errors), so it stays open — rate-limited per IP and overall, length
//   capped, and sent as a JSON body instead of being spliced into a URL.

import { env } from '$env/dynamic/private';
import { rejectUnlessInternal } from '$lib/server/internalOnly.js';
import { isInternalRequest } from '$lib/server/internalSecret.js';
import { RateLimiter } from '$lib/server/translation/rateLimit';

const ROUTE = '/api/ste';

// Telegram caps a message at 4096 characters; a field this long is not telemetry.
const MAX_FIELD = 1000;
const WINDOW_MS = 10 * 60_000;
const PER_IP = 20;
// Rotating IPs must not be able to bury the owner's chat either.
const OVERALL = 200;

const limiter = new RateLimiter();

const buttontext = {
  he: 'לצפייה ב-1💗1',
  en: ' see on 1💗1'
};

const field = (v) => (v == null ? '' : String(v).slice(0, MAX_FIELD));

/** @param {string} token @param {Record<string, unknown>} payload */
async function sendMessage(token, payload) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

const status = (code) => new Response(null, { status: code });

export const POST = async ({ request, getClientAddress }) => {
  let data;
  try {
    data = await request.json();
  } catch {
    return status(400);
  }
  if (!data || typeof data !== 'object') return status(400);

  const token = env.TELEGRAM_BOT_TOKEN_NEW;

  // Any hint of a caller-chosen destination is the targeted shape, whatever
  // `isNew` is spelled as (the old check let `"1"` through as true).
  if (data.isNew || data.chat_id != null) {
    const refused = rejectUnlessInternal(request, ROUTE);
    if (refused) return refused;
    return sendTargeted(token, data);
  }

  let internal = false;
  try {
    internal = isInternalRequest(request);
  } catch {
    // No ADMINMONTHER: treat as a browser, which is still allowed here.
  }
  if (!internal) {
    let ip = 'unknown';
    try {
      ip = getClientAddress();
    } catch {
      // Some adapters have no client address; the shared bucket still limits.
    }
    // Per IP first: a refused attempt is not recorded, so one noisy address
    // that is over its own limit cannot keep eating the shared allowance.
    if (!limiter.take(`ip:${ip}`, PER_IP, WINDOW_MS).ok) return status(429);
    if (!limiter.take('*', OVERALL, WINDOW_MS).ok) return status(429);
  }

  if (!token || !env.NEW_TELEGRAM) return status(503);
  const text = [data.name, data.action, data.det].map(field).filter((s) => s.trim()).join('\n');
  if (!text) return status(400);

  try {
    // No parse_mode: what a browser wrote is shown as plain text, never as markup.
    const res = await sendMessage(token, { chat_id: env.NEW_TELEGRAM, text });
    return status(res.ok ? 200 : 502);
  } catch (err) {
    console.error(`[${ROUTE}] owner telemetry failed:`, err);
    return status(502);
  }
};

/** The server-only shape: a chosen chat, HTML, and up to four site buttons. */
async function sendTargeted(token, data) {
  if (!token) return status(503);
  const chat_id = data.chat_id;
  if (chat_id == null || String(chat_id).trim() === '') return status(400);

  const lang = data.lang || 'he';
  const urladd = data.urladd || 'lev';
  // Several ways to answer one notification (the rikma's vote page, the heart),
  // one button per row so the reader picks. Paths on the site only: a button
  // can never point anywhere but 1lev1. Without them, the one `urladd` button.
  const buttons = (Array.isArray(data.buttons) ? data.buttons : [])
    .filter((b) => b && typeof b.text === 'string' && b.text.trim() && typeof b.path === 'string')
    .slice(0, 4)
    .map((b) => [{ text: b.text.trim(), url: 'https://www.1lev1.com/' + b.path.replace(/^\/+/, '') }]);
  const keyboard = buttons.length
    ? buttons
    : [[{ text: buttontext[lang] || buttontext.en, url: 'https://www.1lev1.com/' + String(urladd).replace(/^\/+/, '') }]];

  try {
    const res = await sendMessage(token, {
      chat_id,
      text: `<b>${data.det ?? ''}</b> \n\n${data.message ?? ''}`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    });
    if (!res.ok) console.error(`[${ROUTE}] Telegram refused the message:`, res.status);
    return status(res.ok ? 200 : 502);
  } catch (err) {
    console.error(`[${ROUTE}] Error sending message:`, err);
    return status(502);
  }
}
