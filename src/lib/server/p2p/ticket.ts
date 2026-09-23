/**
 * Room tickets for the P2P pilot (docs/PLAN_P2P_PILOT.md §2).
 *
 * The socket server cannot ask Strapi who is in a rikma — it has no access to
 * it, on purpose. So this app, which can, checks membership and hands the
 * browser a short-lived signed statement "user U may sit in rikma P's room
 * until T". The socket server only verifies the signature and that U is the
 * socket's own authenticated user. Same shape as the meeting guest invite
 * (`guestInvite.ts` / `socket-server/src/guest-invite.ts`).
 *
 * Token:   base64url(JSON {v:1, u, p, exp}) + "." + base64url(HMAC-SHA256)
 * Secret:  P2P_TICKET_SECRET — must be the same value here and in socket-server.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** Long enough for a working session; a member who leaves is out within the hour. */
export const TICKET_TTL_MS = 60 * 60 * 1000;

export function p2pTicketSecret(): string | null {
  const raw = (env.P2P_TICKET_SECRET || '').trim();
  return raw.length >= 16 ? raw : null;
}

const sign = (payloadB64: string, secret: string) =>
  createHmac('sha256', secret).update(payloadB64).digest('base64url');

export function mintTicket(
  uid: string,
  projectId: string,
  secret: string,
  now = Date.now(),
  ttl = TICKET_TTL_MS
): { ticket: string; expiresAt: number } {
  const expiresAt = now + ttl;
  const payload = Buffer.from(JSON.stringify({ v: 1, u: String(uid), p: String(projectId), exp: expiresAt })).toString(
    'base64url'
  );
  return { ticket: `${payload}.${sign(payload, secret)}`, expiresAt };
}

/** Verification twin — the socket server has its own copy; this one is for tests and parity. */
export function readTicket(
  ticket: string,
  secret: string,
  now = Date.now()
): { uid: string; projectId: string; expiresAt: number } | null {
  const [payload, mac] = String(ticket).split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (p?.v !== 1 || !p.u || !p.p || !(Number(p.exp) > now)) return null;
    return { uid: String(p.u), projectId: String(p.p), expiresAt: Number(p.exp) };
  } catch {
    return null;
  }
}

/**
 * ICE servers for the browser. Public STUN by default — which is exactly what
 * the pilot is measuring: how far we get *without* paying for TURN. A TURN
 * entry can be added through P2P_ICE_SERVERS (JSON RTCIceServer[]) with no
 * code change; its credentials then reach members' browsers, so use
 * short-lived TURN credentials, never a static password.
 */
export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' }
];

export function iceServers(): Array<{ urls: string | string[]; username?: string; credential?: string }> {
  const raw = (env.P2P_ICE_SERVERS || '').trim();
  if (!raw) return DEFAULT_ICE_SERVERS;
  try {
    const parsed = JSON.parse(raw);
    const ok =
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (s) =>
          s &&
          (typeof s.urls === 'string' || (Array.isArray(s.urls) && s.urls.every((u: unknown) => typeof u === 'string')))
      );
    return ok ? parsed : DEFAULT_ICE_SERVERS;
  } catch {
    return DEFAULT_ICE_SERVERS;
  }
}
