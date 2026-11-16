/**
 * The one place an address a member typed becomes a link we send people to
 * (docs/inprogress/PLAN_RIKMA_VISIBILITY.md §4.6).
 *
 * `Project.linkToWebsite` is free text: some rikmas saved `my-cafe.co.il`, which
 * an `<a href>` reads as a path on this site. So a bare domain gets `https://`;
 * anything that is not http(s) — `javascript:`, `data:`, `mailto:` — is refused,
 * and so is an address carrying a user name or password (`https://a@b`), the
 * shape a look-alike link hides behind.
 */

export const EXTERNAL_URL_MAX = 500;

/** A host-shaped string: at least one dot, a TLD of letters, no spaces. */
const BARE_HOST = /^[a-z0-9¡-￿-]+(\.[a-z0-9¡-￿-]+)*\.[a-z¡-￿]{2,}(:\d+)?([/?#].*)?$/i;

export function normalizeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || s.length > EXTERNAL_URL_MAX) return null;

  // No dot in the scheme, or `www.example.com:8080` would read as one.
  const hasScheme = /^[a-z][a-z0-9+-]*:/i.test(s);
  let candidate: string;
  if (hasScheme) {
    candidate = s;
  } else if (s.startsWith('//')) {
    candidate = `https:${s}`;
  } else if (BARE_HOST.test(s)) {
    candidate = `https://${s}`;
  } else {
    return null;
  }

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;
  if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null;
  return u.href;
}

/** What every outbound link carries: a new tab, no opener, no endorsement. */
export const EXTERNAL_LINK_REL = 'noopener noreferrer nofollow ugc';
