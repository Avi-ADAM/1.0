// src/lib/server/csrf.js
//
// SvelteKit's cross-site form check, moved into our own hook so it can have an
// exemption list. Kit's built-in check (`csrf.trustedOrigins`) runs before
// `handle` and applies to every route with no per-route escape, and it refuses
// any form-encoded POST whose Origin header is absent — which is exactly what an
// OAuth client's back-channel token request looks like (RFC 6749 §4.1.3 mandates
// `application/x-www-form-urlencoded`, and a server-to-server call has no
// Origin). With the built-in check on, claude.ai's code exchange at /oauth/token
// got `403 Cross-site POST form submissions are forbidden` after the user had
// already approved — see docs/PLAN_MCP_OAUTH.md.
//
// svelte.config.js sets `trustedOrigins: ['*']` to turn the built-in check off;
// `csrfRejection()` below reproduces it byte for byte for everything else.

/** Content types a browser form can send cross-site without a preflight. */
const FORM_CONTENT_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/x-sveltekit-formdata'
];

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Origins allowed to submit forms to this app from another origin. */
export const TRUSTED_ORIGINS = [
  'https://www.1lev1.com',
  'https://1lev1.com',
  'https://app.1lev1.com',
  'http://dev.1lev1.com:5173',
  'http://localhost:5173'
];

/**
 * Routes that are called back-channel by other servers and carry no cookie
 * authority, so a cross-site form post to them forges nothing. Keep this list
 * to endpoints that never read the session.
 */
export const CSRF_EXEMPT_PATHS = new Set(['/oauth/token']);

/**
 * @param {Request} request
 * @returns {boolean}
 */
function isFormContentType(request) {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
  return FORM_CONTENT_TYPES.includes(type);
}

/**
 * The 403 SvelteKit would have returned, or `null` when the request may proceed.
 *
 * @param {Request} request
 * @param {URL} url
 * @returns {Response | null}
 */
export function csrfRejection(request, url) {
  if (!UNSAFE_METHODS.has(request.method)) return null;
  if (!isFormContentType(request)) return null;
  if (CSRF_EXEMPT_PATHS.has(url.pathname)) return null;

  const origin = request.headers.get('origin');
  if (origin === url.origin) return null;
  if (origin && TRUSTED_ORIGINS.includes(origin)) return null;

  const message = `Cross-site ${request.method} form submissions are forbidden`;
  if (request.headers.get('accept') === 'application/json') {
    return new Response(JSON.stringify({ message }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(message, { status: 403 });
}
