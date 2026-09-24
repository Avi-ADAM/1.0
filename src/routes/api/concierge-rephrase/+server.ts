/**
 * POST /api/concierge-rephrase — "Lev's phrasing suggestion" for the composer.
 *
 * Body: { title?: string, text: string } (text is plain, paragraphs split by a
 * blank line). Returns { text } — the rephrased wish, or '' when there was
 * nothing to work with or the model failed; the composer then leaves the
 * writer's own text untouched.
 *
 * The composer is open to guests (/wish/new, /made-for-you), so a guest may
 * call this too — with a tighter per-minute allowance, keyed by IP.
 */

import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rephraseWish } from '$lib/server/ai/rephraseWish';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const limiter = new RateLimiter();
const WINDOW_MS = 60_000;

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === 'string' ? body.text : '';
  const title = typeof body?.title === 'string' ? body.title : '';

  const userId = (locals as { uid?: string | number }).uid;
  const verdict = limiter.take(
    callerKey(userId ? String(userId) : undefined, getClientAddress()),
    userId ? 10 : 4,
    WINDOW_MS
  );
  if (!verdict.ok) {
    return json(
      { text: '', reason: 'rate-limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } }
    );
  }

  try {
    return json({ text: await rephraseWish(title, text, GEMINI_API_KEY) });
  } catch (err) {
    console.error('[concierge-rephrase] failed:', err);
    return json({ text: '', reason: 'failed' });
  }
};
