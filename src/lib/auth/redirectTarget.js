/**
 * Which `?from=` values /login may send a browser to.
 *
 * After a successful sign-in the login page does `window.location.href = from`.
 * Unchecked, that turns /login into an open redirect: `/login?from=https://evil.example`
 * carries the visitor off the instant they finish typing their password, from a
 * page that genuinely was ours — which is the whole trick.
 *
 * Two shapes are legitimate:
 *
 *   - a path inside this app (`lev/123`, `/onboard?x=1`) — what hooks.server.js,
 *     ErrorScreen and SessionExpiredBanner ask for when they want a way back;
 *   - an absolute url on the 1lev1 family of hosts — how a sister app
 *     (meetings.1lev1.com) hands over a visitor whose session it cannot renew
 *     itself. It has to be the full url: the value is used verbatim, so a bare
 *     `meetings.1lev1.com` would resolve against www.1lev1.com and 404.
 *
 * Everything else falls back to the normal landing page.
 */

/** Where a missing or rejected `from` lands. */
export const DEFAULT_REDIRECT = '/onboard';

/**
 * Hosts a signed-in visitor may be handed to. The dot in the suffix matters:
 * it is what keeps `evil1lev1.com` and `1lev1.com.evil.example` out.
 *
 * @param {string} hostname
 */
function isOwnHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === '1lev1.com' ||
    host.endsWith('.1lev1.com') ||
    // Local development, where the sister app runs on another port. Sending a
    // visitor to their own machine is not a phishing vector.
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}

/**
 * Reduce a `from` value to something safe to navigate to.
 *
 * @param {unknown} from - the raw `?from=` / form value
 * @param {string} [fallback] - used when `from` is missing or not allowed
 * @returns {string} a path relative to this app, or an absolute url on a 1lev1 host
 */
export function safeRedirectTarget(from, fallback = DEFAULT_REDIRECT) {
  if (typeof from !== 'string') return fallback;

  const value = from.trim();
  if (!value) return fallback;

  // `//evil.example` and `/\evil.example` are protocol-relative urls, not paths —
  // browsers read both slash characters the same way here, so both are refused.
  if (/^[\/\\]{2}/.test(value) || value.startsWith('\\')) return fallback;

  // A scheme means an absolute url. Anything else is a path, and a path can only
  // ever resolve against this origin.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return fallback;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
  return isOwnHost(url.hostname) ? url.href : fallback;
}
