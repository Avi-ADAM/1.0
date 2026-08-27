import { redirect, fail } from '@sveltejs/kit';
import { importInvitedMeeting } from '$lib/server/importInvitedMeeting.js';

import { signupCookieOptions } from '$lib/server/signupCookies.js';

export async function load({ cookies, url }) {
  const opts = signupCookieOptions(url);

  // /hascama also passes the signatory id (and name/countries) in the URL,
  // because a cookie written by the browser does not always survive the hop —
  // see signupCookies.js. Re-seat whatever is missing so the action below and
  // the page's own cookie readers find it.
  let fpval = cookies.get('fpval');
  const fromUrl = url.searchParams.get('fp');
  if (!fpval && fromUrl) {
    fpval = fromUrl;
    cookies.set('fpval', fromUrl, { ...opts, httpOnly: true });
  }

  if (!fpval) {
    throw redirect(302, '/hascama');
  }

  for (const [param, name] of [
    ['un', 'un'],
    ['con', 'country']
  ]) {
    const value = url.searchParams.get(param);
    if (value && !cookies.get(name)) {
      cookies.set(name, value, { ...opts, httpOnly: false });
    }
  }
}

export const actions = {
  default: async ({ request, cookies, fetch, url }) => {
    const data = await request.formData();
    const email = String(data.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(data.get('password') || '');
    const displayName = String(
      data.get('displayName') || cookies.get('un') || ''
    ).trim();

    // The form posts back to this same URL, so the ?fp=/&con= fallback from
    // load() is still available if the cookie never stuck.
    const fpval = cookies.get('fpval') || url.searchParams.get('fp') || '';
    const countryCookie =
      cookies.get('country') || url.searchParams.get('con') || '';
    const countries = countryCookie
      ? countryCookie
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    if (!email || !password) {
      return fail(400, { error: 'נא למלא את כל השדות' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password)) {
      return fail(400, {
        error: 'הסיסמה חייבת להכיל לפחות 8 תווים ואות גדולה באנגלית'
      });
    }

    const username = displayName
      ? displayName.trim()
      : `${(email.split('@')[0] || 'u').trim()}_${Math.floor(Math.random() * 9999)}`;

    try {
      const registerBody = { username, email, password };
      if (displayName) registerBody.name = displayName;
      if (fpval) registerBody.chezin = fpval;
      if (countries.length > 0) registerBody.cuntries = countries;

      // Through our own auth proxy — never straight at Strapi. As an internal
      // caller this action gets the jwt back in the body and sets the session
      // cookie itself, below.
      const res = await fetch('/api/auth/local/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerBody)
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message || 'שגיאה ברישום';
        if (
          msg.toLowerCase().includes('already taken') ||
          msg.toLowerCase().includes('already exist')
        ) {
          return fail(400, {
            error: 'כתובת המייל כבר רשומה במערכת. נסו להתחבר.'
          });
        }
        return fail(400, { error: msg });
      }

      const { jwt, user } = await res.json();

      const isProduction = import.meta.env.PROD;
      const cookieOptions = {
        path: '/',
        expires: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        secure: isProduction,
        sameSite: /** @type {'none' | 'lax'} */ (isProduction ? 'none' : 'lax'),
        domain: isProduction ? '.1lev1.com' : undefined
      };

      // With email confirmation enabled, Strapi's register returns no jwt —
      // the user gets one only after confirming. Setting it unconditionally
      // wrote the literal string "undefined" into the cookie, which then looks
      // like a session to everything downstream: SocketClient immediately tried
      // to authenticate with it and logged "Invalid or expired JWT" on the very
      // first screen after signup.
      if (jwt) {
        cookies.set('jwt', jwt, { ...cookieOptions, httpOnly: true });
      }
      cookies.set('id', String(user.id), { ...cookieOptions, httpOnly: false });
      cookies.set('un', user.name || displayName || user.username, {
        ...cookieOptions,
        httpOnly: false
      });
      cookies.set('when', Date.now().toString(), {
        ...cookieOptions,
        httpOnly: false
      });
      cookies.set('email', email, { ...cookieOptions, httpOnly: false });
      cookies.set('guidMe', 'again', { ...cookieOptions, httpOnly: false });

      // If the user arrived from an email-bound meeting invitation
      // (/hascama?invite=<token>), import that meeting into the new account.
      // Best-effort: signup must not fail if the import does.
      const inviteToken = cookies.get('invite_token');
      if (inviteToken) {
        try {
          await importInvitedMeeting(
            inviteToken,
            String(user.id),
            email,
            fetch
          );
        } catch (err) {
          console.error('[signup] invited-meeting import failed:', err);
        }
        cookies.delete('invite_token', { path: '/' });
      }

      throw redirect(303, '/signup/check-email');
    } catch (err) {
      if (/** @type {any} */ (err)?.status === 303) throw err;
      return fail(400, {
        error: /** @type {any} */ (err)?.message || 'שגיאה לא ידועה, נסו שוב'
      });
    }
  }
};
