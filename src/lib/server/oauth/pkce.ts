// src/lib/server/oauth/pkce.ts
//
// PKCE (RFC 7636). Only S256 is accepted: `plain` gives a public client no
// protection at all, and every client that matters supports S256.

import crypto from 'crypto';
import { safeEqual } from './secret.js';

export const SUPPORTED_CHALLENGE_METHODS = ['S256'] as const;

export function isSupportedMethod(method: string | null | undefined): boolean {
  // RFC 7636 defaults an absent method to `plain`, which we refuse — so an
  // absent method is refused too, rather than silently downgraded.
  return method === 'S256';
}

/** BASE64URL(SHA256(verifier)), per RFC 7636 §4.2. */
export function challengeFor(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function verifyChallenge(verifier: string, challenge: string): boolean {
  // RFC 7636 §4.1 — 43..128 chars of the unreserved set.
  if (!verifier || verifier.length < 43 || verifier.length > 128) return false;
  if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) return false;
  return safeEqual(challengeFor(verifier), challenge);
}
