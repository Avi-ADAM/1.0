/**
 * GET /api/assistant/signup-token?t=<token> — what /hascama?agent= prefills
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.3). The token's key lives only here on
 * the VPS; www asks, never decrypts.
 *
 * Returns the fields the person will see and can change anyway — never the
 * session id. Anything that is not a live token is one answer, 404, and the
 * page falls back to the ordinary agreement.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { openSignupToken } from '$lib/server/assistant/signupToken.js';
import { SIGNUP_COUNTRIES } from '$lib/data/signupCountries.js';

export const GET: RequestHandler = async ({ url }) => {
  const p = openSignupToken(url.searchParams.get('t'));
  if (!p) return json({ ok: false }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const countries = p.countryIds
    .map((id) => SIGNUP_COUNTRIES.find((c) => c.value === id))
    .filter(Boolean)
    .map((c) => ({ id: c!.value, label: c!.label, heb: c!.heb }));
  return json(
    { ok: true, prefill: { name: p.name, email: p.email, countries, intent: p.intent, lang: p.lang } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
};
