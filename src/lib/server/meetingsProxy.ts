/**
 * Authentication for the meetings app (magik-meetings, meetings.1lev1.com).
 *
 * meetings.1lev1.com is a thin front-end that proxies to this API. Almost
 * everything it does travels on the visitor's own JWT — but a *guest*, invited
 * to a single meeting by a signed link, has no 1lev1 account and therefore no
 * JWT at all. Their meeting page still has to render: the meeting's name, who
 * else is on it, the chat.
 *
 * The meetings server proves it is the meetings server with a shared secret in
 * `x-meetings-secret`, and this API then reads Strapi on its behalf with its
 * own service token. Deliberately NOT the `isSer` + `x-internal-secret` path:
 * that header is derived from ADMINMONTHER, so honouring it there would mean
 * keeping the platform's admin token in a second deployment, and it would
 * grant that deployment every serviceAdmin qid. This secret is its own value,
 * it never unlocks a Strapi token outside this app, and what it may run is
 * pinned in qidsAccess.js — today, the meeting read and nothing else.
 *
 * Set MEETINGS_PROXY_SECRET to the same value in both apps. Unset here, the
 * header is simply never recognized: guests degrade to a name-only meeting
 * rather than anything opening up.
 */

import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'node:crypto';

export const MEETINGS_HEADER = 'x-meetings-secret';

function normalize(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/^MEETINGS_PROXY_SECRET=/, '');
}

/** Length-safe constant-time comparison. */
function secretsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // length — compare against a same-length buffer and fold the real answer in.
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * @returns true when the request carries the meetings app's shared secret.
 *   Always false when MEETINGS_PROXY_SECRET is not configured.
 */
export function isMeetingsRequest(request: Request): boolean {
  const expected = normalize(env.MEETINGS_PROXY_SECRET);
  if (!expected) return false;

  const incoming = normalize(request.headers.get(MEETINGS_HEADER));
  if (!incoming) return false;

  return secretsMatch(expected, incoming);
}
