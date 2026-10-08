/**
 * Shared-secret check for the server-to-server HTTP endpoints.
 *
 * `/broadcast` and `/space-changed` are reached through socket.1lev1.com, which
 * nginx exposes to the whole internet so browsers can open their sockets. Left
 * unguarded, anyone could push a notification - any title, any link - to any
 * user id. Only the SvelteKit server (Vercel and the VPS api container) and
 * the relay may call them, and they prove it with SOCKET_BROADCAST_SECRET in
 * the `x-socket-secret` header.
 *
 * Fails closed: with no secret configured, nothing gets in. A missing env must
 * mean "no realtime pushes", never "pushes from anyone".
 *
 * The same value must be set in the main app (1.0main, `SOCKET_BROADCAST_SECRET`)
 * or every push is refused and realtime falls back to polling.
 */

import { timingSafeEqual } from 'crypto';
import type { IncomingMessage } from 'http';

export const INTERNAL_SECRET_HEADER = 'x-socket-secret';

export type InternalAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function getSecret(): string | undefined {
  const raw = process.env.SOCKET_BROADCAST_SECRET;
  return raw && raw.trim() !== '' ? raw.trim() : undefined;
}

export function isInternalAuthConfigured(): boolean {
  return getSecret() !== undefined;
}

/** Constant-time compare that does not leak length through an exception. */
function secretsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function checkInternalRequest(req: Pick<IncomingMessage, 'headers'>): InternalAuthResult {
  const secret = getSecret();
  if (!secret) {
    return { ok: false, status: 503, error: 'SOCKET_BROADCAST_SECRET is not configured' };
  }

  const raw = req.headers[INTERNAL_SECRET_HEADER];
  const presented = Array.isArray(raw) ? raw[0] : raw;
  if (typeof presented !== 'string' || !secretsMatch(presented, secret)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}
