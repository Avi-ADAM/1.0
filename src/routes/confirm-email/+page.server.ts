import { redirect, fail } from '@sveltejs/kit';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';
import type { Actions, PageServerLoad } from './$types';

/**
 * Email-confirmation landing page.
 *
 * Strapi's own `/api/auth/email-confirmation` is a bare API endpoint: it
 * confirms the user, nulls `confirmationToken`, and redirects — but on a token
 * it cannot find it answers `400 {"error":{"name":"ValidationError",
 * "message":"Invalid token"}}`, which the browser renders as raw JSON. Since
 * the token is **single-use**, that is what a user sees whenever the link is
 * opened twice: a refresh, a second click, a "resend" that rotated the token,
 * or — most often — a mail client / antivirus link-scanner that fetched the URL
 * before the human did. The account is confirmed in that case; only the
 * feedback is broken.
 *
 * So the confirmation link should point here instead (Strapi admin →
 * Settings → Users & Permissions → Email templates → Email address
 * confirmation, `<%= URL %>` → `https://www.1lev1.com/confirm-email`). We
 * forward to Strapi server-side and turn its two outcomes into pages a person
 * can act on.
 */

const CONFIRM_ENDPOINT = `${STRAPI_URL}/api/auth/email-confirmation`;

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
  const token = url.searchParams.get('confirmation');
  const email = cookies.get('email') ?? '';

  if (!token) {
    return { state: 'missing' as const, email };
  }

  let status: number;
  try {
    const res = await fetch(
      `${CONFIRM_ENDPOINT}?confirmation=${encodeURIComponent(token)}`,
      // A good token answers with a 302 to Strapi's configured redirection URL.
      // Don't follow it — that target is not ours to render, and a 404 there
      // would look like a failed confirmation.
      { redirect: 'manual' }
    );
    status = res.status;
  } catch (e) {
    console.error('[confirm-email] Strapi confirmation request failed:', e);
    return { state: 'error' as const, email };
  }

  // `redirect: 'manual'` yields either the 3xx itself or an opaque redirect
  // (status 0), depending on the fetch implementation. Both mean success; only
  // a 4xx/5xx is a real failure.
  if (status >= 400) {
    return { state: 'spent' as const, email };
  }

  // Strapi's endpoint returns no JWT, so a session can only be continued, not
  // created: same browser as the signup → straight into onboarding, otherwise
  // log in with the password just chosen.
  throw redirect(303, cookies.get('jwt') ? '/onboard' : '/login?confirmed=1');
};

export const actions: Actions = {
  resend: async ({ request, cookies, fetch }) => {
    const data = await request.formData();
    const email = String(data.get('email') || cookies.get('email') || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return fail(400, { resent: false });
    }

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/send-email-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      // Strapi answers 400 for an already-confirmed address. That is good news
      // for the user, not an error to show — either way the next step is to log
      // in, so the page says so without leaking whether the address exists.
      if (!res.ok) {
        console.warn('[confirm-email] resend rejected by Strapi:', res.status);
      }
    } catch (e) {
      console.error('[confirm-email] resend failed:', e);
      return fail(502, { resent: false });
    }

    return { resent: true };
  }
};
