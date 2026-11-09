/**
 * Anonymous pre-signup proxy for the "chezin" (agreement signatory) flow.
 *
 * amana.svelte (and hascama/+page.svelte) run BEFORE login/signup, so there
 * is no JWT cookie to authenticate with — they used to call Strapi's
 * /graphql directly with VITE_URL, unauthenticated.
 * This route runs the same two operations server-side via sendToSer's isSer
 * path (internal secret injected automatically by hooks.server.js handleFetch
 * on this server-side fetch), so the client never talks to Strapi directly.
 *
 * Also called cross-origin by the agreement.1lev1.com repo (the "1-1" sister
 * site), whose full-agreement flow used to hit Strapi's /graphql directly too
 * — see corsHeaders below.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import { signupCookieOptions } from '$lib/server/signupCookies.js';
import { extendedIdOf, extendedRowOf } from '$lib/server/assistant/extendedSignature.js';
import { canResumeSignature, isUniqueViolation } from '$lib/server/chezinResume';
import { normalizeLang, normalizeSource } from '$lib/server/signupNudge/source';

// Credentials are allowed so the signature cookies below (`fpval`, `un`,
// `email`, `country` on .1lev1.com) are stored when the agreement site signs
// with `credentials: 'include'`. That signature is how consensus.1lev1.com
// recognizes a signatory, and /signup finds it already seated. The origin is
// a fixed sister site, never echoed from the request.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://agreement.1lev1.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  Vary: 'Origin'
};

export const POST: RequestHandler = async ({ request, fetch, cookies, url }) => {
  const body = await request.json();

  if (body?.action === 'list') {
    const result = await sendToSer({}, '279getChezinNames', 0, 0, true, fetch);
    return json(result, { headers: corsHeaders });
  }

  if (body?.action === 'create') {
    const { name, email, countries, publishedAt, fullAgreement } = body;
    if (!name || !email) {
      return json({ errors: [{ message: 'name and email are required' }] }, { status: 400, headers: corsHeaders });
    }
    let resumed = false;
    let result: any = await sendToSer(
      { name, email, countries: countries ?? [], publishedAt, fullAgreement: fullAgreement === true },
      '280createChezin',
      0,
      0,
      true,
      fetch
    );

    // This email has signed before. Carry on with that signature when this
    // browser holds it; otherwise say so, keeping `errors` for existing callers.
    if (isUniqueViolation(result)) {
      const seated = extendedIdOf(cookies.get('fpval'));
      const found = seated
        ? await sendToSer({ id: seated }, '386getChezinForAgentSign', 0, 0, true, fetch).catch(() => null)
        : null;
      if (!canResumeSignature(extendedRowOf(found), { email, fullAgreement: fullAgreement === true })) {
        return json({ ...result, alreadySigned: true }, { headers: corsHeaders });
      }
      result = { data: { createChezin: { data: { id: seated } } } };
      resumed = true;
    }

    // Decides later whether this person gets the signup mail. Best effort: no
    // source just means no mail, and must never cost anyone their signature.
    const signedId = result?.data?.createChezin?.data?.id;
    const source = normalizeSource(body.source);
    if (signedId && source && !resumed) {
      await sendToSer(
        { id: String(signedId), source, signupLang: normalizeLang(body.lang) },
        'chezinSetSource',
        0,
        0,
        true,
        fetch
      ).catch(() => null);
    }

    // Seat the /signup handshake from the server. A Set-Cookie survives where
    // the page's own document.cookie write does not (iOS Safari, in-app
    // browsers), and /signup's load redirects back to /hascama without
    // `fpval`. The agreement site (cross-origin, same site) stores them too
    // when it calls with credentials — see corsHeaders.
    const chezinId = result?.data?.createChezin?.data?.id;
    if (chezinId) {
      const opts = signupCookieOptions(url);
      cookies.set('fpval', String(chezinId), { ...opts, httpOnly: true });
      cookies.set('un', name, { ...opts, httpOnly: false });
      cookies.set('email', email, { ...opts, httpOnly: false });
      cookies.set('country', (countries ?? []).join(','), { ...opts, httpOnly: false });
    }

    return json(result, { headers: corsHeaders });
  }

  return json({ errors: [{ message: 'Unknown action' }] }, { status: 400, headers: corsHeaders });
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
