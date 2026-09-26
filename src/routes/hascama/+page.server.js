import {
  isConciergeIntent,
  REG_INTENT_COOKIE,
  REG_NEXT_COOKIE,
  setConciergeIntent
} from '$lib/concierge/regIntent.js';
import { safeRedirectTarget } from '$lib/auth/redirectTarget.js';

/**
 * Capture an email-bound guest invitation token off the register link.
 *
 * The meetings app sends invited guests to `/hascama?invite=<signed-token>`.
 * The onboarding UI is client-driven and hops through /signup, so we stash the
 * token in a short-lived cookie here; the signup action consumes it after the
 * account is created and imports the meeting (see importInvitedMeeting).
 *
 * `?intent=concierge` marks a customer who came to order something: the
 * agreement is still theirs to sign, but after the email confirmation they go
 * straight to their wish instead of the onboarding (see regIntent.js).
 */
export async function load({ url, cookies, fetch }) {
  // An agent-prepared signup (PLAN_AI_SIGNUP_CONCIERGE §5.3): the agreement
  // and the password on one screen, prefilled from what the person told their
  // agent. The token is opened on the VPS (its key lives only there); an
  // expired or broken one simply means the ordinary agreement below.
  const agentToken = url.searchParams.get('agent');
  let agent = null;
  if (agentToken) {
    try {
      const res = await fetch(`/api/assistant/signup-token?t=${encodeURIComponent(agentToken)}`);
      const body = res.ok ? await res.json() : null;
      if (body?.ok) agent = { token: agentToken, prefill: body.prefill };
    } catch {
      agent = null;
    }
  }

  // Where to return after the email confirmation — the consent page of an
  // agent's OAuth window (PLAN_AI_SIGNUP_CONCIERGE §5.2). A path of ours only.
  const next = safeRedirectTarget(url.searchParams.get('next'), '');
  if (next.startsWith('/') && !next.startsWith('//')) {
    cookies.set(REG_NEXT_COOKIE, next, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 60 * 60 * 24
    });
  }

  const invite = url.searchParams.get('invite');
  if (invite) {
    cookies.set('invite_token', invite, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour — long enough to finish signup
    });
  }

  let concierge = isConciergeIntent(cookies.get(REG_INTENT_COOKIE));
  if (isConciergeIntent(url.searchParams.get('intent'))) {
    setConciergeIntent(cookies, url);
    concierge = true;
  }
  return { concierge, agent };
}
