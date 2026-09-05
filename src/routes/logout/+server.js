import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIES, authCookieScopes } from '$lib/server/session.js';

/**
 * Cookies dropped on an explicit sign-out.
 *
 * `AUTH_COOKIES` (jwt, id, un, when) is what a dead session sheds by itself;
 * signing out on purpose also drops the identity crumbs a shared browser should
 * not keep — `email` (which otherwise prefills /login for the *previous* user),
 * the signup funnel's `fpval`/`country`, and any pending `invite_token`.
 * `lang`, theme and the other preferences survive: they are not identity.
 */
const LOGOUT_COOKIES = [
  ...AUTH_COOKIES,
  'email',
  'fpval',
  'country',
  'invite_token',
  'guidMe'
];

/**
 * Clear the session server-side.
 *
 * The client cannot do this on its own: `jwt` is HttpOnly, so
 * `document.cookie = 'jwt=;…'` is a no-op, and the cookies written on the
 * `.1lev1.com` / `www.1lev1.com` domain scopes are invisible to a host-only
 * delete. The sign-out button used to do exactly that and left the visitor
 * signed in.
 *
 * Deleting every scope in one response is safe here precisely because nothing
 * is being *set* alongside it — see the RFC 6265 note in
 * `src/routes/login/+page.server.js` for why mixing the two is not.
 *
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} hostname
 */
function clearSession(cookies, hostname) {
  for (const scope of authCookieScopes(hostname)) {
    for (const name of LOGOUT_COOKIES) {
      try {
        cookies.delete(name, scope);
      } catch {
        // a scope the browser never had — nothing to clean up
      }
    }
  }
}

/**
 * POST /logout — used by the sign-out button, which then does a full
 * `location.href` navigation so no client-side store survives.
 * @type {import('./$types').RequestHandler}
 */
export function POST({ cookies, url }) {
  clearSession(cookies, url.hostname);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

/**
 * GET /logout — plain-link fallback (JS off, or a link from elsewhere).
 * Redirects home; `?to=` may name an in-app path such as `/login`.
 * @type {import('./$types').RequestHandler}
 */
export function GET({ cookies, url }) {
  clearSession(cookies, url.hostname);
  const to = url.searchParams.get('to');
  throw redirect(303, to && to.startsWith('/') && !to.startsWith('//') ? to : '/');
}
