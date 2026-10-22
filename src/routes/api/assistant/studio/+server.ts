/**
 * GET / POST /api/assistant/studio — behind-the-scenes draft studio for a
 * pending rikma prepared via `prepareForSomeoneElse` or `prepareSignup`
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1, §5.7).
 *
 * Runs on the VPS like every `/api` route; the www page under
 * `/preview/rikma/studio/[token]` only calls this endpoint (PLAN §1.2).
 * Access is authorized solely by the AEAD signup/handoff token while the
 * session is still `pending`. Rate-limited per IP; no model call.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { openStudio, saveStudioOps } from '$lib/server/assistant/studio.js';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const readLimiter = new RateLimiter();
const writeLimiter = new RateLimiter();
const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export const GET: RequestHandler = async ({ url, fetch, getClientAddress }) => {
  const verdict = readLimiter.take(callerKey(undefined, getClientAddress()), 60, 60_000);
  if (!verdict.ok) {
    return json(
      { ok: false, reason: 'rate-limited' },
      { status: 429, headers: { ...HEADERS, 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } }
    );
  }

  const t = url.searchParams.get('t') ?? '';
  const result = await openStudio(t, { strapi: strapiClient, fetch });
  if (!result.ok) return json(result, { status: 404, headers: HEADERS });
  return json(result, { headers: HEADERS });
};

export const POST: RequestHandler = async ({ request, fetch, getClientAddress }) => {
  const verdict = writeLimiter.take(callerKey(undefined, getClientAddress()), 40, 60_000);
  if (!verdict.ok) {
    return json(
      { ok: false, reason: 'rate-limited', message: 'Too many saves - wait a moment and try again.' },
      { status: 429, headers: { ...HEADERS, 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } }
    );
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: 'badRequest', message: 'Invalid JSON body.' }, { status: 400, headers: HEADERS });
  }

  const result = await saveStudioOps(body?.t, Number(body?.expectedVersion), body?.ops, {
    strapi: strapiClient,
    fetch
  });
  if ('reason' in result) {
    const status = result.reason === 'expired' ? 404 : result.reason === 'claimed' ? 409 : 400;
    return json(result, { status, headers: HEADERS });
  }
  return json(result, { headers: HEADERS });
};
