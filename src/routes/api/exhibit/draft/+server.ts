/**
 * POST /api/exhibit/draft — keep the rikma a fair visitor just built
 * (docs/inprogress/PLAN_EXHIBITION_MODE.md §7).
 *
 * Body: { blueprint, lang, meta? } — meta: { source, words }, see exhibit/meta.ts. Only the stand may call it: the kiosk pass cookie
 * is required, and the stand has a quota of its own. Returns the preview key
 * and a signup token; the kiosk turns them into the QR on its last screen.
 * Nothing exists on 1lev1 until the visitor signs (see createExhibitDraft).
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { createExhibitDraft } from '$lib/server/exhibit/draft';
import { EXHIBIT_COOKIE, isExhibitPass } from '$lib/server/exhibit/pass';
import { RateLimiter } from '$lib/server/translation/rateLimit';

const HOUR = 60 * 60 * 1000;
const PER_HOUR = 120;
const PER_DAY = 800;
const stand = new RateLimiter({ maxKeys: 4 });
const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  if (!isExhibitPass(cookies.get(EXHIBIT_COOKIE))) return json({ ok: false, reason: 'no-pass' }, { status: 403, headers: HEADERS });

  const hour = stand.take('draft:h', PER_HOUR, HOUR);
  const day = hour.ok ? stand.take('draft:d', PER_DAY, 24 * HOUR) : hour;
  if (!day.ok) return json({ ok: false, reason: 'busy' }, { status: 429, headers: HEADERS });

  const body = (await request.json().catch(() => null)) as { blueprint?: unknown; lang?: unknown; meta?: unknown } | null;
  if (!body) return json({ ok: false, reason: 'bad-request' }, { status: 400, headers: HEADERS });

  try {
    const r = await createExhibitDraft(body.blueprint, body.lang, { strapi: strapiClient, fetch }, body.meta);
    if (!r.ok) return json(r, { status: 400, headers: HEADERS });
    return json({ ok: true, shareKey: r.shareKey, token: r.token, expiresAt: r.expiresAt }, { headers: HEADERS });
  } catch (e) {
    console.error('[exhibit/draft] failed:', e);
    return json({ ok: false, reason: 'error' }, { status: 502, headers: HEADERS });
  }
};
