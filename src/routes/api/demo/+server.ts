/**
 * /api/demo — capture a request for a personal demo.
 *
 * The public site's third path, next to login and register: someone who wants
 * to understand the model before committing to it. One POST does everything
 * that request implies:
 *
 *   1. saves a `demo-request` row in Strapi (the lead record);
 *   2. for "I'd rather drop in when it suits me", opens a meetings-app meeting
 *      and mints a guest link so they can join without an account;
 *   3. opens the two follow-up tasks in the central rikma (coordinate the call,
 *      hold the call) — unassigned, so every member is notified and whoever is
 *      free takes it, rather than the lead becoming a note in one inbox;
 *   4. pings the team on Telegram;
 *   5. writes the meeting/task ids back onto the lead row, so one record shows
 *      the whole state.
 *
 * Steps 2–5 are all best-effort. The lead is the thing that must not be lost:
 * as long as Strapi took the row, the response is a success, and a `warnings`
 * array says which of the extras didn't happen.
 *
 * Open by design — no auth. A demo request is exactly the thing an anonymous
 * visitor should be able to send, so this mirrors `/api/report`: no client
 * secret, no session, minimal validation, and nothing the caller sends is ever
 * echoed to another user. Unlike `/api/report` it does write more than one row
 * — two tasks land on the central rikma's board and notify its members — so it
 * is rate-limited per IP to keep that board from being usable as a spam target.
 */

import { env } from '$env/dynamic/private';
// The owner's chat id comes from the *static* module, the same way `/api/ste`
// and `/api/report` read it. Those are the two places that actually send
// Telegram today, and a var that only exists at build time would read back
// empty through the dynamic module — turning the notification into a silent
// no-op, which is the one failure mode this whole endpoint exists to avoid.
import { NEW_TELEGRAM } from '$env/static/private';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import { createDemoTasks, centralRikmaId } from '$lib/server/demo/centralRikmaTasks.js';
import { createDemoMeeting } from '$lib/server/demo/demoMeeting.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TRACKS = ['idea', 'partnership', 'provider', 'curious'] as const;
const TIME_MODES = ['scheduled', 'flexible', 'callback', 'recorded'] as const;

type Track = (typeof TRACKS)[number];
type TimeMode = (typeof TIME_MODES)[number];

const TRACK_LABELS: Record<Track, string> = {
  idea: '💡 רעיון למיזם',
  partnership: '🤝 שותפות קיימת',
  provider: '🛠️ נותן/ת שירות',
  curious: '👀 רוצה להכיר'
};

const TIME_MODE_LABELS: Record<TimeMode, string> = {
  scheduled: '📅 רוצה לקבוע זמן',
  flexible: '🚪 ייכנס/תיכנס בזמן שנוח',
  callback: '📞 נחזור אליו/ה',
  recorded: '🎬 רוצה קודם דמו מוקלט'
};

// ─── Basic in-memory per-IP rate limiting ───────────────────────────────────
// A person books one demo, maybe two if they mistype an address. Five an hour
// is far above any honest use and far below "flood the rikma's board". Same
// first-line-of-defence shape as /api/v1/sales: process-local, no Redis.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // The map is only ever added to, so drop expired buckets as we go.
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) if (v.resetAt <= now) rateBuckets.delete(k);
  }

  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

/** Trim, collapse whitespace and cap length — these strings end up in a Telegram message. */
function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : null;
}

/** Same, but keeps line breaks (free-text fields). */
function cleanMultiline(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function adminToken(): string {
  let t = String(env.ADMINMONTHER ?? '').replace(/\s+/g, '');
  if (t.startsWith('ADMINMONTHER=')) t = t.slice('ADMINMONTHER='.length);
  return t;
}

/**
 * Telegram's HTML mode rejects a message with a stray `&`, `<` or `>`, and the
 * lead's own words go straight into one — so escape anything they wrote.
 */
function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Notify the site owner through the existing bot at `/api/ste`.
 *
 * `/api/ste` has two shapes. The `{name, action, det}` one interpolates
 * straight into a `sendMessage?text=…` query string without encoding, which is
 * fine for the short telemetry lines that use it but would silently truncate a
 * demo request at the first `&` or `#` someone types into the free-text field.
 * The `isNew` shape POSTs through Telegraf instead, so it survives arbitrary
 * text — and adds the inline "לצפייה ב‑1💗1" button. It wants an explicit
 * `chat_id`, which is the owner's chat, the same destination the other shape
 * defaults to.
 */
async function notifyOwner(
  fetchFn: typeof globalThis.fetch,
  title: string,
  message: string
): Promise<void> {
  if (!NEW_TELEGRAM) return;
  await fetchFn('/api/ste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isNew: true,
      chat_id: NEW_TELEGRAM,
      det: title,
      message,
      // The button lands on the heart page, where the two new tasks are waiting.
      urladd: 'lev',
      lang: 'he'
    })
  });
}

