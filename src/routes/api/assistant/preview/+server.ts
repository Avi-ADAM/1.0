/**
 * GET /api/assistant/preview?k=<shareKey> — the read-only projection of a
 * shared rikma draft (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.4).
 *
 * Public on purpose: the link is sent to partners who may have no account.
 * What it returns is `blueprintToRikmaView` — no session id, no keys, no email,
 * no `why` — and only while the link is alive. An unknown or expired key and a
 * malformed one all answer the same 404, so a key cannot be probed.
 *
 * Runs on the VPS like every /api route; the www page only calls it
 * (PLAN §1.2). Rate-limited per address; no model call.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { loadByShareKey } from '$lib/server/assistant/session.js';
import { blueprintToRikmaView } from '$lib/assistant/rikmaView.js';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const limiter = new RateLimiter();
const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export const GET: RequestHandler = async ({ url, fetch, getClientAddress }) => {
  const verdict = limiter.take(callerKey(undefined, getClientAddress()), 60, 60_000);
  if (!verdict.ok) {
    return json({ ok: false, reason: 'rate-limited' }, { status: 429, headers: { ...HEADERS, 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } });
  }

  const key = url.searchParams.get('k') ?? '';
  const row = await loadByShareKey(strapiClient, key, new Date(), fetch).catch(() => null);
  if (!row) return json({ ok: false, reason: 'not-found' }, { status: 404, headers: HEADERS });

  return json(
    {
      ok: true,
      view: blueprintToRikmaView(row.state),
      expiresAt: row.shareExpiresAt,
      // Already created: the preview points at the real rikma instead.
      projectId: row.projectId
    },
    { headers: HEADERS }
  );
};
