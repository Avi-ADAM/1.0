/**
 * The key in a direct-offer link, /offer/<key> — docs/inprogress/PLAN_DIRECT_OFFER.md §6.
 *
 * `<ratsonId>.<HMAC(ratsonId | offer_link_at)>`, the pattern of the rikma preview
 * links (`$lib/server/assistant/shareKey.ts`): the wish is loaded by id and the
 * signature checked against the time the current link was issued, so nothing is
 * looked up by the key and no secret sits in the database. Issuing a new link
 * writes a new `offer_link_at`, which retires every key signed over the old one;
 * revoking clears it.
 *
 * The link opens a *view*. Everything else needs an account and the claim.
 *
 * `offer_expires_at` is honoured when set, but nothing sets it yet (decision 3:
 * links do not expire for now).
 */

import crypto from 'crypto';
import { directOfferEmailKey, directOfferLinkKey, b64url, safeEqual } from '$lib/server/oauth/secret.js';

const KEY_RE = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/;

function mac(id: string, linkAt: string, secret: Buffer): string {
  const ms = new Date(linkAt).getTime();
  return b64url(crypto.createHmac('sha256', secret).update(`${id}|${ms}`).digest());
}

export function mintOfferKey(id: string | number, linkAt: string, secret: Buffer = directOfferLinkKey()): string {
  return `${id}.${mac(String(id), linkAt, secret)}`;
}

/** The wish id a well-formed key names, or null — before any signature check. */
export function offerKeyId(key: unknown): string | null {
  if (typeof key !== 'string') return null;
  return KEY_RE.exec(key)?.[1] ?? null;
}

export interface OfferLinkRow {
  id: string | number;
  offer_link_at: string | null;
  offer_expires_at?: string | null;
}

export type OfferKeyCheck = 'ok' | 'invalid' | 'expired';

/**
 * Whether `key` opens this wish now. `invalid` covers a forged key, a key signed
 * for an earlier link and a revoked link alike — the page says the same thing for
 * all three, so a guess learns nothing. `expired` is a real link past its time:
 * the page offers to ask the provider for a fresh one.
 */
export function checkOfferKey(
  key: string,
  row: OfferLinkRow,
  now: Date = new Date(),
  secret: Buffer = directOfferLinkKey()
): OfferKeyCheck {
  const m = KEY_RE.exec(key);
  if (!m || !row.offer_link_at || m[1] !== String(row.id)) return 'invalid';
  if (Number.isNaN(new Date(row.offer_link_at).getTime())) return 'invalid';
  if (!safeEqual(m[2], mac(m[1], row.offer_link_at, secret))) return 'invalid';
  if (row.offer_expires_at) {
    const until = new Date(row.offer_expires_at).getTime();
    if (Number.isFinite(until) && now.getTime() > until) return 'expired';
  }
  return 'ok';
}

/** The issue time of a new link — always later than the current one, so it replaces it. */
export function nextLinkAt(current: string | null, now: Date): string {
  const prev = current ? new Date(current).getTime() : NaN;
  return new Date(Number.isNaN(prev) ? now.getTime() : Math.max(now.getTime(), prev + 1)).toISOString();
}

const normEmail = (email: string) => email.trim().toLowerCase();

/** What `offer_email_lock` stores for an address — never the address itself. */
export function emailLock(email: string, secret: Buffer = directOfferEmailKey()): string {
  return 'e1:' + b64url(crypto.createHmac('sha256', secret).update(normEmail(email)).digest());
}

/** Whether an account's email may claim an offer. No lock: anyone with the link. */
export function emailMayClaim(lock: string | null | undefined, email: string | null | undefined, secret: Buffer = directOfferEmailKey()): boolean {
  if (!lock) return true;
  if (!email) return false;
  return safeEqual(lock, emailLock(email, secret));
}
