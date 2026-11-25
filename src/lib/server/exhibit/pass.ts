/**
 * The kiosk pass for /exhibit (docs/inprogress/PLAN_EXHIBITION_MODE.md §2.1.5).
 *
 * A fair stand is one IP address for every visitor, so the public 3-an-hour
 * limit of /api/vision-preview would starve it within minutes. The stand is
 * opened once at `/exhibit?key=<EXHIBIT_KEY>`; the page sets an HttpOnly
 * cookie holding a hash of the key (never the key), and the endpoint gives a
 * request carrying it the exhibit quota instead of the per-address one.
 *
 * No EXHIBIT_KEY (or a short one) ⇒ no pass can exist, and the kiosk answers
 * every free-text idea from its local templates.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export const EXHIBIT_COOKIE = 'exhibit_pass';
const MIN_KEY = 12;

function hashOf(key: string): string {
  return createHash('sha256').update(`1lev1-exhibit:${key}`).digest('base64url');
}

/** The cookie value the configured key yields, or null when none is configured. */
export function expectedPass(key: string | undefined = env.EXHIBIT_KEY): string | null {
  return key && key.length >= MIN_KEY ? hashOf(key) : null;
}

/** Does `?key=` open the kiosk? */
export function keyOpensPass(candidate: string | null | undefined, key: string | undefined = env.EXHIBIT_KEY): boolean {
  const want = expectedPass(key);
  return !!want && !!candidate && safeEqual(hashOf(candidate), want);
}

/** Does this cookie value carry the pass? */
export function isExhibitPass(cookie: string | null | undefined, key: string | undefined = env.EXHIBIT_KEY): boolean {
  const want = expectedPass(key);
  return !!want && !!cookie && safeEqual(cookie, want);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