export const POST: RequestHandler = async ({ request, fetch, getClientAddress }) => {
  let ip = 'unknown';
  try {
    ip = getClientAddress();
  } catch {
    // Behind some adapters there is no client address to read; a shared bucket
    // is still better than none.
  }
  if (!checkRateLimit(ip)) {
    return json({ success: false, error: 'too many requests' }, { status: 429 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'invalid json' }, { status: 400 });
  }

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 160)?.toLowerCase() ?? null;
  const phone = clean(body?.phone, 40);

  // The form asks for a name and *one* way to reach them — that is the whole
  // contract, and it is what the copy on the form promises.
  if (!name) {
    return json({ success: false, error: 'name required' }, { status: 400 });
  }
  if (!email && !phone) {
    return json({ success: false, error: 'email or phone required' }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: 'invalid email' }, { status: 400 });
  }

  const track = pick<Track>(body?.track, TRACKS, 'curious');
  const timeMode = pick<TimeMode>(body?.timeMode, TIME_MODES, 'callback');
  const goal = cleanMultiline(body?.goal, 2000);
  const preferredTime = clean(body?.preferredTime, 200);
  const lang = clean(body?.lang, 8) ?? 'he';
  const page = clean(body?.page, 300);
  const source = clean(body?.source, 40) ?? 'fpage';
  const userId = clean(body?.userId, 40);

  const warnings: string[] = [];

  // ── 1. Drop-in meeting (only for the "whenever suits me" path) ────────────
  let meetingId: string | null = null;
  let meetingLink: string | null = null;
  if (timeMode === 'flexible') {
    const meeting = await createDemoMeeting(name, email, fetch);
    if (meeting.ok) {
      meetingId = meeting.meetingId ?? null;
      meetingLink = meeting.link ?? null;
    } else {
      warnings.push(`meeting:${meeting.reason}`);
    }
  }

  // ── 2. Save the lead ──────────────────────────────────────────────────────
  let strapiId: number | null = null;
  try {
    const res = await fetch(`${STRAPI_URL}/api/demo-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken()}`
      },
      body: JSON.stringify({
        data: {
          name,
          email,
          phone,
          track,
          goal,
          timeMode,
          preferredTime,
          lang,
          page,
          source,
          status: 'new',
          userId,
          meetingId,
          meetingLink
        }
      })
    });
    if (res.ok) {
      const saved = await res.json();
      strapiId = saved?.data?.id ?? null;
    } else {
      const err = await res.text();
      console.error('[demo] Strapi save failed:', res.status, err.slice(0, 300));
      return json({ success: false, error: 'save failed' }, { status: 502 });
    }
  } catch (e) {
    console.error('[demo] Strapi save error:', e);
    return json({ success: false, error: 'save failed' }, { status: 502 });
  }

  // ── 3. Follow-up work in the central rikma ────────────────────────────────
  const tasks = await createDemoTasks(
    {
      name,
      email,
      phone,
      track,
      goal,
      timeMode,
      preferredTime,
      lang,
      demoRequestId: strapiId,
      meetingLink
    },
    fetch
  );
  if (!tasks.created) warnings.push(`tasks:${tasks.reason ?? 'error'}`);

  // ── 4. Write the task ids back onto the lead ──────────────────────────────
  if (strapiId && (tasks.coordActId || tasks.callActId)) {
    try {
      await fetch(`${STRAPI_URL}/api/demo-requests/${strapiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken()}`
        },
        body: JSON.stringify({
          data: {
            coordActId: tasks.coordActId ?? null,
            callActId: tasks.callActId ?? null
          }
        })
      });
    } catch (e) {
      console.error('[demo] linking tasks back to the lead failed:', e);
      warnings.push('link:error');
    }
  }

  // ── 5. Tell the owner ─────────────────────────────────────────────────────
  try {
    const projectId = centralRikmaId();
    await notifyOwner(
      fetch,
      '💗 בקשה לדמו אישי',
      [
        `👤 <b>${esc(name)}</b>`,
        email ? `📧 ${esc(email)}` : null,
        phone ? `📱 ${esc(phone)}` : null,
        `🎯 ${TRACK_LABELS[track]}`,
        `🕒 ${TIME_MODE_LABELS[timeMode]}${preferredTime ? ` · ${esc(preferredTime)}` : ''}`,
        `🌐 ${esc(lang)} · 📍 ${esc(page || '—')} · ${esc(source)}`,
        strapiId ? `🗄 demo-request #${strapiId}` : null,
        meetingLink ? `🚪 פגישת אורח: ${esc(meetingLink)}` : null,
        tasks.coordActId && projectId
          ? `🛠️ מטלות בריקמה המרכזית: ${[tasks.coordActId, tasks.callActId]
              .filter(Boolean)
              .join(', ')}`
          : null,
        goal ? `\n<b>מה הם רוצים ליצור:</b>\n${esc(goal)}` : null
      ]
        .filter((l) => l !== null)
        .join('\n')
    );
  } catch (e) {
    console.error('[demo] owner notification error:', e);
    warnings.push('telegram:error');
  }

  return json({
    success: true,
    demoRequestId: strapiId,
    meetingLink,
    warnings: warnings.length ? warnings : undefined
  });
};
