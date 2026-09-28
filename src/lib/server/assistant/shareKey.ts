/**
 * The key in a rikma preview link, /preview/rikma/<key>
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.4).
 *
 * `<sessionId>.<HMAC(sessionId | shareExpiresAt)>`. The row is loaded by id and
 * the signature checked against the expiry stored on it, so nothing is ever
 * looked up by the key itself. That is the point: the first version stored a
 * random `shareKey` in a private Strapi field and filtered on it, and Strapi's
 * content API does not filter on private fields — every link was a 404.
 *
 * Rotation and revocation fall out of the expiry: a new link writes a new
 * `shareExpiresAt`, which invalidates every key signed over the old one, and
 * revoking clears it. The id in the link says only that a draft with that
 * number exists; without the signature it opens nothing.
 */

import crypto from 'crypto';
import { previewShareKey, b64url, safeEqual } from '$lib/server/oauth/secret.js';

const KEY_RE = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/;

function mac(id: string, expiresAt: string, secret: Buffer): string {
  const ms = new Date(expiresAt).getTime();
  return b64url(crypto.createHmac('sha256', secret).update(`${id}|${ms}`).digest());
}

export function mintShareKey(id: string, expiresAt: string, secret: Buffer = previewShareKey()): string {
  return `${id}.${mac(String(id), expiresAt, secret)}`;
}

/** The session id a well-formed key names, or null — before any signature check. */
export function shareKeyId(key: unknown): string | null {
  if (typeof key !== 'string') return null;
  return KEY_RE.exec(key)?.[1] ?? null;
}

/** Whether `key` was signed for this row's current expiry. */
export function verifyShareKey(
  key: string,
  row: { id: string; shareExpiresAt: string | null },
  secret: Buffer = previewShareKey()
): boolean {
  const m = KEY_RE.exec(key);
  if (!m || !row.shareExpiresAt || m[1] !== String(row.id)) return false;
  if (Number.isNaN(new Date(row.shareExpiresAt).getTime())) return false;
  return safeEqual(m[2], mac(m[1], row.shareExpiresAt, secret));
}

/**
 * The expiry for a new link. Always later than the current one, so two links
 * made in the same millisecond still differ and the new one replaces the old.
 */
export function nextShareExpiry(current: string | null, now: Date, days: number): string {
  const fresh = now.getTime() + days * 86_400_000;
  const prev = current ? new Date(current).getTime() : NaN;
  return new Date(Number.isNaN(prev) ? fresh : Math.max(fresh, prev + 1)).toISOString();
}
