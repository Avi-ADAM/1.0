/**
 * POST /api/concierge-transcribe — the composer's microphone fallback.
 *
 * multipart/form-data: `audio` (a MediaRecorder clip) and `lang` (he/en/ar/
 * ru/es). Returns { text } — '' when nothing was heard or no engine answered;
 * the composer then leaves the draft as it was.
 *
 * Guests write wishes too (/wish/new, /made-for-you), so a guest may call this
 * — with a tighter per-minute allowance, keyed by IP.
 */

import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { transcribe, TRANSCRIBE_MAX_BYTES } from '$lib/server/ai/transcribe';
import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const limiter = new RateLimiter();

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
  const userId = (locals as { uid?: string | number }).uid;
  const verdict = limiter.take(
    callerKey(userId ? String(userId) : undefined, getClientAddress()),
    userId ? 20 : 6,
    60_000
  );
  if (!verdict.ok) {
    return json(
      { text: '', reason: 'rate-limited' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(verdict.retryAfterMs / 1000)) } }
    );
  }

  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  const lang = String(form?.get('lang') ?? '');
  if (!(audio instanceof Blob) || audio.size === 0) {
    return json({ text: '', reason: 'bad-request' }, { status: 400 });
  }
  if (audio.size > TRANSCRIBE_MAX_BYTES) {
    return json({ text: '', reason: 'too-large' }, { status: 413 });
  }
  if (audio.type && !audio.type.startsWith('audio/')) {
    return json({ text: '', reason: 'bad-type' }, { status: 415 });
  }

  try {
    const text = await transcribe(audio, lang, {
      groq: env.GROQ_API_KEY,
      gemini: env.GEMINI_API_KEY
    });
    return json({ text });
  } catch (err) {
    console.error('[concierge-transcribe] failed:', err);
    return json({ text: '', reason: 'failed' });
  }
};
