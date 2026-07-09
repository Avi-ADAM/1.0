/**
 * Verification for email-bound guest invitation tokens minted by the meetings
 * app (magik-meetings `src/lib/server/guestInvite.js`).
 *
 * The meetings app signs a self-contained token so a guest can be invited by
 * email without any upstream write. After the invited person registers here on
 * the main site, we verify that same token and import the meeting into their
 * new account — but only if the token's signature is valid, it hasn't expired,
 * and the registered email matches the invited email.
 *
 * IMPORTANT: `GUEST_INVITE_SECRET` must be set to the *same* value in both this
 * app and the meetings app, otherwise signatures won't match. The dev fallback
 * is shared verbatim between the two.
 */

import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

const SECRET =
  env.GUEST_INVITE_SECRET || 'dev-only-insecure-guest-invite-secret-change-me';

/** @param payloadB64 base64url-encoded payload */
function sign(payloadB64: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(payloadB64)
    .digest('base64url');
}

/** A signed token is `base64url(payload).base64url(signature)`. */
export function isSignedToken(token: unknown): token is string {
  return typeof token === 'string' && token.split('.').length === 2;
}

export interface InvitePayload {
  meetingId: string;
  email: string;
  meetingName: string;
  expiresAt: string;
}

export interface VerifyResult {
  valid: boolean;
  error?: 'unsigned' | 'bad_signature' | 'malformed' | 'expired';
  payload?: InvitePayload;
}

/** Verify and decode a signed invitation token. */
export function verifyInviteToken(token: string): VerifyResult {
  if (!isSignedToken(token)) {
    return { valid: false, error: 'unsigned' };
  }

  const [payloadB64, sig] = token.split('.');

  // Constant-time signature comparison.
  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return { valid: false, error: 'bad_signature' };
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, error: 'malformed' };
  }

  if (!payload || !payload.m || !payload.e || !payload.exp) {
    return { valid: false, error: 'malformed' };
  }

  if (Date.now() > Number(payload.exp)) {
    return { valid: false, error: 'expired' };
  }

  return {
    valid: true,
    payload: {
      meetingId: String(payload.m),
      email: String(payload.e),
      meetingName: payload.n || '',
      expiresAt: new Date(Number(payload.exp)).toISOString()
    }
  };
}
