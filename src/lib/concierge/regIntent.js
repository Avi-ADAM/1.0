/**
 * "This person is registering to order something" — carried through signup.
 *
 * A customer who came for the concierge has one required step, the agreement,
 * and none of the onboarding after it (roles, skills, CV, resources): that is
 * for people joining rikmas, not for someone who wants a product. So the
 * intent rides a cookie from the first registration screen to the email
 * confirmation, which then lands them on the wish composer instead of
 * /onboard.
 *
 * A cookie rather than a `?from=`: the chain crosses a server redirect
 * (/convention → /hascama), a client `goto` inside the agreement, a form post
 * and a link opened from a mailbox, and a query parameter has to be re-threaded
 * through every one of them by hand. Not httpOnly, because it is not a secret
 * and the client-rendered signup screens word themselves by it.
 */

export const REG_INTENT_COOKIE = 'reg_intent';
export const CONCIERGE_INTENT = 'concierge';

/** Where a registered customer continues. */
export const CONCIERGE_LANDING = '/concierge/new?welcome=1';

/** A week: an email confirmation left for the weekend still lands right. */
const MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Set once the customer has arrived: where a later sign-in without a `?from=`
 * lands. The default is /onboard, which is exactly the flow this track skips.
 */
export const CUSTOMER_TRACK_COOKIE = 'track';
export const CUSTOMER_HOME = '/concierge';

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {URL} url
 */
export function markCustomerTrack(cookies, url) {
  cookies.set(CUSTOMER_TRACK_COOKIE, CONCIERGE_INTENT, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 365
  });
}

/**
 * Where sign-in goes when nothing asked for a destination.
 *
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} fallback
 */
export function signInHome(cookies, fallback) {
  return isConciergeIntent(cookies.get(CUSTOMER_TRACK_COOKIE))
    ? CUSTOMER_HOME
    : fallback;
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
export function isConciergeIntent(value) {
  return value === CONCIERGE_INTENT;
}

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {URL} url
 */
export function setConciergeIntent(cookies, url) {
  cookies.set(REG_INTENT_COOKIE, CONCIERGE_INTENT, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: MAX_AGE
  });
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export function clearConciergeIntent(cookies) {
  cookies.delete(REG_INTENT_COOKIE, { path: '/' });
}

/**
 * Client-side read, for the screens that render before any server data.
 *
 * @param {string} [cookieString] `document.cookie`
 */
export function hasConciergeIntentCookie(cookieString) {
  if (!cookieString) return false;
  return cookieString
    .split('; ')
    .some((c) => c === `${REG_INTENT_COOKIE}=${CONCIERGE_INTENT}`);
}
