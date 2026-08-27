/**
 * Guest invitation tokens — verification only.
 *
 * A meeting guest has no 1lev1 account and therefore no JWT, so the cookie
 * handshake in index.ts has nothing to check. What they do have is the signed
 * link that let them in: an HMAC-SHA256 token minted by the meetings app
 * (magik-meetings) and also verifiable by the main app. Because the payload is
 * signed, this server can trust the meeting id inside it without asking anyone.
 *
 * Token shape:  base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 * Payload:      { v, m: meetingId, e: email, n: meetingName, exp: epochMs }
 *
 * This is the same derivation as `1.0main/src/lib/server/guestInvite.ts` and
 * `magik-meetings/src/lib/server/guestInvite.js`. GUEST_INVITE_SECRET must hold
 * the same value in all three, or guest sockets simply never authenticate.
 *
 * Minting deliberately lives elsewhere: this server only ever needs to check.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface GuestInvite {
  meetingId: string;
  email: string | null;
  meetingName: string | null;
  expiresAt: number;
}

export type GuestInviteResult =
  | { valid: true; invite: GuestInvite }
  | { valid: false; error: 'unconfigured' | 'malformed' | 'signature' | 'expired' };

function getSecret(): string | undefined {
  const raw = process.env.GUEST_INVITE_SECRET;
  return raw && raw.trim() !== '' ? raw : undefined;
}

/** A signed token contains exactly one "." — anything else is not one. */
export function isSignedToken(token: unknown): token is string {
  return typeof token === 'string' && token.split('.').length === 2;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

/** Constant-time compare that does not leak length through an exception. */
function signaturesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Verify a guest invitation token and read the meeting out of it.
 *
 * Fails closed: with no GUEST_INVITE_SECRET configured, every token is
 * rejected rather than trusted. Unlike the JWT path in auth.ts, there is no
 * "skip verification in development" mode — an unsigned meeting id would let
 * anyone subscribe to any meeting's notifications.
 */
export function verifyInviteToken(token: unknown): GuestInviteResult {
  const secret = getSecret();
  if (!secret) return { valid: false, error: 'unconfigured' };
  if (!isSignedToken(token)) return { valid: false, error: 'malformed' };

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return { valid: false, error: 'malformed' };

  if (!signaturesMatch(sign(payloadB64, secret), signature)) {
    return { valid: false, error: 'signature' };
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, error: 'malformed' };
  }

  const meetingId = payload?.m == null ? '' : String(payload.m);
  const expiresAt = Number(payload?.exp);
  if (!meetingId || !Number.isFinite(expiresAt)) {
    return { valid: false, error: 'malformed' };
  }
  if (expiresAt <= Date.now()) {
    return { valid: false, error: 'expired' };
  }

  return {
    valid: true,
    invite: {
      meetingId,
      email: payload?.e ? String(payload.e) : null,
      meetingName: payload?.n ? String(payload.n) : null,
      expiresAt
    }
  };
}

/** The room every guest of a meeting sits in. */
export function meetingRoom(meetingId: string): string {
  return `meeting:${meetingId}`;
}
