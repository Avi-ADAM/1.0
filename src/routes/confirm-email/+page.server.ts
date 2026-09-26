import { redirect, fail } from '@sveltejs/kit';
import { signupCookieOptions } from '$lib/server/signupCookies.js';
import {
  AGENT_LANDING,
  CONCIERGE_LANDING,
  isAgentIntent,
  isConciergeIntent,
  REG_INTENT_COOKIE,
  REG_NEXT_COOKIE
} from '$lib/concierge/regIntent.js';
import type { Cookies } from '@sveltejs/kit';
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
 * forward through our own auth proxy — never straight at Strapi — and turn its
 * two outcomes into pages a person can act on.
 */

const CONFIRM_ENDPOINT = '/api/auth/email-confirmation';

/**
 * The address this link was sent to, so the login page it hands off to can be
 * prefilled. The `e` param comes from the mail template (`<%= USER.email %>`)
 * and therefore also works when the link is opened on a different device than
 * the signup — the `email` cookie only covers the same browser.
 *
 * A raw `+` in a query string decodes to a space, which would break tagged
 * gmail addresses; put it back rather than demand `encodeURIComponent` in the
 * template. Anything that doesn't look like an address is ignored.
 */
function emailFromLink(url: URL): string {
  const raw = (url.searchParams.get('e') ?? '').trim().replace(/ /g, '+');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw.toLowerCase() : '';
}

/** Where a confirmed signup continues (see regIntent.js). */
function nextFor(cookies: Cookies): string {
  // A customer who registered to order something skips the onboarding — the
  // roles/skills/CV steps are for joining rikmas — and continues to their wish.
  // An agent-prepared signup continues into what the conversation prepared
  // (PLAN_AI_SIGNUP_CONCIERGE §5.1).
  // Signed up from an agent's OAuth window: back to its consent page (§5.2).
  // The signed request there lives 15 minutes; if it ran out, that page says
  // "go back to your agent and press Connect — you are signed in now".
  const back = cookies.get(REG_NEXT_COOKIE);
  if (back && back.startsWith('/') && !back.startsWith('//')) {
    cookies.delete(REG_NEXT_COOKIE, { path: '/' });
    return back;
  }
  const intent = cookies.get(REG_INTENT_COOKIE);
  return isAgentIntent(intent) ? AGENT_LANDING : isConciergeIntent(intent) ? CONCIERGE_LANDING : '/onboard';
}

function loginFor(next: string): string {
  return next === '/onboard' ? '/login?confirmed=1' : `/login?confirmed=1&from=${encodeURIComponent(next)}`;
}

/** The session cookies, exactly as the /signup action sets them. */
function setSession(cookies: Cookies, jwt: string, user: { id?: unknown; name?: string; username?: string; email?: string } | undefined) {
  const isProduction = import.meta.env.PROD;
  const opts = {
    path: '/',
    expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    domain: isProduction ? '.1lev1.com' : undefined
  };
  cookies.set('jwt', jwt, { ...opts, httpOnly: true });
  if (user?.id != null) cookies.set('id', String(user.id), { ...opts, httpOnly: false });
  const un = user?.name || user?.username;
  if (un) cookies.set('un', String(un), { ...opts, httpOnly: false });
  cookies.set('when', Date.now().toString(), { ...opts, httpOnly: false });
}

/**
 * The stock confirmation (GET, no session). Kept as the fallback for when the
 * sign-in route is not deployed on Strapi yet.
 */
async function confirmOnly(fetchFn: typeof fetch, token: string): Promise<'ok' | 'spent' | 'error'> {
  try {
    // The proxy is the one that talks to Strapi, and it does not follow the
    // 302 a good token produces — that target is not ours to render, and a 404
    // there would look like a failed confirmation. It reports Strapi's status
    // back in the body; its own status is only about the hop.
    const res = await fetchFn(`${CONFIRM_ENDPOINT}?confirmation=${encodeURIComponent(token)}`);
    let status: number;
    if (!res.ok) {
      status = res.status;
    } else {
      const body = (await res.json().catch(() => ({}))) as { status?: number };
      status = typeof body.status === 'number' ? body.status : 200;
    }
    // `redirect: 'manual'` yields either the 3xx itself or an opaque redirect
    // (status 0), depending on the fetch implementation. Both mean success; only
    // a 4xx/5xx is a real failure.
    return status >= 400 ? 'spent' : 'ok';
  } catch (e) {
    console.error('[confirm-email] Strapi confirmation request failed:', e);
    return 'error';
  }
}

/**
 * Opening the link does NOT confirm anything any more: mail clients and
 * antivirus scanners fetch every link in a message, and the token is
 * single-use, so a GET that spends it was spending it for the scanner. The page
 * shows one "continue" button; its POST confirms and signs the person in
 * (PLAN_AI_SIGNUP_CONCIERGE §5.5), so they land in their first step without
 * typing the password they chose minutes ago — also on another device.
 */
export const load: PageServerLoad = async ({ url, cookies }) => {
  const token = url.searchParams.get('confirmation');
  const email = emailFromLink(url) || (cookies.get('email') ?? '');
  if (!token) return { state: 'missing' as const, email, confirmation: '' };
  return { state: 'ready' as const, email, confirmation: token };
};

export const actions: Actions = {
  continue: async ({ request, cookies, fetch, url }) => {
    const data = await request.formData();
    const token = String(data.get('confirmation') || '');
    const email = String(data.get('email') || '').trim().toLowerCase();
    if (!token) return fail(400, { state: 'missing' as const });
    const next = nextFor(cookies);

    // 1. Confirm and sign in (the 1.0b route, through the auth proxy; as an
    //    internal caller this action gets the jwt in the body and sets it).
    let res: Response | null = null;
    try {
      res = await fetch('/api/auth/email-confirmation-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: token })
      });
    } catch (e) {
      console.error('[confirm-email] sign-in request failed:', e);
    }
    if (res?.ok) {
      const body = (await res.json().catch(() => ({}))) as { jwt?: string; user?: any };
      if (body.jwt) {
        setSession(cookies, body.jwt, body.user);
        if (body.user?.email) cookies.set('email', String(body.user.email), { ...signupCookieOptions(url), httpOnly: false });
        throw redirect(303, next);
      }
    }
    if (res && res.status === 400) return fail(400, { state: 'spent' as const });

    // 2. The route is not there (yet): the stock confirmation, then log in.
    const outcome = await confirmOnly(fetch, token);
    if (outcome !== 'ok') return fail(outcome === 'spent' ? 400 : 502, { state: outcome });
    // Remember the address so the login form can prefill it — only here, where
    // a valid single-use token proves the visitor holds the mailbox.
    if (email) cookies.set('email', email, { ...signupCookieOptions(url), httpOnly: false });
    if (cookies.get('jwt')) throw redirect(303, next);
    throw redirect(303, loginFor(next));
  },

  resend: async ({ request, cookies, fetch }) => {
    const data = await request.formData();
    const email = String(data.get('email') || cookies.get('email') || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return fail(400, { resent: false });
    }

    try {
      const res = await fetch('/api/auth/send-email-confirmation', {
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
