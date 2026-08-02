/**
 * Cookie options for the pre-account handshake: /hascama (chezin) → /signup.
 *
 * These four values (`fpval`, `un`, `email`, `country`) used to be written
 * only from the browser with `document.cookie` and no attributes at all.
 * iOS Safari, in-app webviews (WhatsApp/Instagram/Facebook) and "block all
 * cookies" drop such writes silently — and `/signup`'s load refuses to run
 * without `fpval`, so the signatory bounced straight back to /hascama and got
 * stuck on an empty screen. Writing them from the server survives more of
 * those cases; the URL fallback in /signup's load covers the rest.
 *
 * @param {URL} url the request URL — decides `secure` and the cookie domain.
 */
export function signupCookieOptions(url) {
  return {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: /** @type {'lax'} */ ('lax'),
    secure: url.protocol === 'https:',
    // Share with the sister sub-domains, but only when we really are on
    // 1lev1.com — on a preview host that domain would void the cookie.
    domain: url.hostname.endsWith('1lev1.com') ? '.1lev1.com' : undefined
  };
}
