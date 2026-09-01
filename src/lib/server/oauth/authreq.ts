// src/lib/server/oauth/authreq.ts
//
// A validated /oauth/authorize request, signed so it can survive the round trip
// through login and the consent screen without being editable in the address
// bar. Nothing secret lives in here — it is signed, not encrypted — but it is
// the thing that decides where the code gets sent, so it must not be forgeable.

import crypto from 'crypto';
import { clientSigningKey, b64url, fromB64url, safeEqual } from './secret.js';

const REQUEST_TTL_MS = 15 * 60 * 1000;

export interface AuthRequest {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string | null;
  codeChallenge: string;
  exp: number;
}

function sign(body: string): string {
  return crypto.createHmac('sha256', clientSigningKey()).update(body).digest('base64url');
}

export function signAuthRequest(
  req: Omit<AuthRequest, 'exp'>,
  now: number = Date.now()
): string {
  const body = b64url(JSON.stringify({ ...req, exp: now + REQUEST_TTL_MS }));
  return `${body}.${sign(body)}`;
}

export function verifyAuthRequest(
  token: string,
  now: number = Date.now()
): AuthRequest | null {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  if (!safeEqual(sign(body), token.slice(dot + 1))) return null;

  try {
    const parsed = JSON.parse(fromB64url(body).toString('utf8')) as AuthRequest;
    if (!parsed.exp || parsed.exp <= now) return null;
    if (!parsed.redirectUri || !parsed.codeChallenge || !parsed.clientId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Build the client's redirect, preserving `state` exactly as it was sent. */
export function redirectWith(
  redirectUri: string,
  params: Record<string, string>,
  state: string | null
): string {
  const target = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  if (state !== null && state !== undefined) target.searchParams.set('state', state);
  return target.toString();
}
