/**
 * POST /api/assistant/agent-sign — the signature on the agent-prepared signup
 * screen (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.3, §5.4).
 *
 * Does what /api/chezin's `create` does — the signatory row and the four
 * signup cookies /signup reads — and one more thing: ties the row to the
 * pending session the token names. That tie is the claim's only key, so it is
 * made here, server-side, for a row this call itself just created, and only
 * for a live token whose session is still pending and not tied yet.
 *
 * The person, not the agent, is the one pressing the button: the name, email
 * and countries arrive from the form (they may have corrected them), and the
 * password step that follows is /signup's own.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { openSignupToken } from '$lib/server/assistant/signupToken.js';
import { loadSession, saveSession } from '$lib/server/assistant/session.js';
import { takeSign } from '$lib/server/assistant/publicQuota.js';
import { countryIdsOf } from '$lib/data/signupCountries.js';
import { signupCookieOptions } from '$lib/server/signupCookies.js';

export const POST: RequestHandler = async ({ request, fetch, cookies, url, getClientAddress }) => {
  const quota = takeSign(getClientAddress());
  if (!quota.ok) return json({ ok: false, reason: 'rate-limited' }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = openSignupToken(body?.t);
  if (!token) return json({ ok: false, reason: 'expired' }, { status: 400 });

  const name = String(body?.name ?? '').trim().slice(0, 80);
  const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 200);
  const countries = countryIdsOf(Array.isArray(body?.countries) ? (body!.countries as (string | number)[]) : []);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, reason: 'fields' }, { status: 400 });
  if (!countries.length) return json({ ok: false, reason: 'countries' }, { status: 400 });
  if (body?.agreed !== true) return json({ ok: false, reason: 'agreement' }, { status: 400 });

  // The session first: a token whose session is gone, claimed or already
  // signed for gets the ordinary path, not a second tie.
  const session = await loadSession(strapiClient, token.sid, fetch).catch(() => null);
  const tieable = !!session && session.status === 'pending' && !session.userId && !session.chezinId;

  const created = await strapiClient.execute(
    '280createChezin',
    { name, email, countries: countries.map(String), publishedAt: new Date().toISOString(), fullAgreement: false },
    undefined,
    fetch
  );
  const chezinId = created?.data?.createChezin?.data?.id ? String(created.data.createChezin.data.id) : null;
  if (!chezinId) return json({ ok: false, reason: 'failed' }, { status: 502 });

  if (tieable) {
    try {
      await saveSession(strapiClient, session!, { patch: { chezinId } }, fetch);
    } catch (e) {
      // The person can still sign up; only the prepared draft is not waiting.
      console.warn('[agent-sign] could not tie the session', token.sid, e);
    }
  }

  // Exactly what /api/chezin seats for /signup (see that route for why a
  // server Set-Cookie and not document.cookie).
  const opts = signupCookieOptions(url);
  cookies.set('fpval', chezinId, { ...opts, httpOnly: true });
  cookies.set('un', name, { ...opts, httpOnly: false });
  cookies.set('email', email, { ...opts, httpOnly: false });
  cookies.set('country', countries.join(','), { ...opts, httpOnly: false });

  return json({ ok: true, chezinId, countries, tied: tieable });
};
