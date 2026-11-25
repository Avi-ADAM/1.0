/**
 * POST /api/exhibit/lead — "keep it for me, get back to me"
 * (docs/inprogress/PLAN_EXHIBITION_MODE.md §7).
 *
 * Body: { t, name?, email?, phone?, consent: true, via: 'kiosk' | 'phone' }.
 * `t` is the signup token on the visitor's QR: it names the draft, and only a
 * live token whose draft is still pending opens a lead. The lead goes to the
 * central rikma (`recordExhibitLead`), one per draft however often it is sent.
 *
 * From the stand (`via: 'kiosk'`) the pass cookie is required, since every
 * visitor shares its address; from a phone the address is the visitor's own,
 * and a small per-address limit is enough.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { strapiClient } from '$lib/server/actions/index.js';
import { openSignupToken } from '$lib/server/assistant/signupToken.js';
import { loadSession } from '$lib/server/assistant/session.js';
import { EXHIBIT_COOKIE, isExhibitPass } from '$lib/server/exhibit/pass';
import { recordExhibitLead } from '$lib/server/exhibit/lead';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const SITE = 'https://www.1lev1.com';
const HOUR = 60 * 60 * 1000;
const perAddress = new RateLimiter();
const stand = new RateLimiter({ maxKeys: 4 });
const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const refuse = (reason: string, status: number) => json({ ok: false, reason }, { status, headers: HEADERS });
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: RequestHandler = async ({ request, cookies, fetch, getClientAddress }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return refuse('bad-request', 400);

  const via = body.via === 'kiosk' ? 'kiosk' : 'phone';
  if (via === 'kiosk') {
    if (!isExhibitPass(cookies.get(EXHIBIT_COOKIE))) return refuse('no-pass', 403);
    if (!stand.take('lead', 200, HOUR).ok) return refuse('busy', 429);
  } else if (!perAddress.take(callerKey(undefined, getClientAddress()), 5, HOUR).ok) {
    return refuse('rate-limited', 429);
  }

  if (body.consent !== true) return refuse('consent', 400);
  const name = str(body.name, 80);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 40);
  if (email && !EMAIL.test(email)) return refuse('email', 400);
  if (!email && !phone) return refuse('contact', 400);

  const token = typeof body.t === 'string' ? body.t : '';
  const p = openSignupToken(token);
  if (!p || p.intent !== 'idea') return refuse('expired', 400);
  const row = await loadSession(strapiClient, p.sid, fetch).catch(() => null);
  if (!row || row.status !== 'pending' || row.kind !== 'rikma') return refuse('expired', 400);

  const items = (row.state?.items ?? []).filter((i) => i.status !== 'dropped');
  const missions = items.filter((i) => i.group === 'rikmaMissions');
  const open = items.filter(
    (i) => (i.group === 'rikmaMissions' || i.group === 'rikmaResources') && i.spec?.holder !== 'me'
  );
  const idea = String(row.state?.fields?.name ?? '').trim() || 'exhibit rikma';
  const shareKey = str(body.shareKey, 200);
  const r = await recordExhibitLead(
    {
      sessionId: row.id,
      name: name || null,
      email: email || null,
      phone: phone || null,
      lang: p.lang,
      via,
      idea,
      missions: missions.length,
      open: open.length,
      previewUrl: shareKey ? `${SITE}/preview/rikma/${encodeURIComponent(shareKey)}?ref=exhibit` : `${SITE}/vision?ref=exhibit`,
      signupUrl: `${SITE}/hascama?agent=${token}`
    },
    env.EXHIBIT_LABEL || '1lev1 · exhibition stand',
    fetch
  );
  if (!r.ok) return refuse(r.reason ?? 'error', r.reason === 'not_configured' ? 503 : 502);
  return json({ ok: true }, { headers: HEADERS });
};
