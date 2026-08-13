/**
 * Stale-session handling for hooks.server.js.
 *
 * A member who has not visited for months still carries the `jwt` cookie — it
 * is set with a one-year expiry — long after the Strapi token inside it died.
 * Every layer below then *believes* there is a session and fails: /api/send
 * answers 401, a load that doesn't catch it leaves its page data null, and the
 * page template dereferences it into a bare 500 with nothing the visitor can do.
 *
 * Deciding once, at the edge, that an expired token means "signed out" is what
 * keeps every page below on its normal guest path.
 */

/** Cookies dropped when the session is dead. `email` stays — it prefills /login. */
export const AUTH_COOKIES = ['jwt', 'id', 'un', 'when'];

/** Tolerance for clock skew between this server and Strapi. */
const SKEW_MS = 30_000;

/**
 * Decode a JWT payload **without verifying it**. Only the `exp` claim is read,
 * and only to decide whether the cookie is still worth sending — Strapi remains
 * the sole authority on whether a token is genuinely valid.
 *
 * @param {string} token
 * @returns {Record<string, any> | null} the payload, or null if unreadable
 */
export function decodeJwtPayload(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * True only when the token **provably** expired. An unreadable token, or one
 * with no `exp`, is left alone: better a downstream 401 than signing out a valid
 * session over a decoding quirk.
 *
 * @param {string | false | undefined} token
 * @param {number} [now] - epoch ms, injectable for tests
 */
export function isExpiredJwt(token, now = Date.now()) {
  if (!token) return false;
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return false;
  return exp * 1000 <= now - SKEW_MS;
}

/**
 * Every domain scope /login may have written the auth cookies to. Deleting all
 * of them is safe here precisely because nothing is being *set* in the same
 * response — see the RFC 6265 note in src/routes/login/+page.server.js for why
 * mixing a delete and a set on the same scope is not.
 *
 * @param {string} hostname
 */
export function authCookieScopes(hostname) {
  const onOwnDomain = hostname === '1lev1.com' || hostname.endsWith('.1lev1.com');
  return [
    { path: '/' },
    ...(onOwnDomain
      ? [
          { path: '/', domain: '.1lev1.com' },
          { path: '/', domain: 'www.1lev1.com' }
        ]
      : [])
  ];
}

/**
 * Does this `/api/send` outcome mean "your token is no good"?
 *
 * A visitor whose JWT expired, or whose auth cookies were written on a domain
 * scope this host cannot read, gets exactly this: a 401 (which `sendToSer`
 * re-throws as `Unauthorized`) or a GraphQL `Invalid token.`. On a **public**
 * page that is not a reason to fail — it is a reason to re-read as the service
 * and render the signed-out view.
 *
 * @param {any} res - parsed /api/send response, if one came back
 * @param {any} [err] - error thrown while fetching
 */
export function isAuthFailure(res, err) {
  const errMsg = err instanceof Error ? err.message : '';
  if (/unauthorized|invalid token|forbidden|\b401\b|\b403\b/i.test(errMsg)) return true;

  const status = res?.error?.status;
  if (status === 401 || status === 403) return true;
  if (res?.error?.name === 'UnauthorizedError') return true;

  if (Array.isArray(res?.errors)) {
    return res.errors.some((e) => {
      const m = String(e?.message ?? '');
      return (
        m === 'Invalid token.' ||
        e?.extensions?.code === 'UNAUTHENTICATED' ||
        m.includes('401') ||
        m.includes('Unauthorized') ||
        m.includes('Forbidden')
      );
    });
  }
  return false;
}

/**
 * Drop the dead auth cookies from the browser.
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export function clearStaleAuthCookies(event) {
  for (const scope of authCookieScopes(event.url.hostname)) {
    for (const name of AUTH_COOKIES) {
      try {
        event.cookies.delete(name, scope);
      } catch {
        // a scope the browser never had — nothing to clean up
      }
    }
  }
}
