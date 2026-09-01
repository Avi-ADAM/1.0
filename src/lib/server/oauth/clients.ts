// src/lib/server/oauth/clients.ts
//
// Dynamic Client Registration (RFC 7591) without a database. The client_id IS
// the registration: a signed envelope carrying the redirect_uris the client
// registered. `/oauth/authorize` reads them back out of the client_id and
// verifies the signature, so a forged or edited client_id fails closed.
//
// The trade-off versus a stored client table: registrations cannot be listed or
// individually revoked. Rotating OAUTH_SECRET invalidates all of them at once.
// That is acceptable because a client_id grants nothing on its own — every
// token still requires the user to sit through the consent screen.

import crypto from 'crypto';
import { clientSigningKey, b64url, fromB64url, safeEqual } from './secret.js';
import { isAllowedRedirectUri } from './redirects.js';

export interface ClientPayload {
  /** Registered redirect URIs, already allowlist-checked at registration. */
  redirect_uris: string[];
  client_name: string;
  /** Issued-at, seconds. Kept for auditing in logs; not an expiry. */
  iat: number;
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', clientSigningKey()).update(payloadB64).digest('base64url');
}

export function mintClientId(payload: ClientPayload): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function parseClientId(clientId: string): ClientPayload | null {
  if (typeof clientId !== 'string') return null;
  const dot = clientId.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = clientId.slice(0, dot);
  const mac = clientId.slice(dot + 1);
  if (!safeEqual(sign(body), mac)) return null;

  try {
    const parsed = JSON.parse(fromB64url(body).toString('utf8')) as ClientPayload;
    if (!Array.isArray(parsed.redirect_uris) || parsed.redirect_uris.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The redirect_uri on an /authorize request must be one the client registered.
 * Compared as exact strings (RFC 6749 §3.1.2.3) — no prefix matching, which is
 * the classic open-redirect hole. Re-checked against the host allowlist too, so
 * a client_id minted before the allowlist tightened cannot outlive it.
 */
export function isRegisteredRedirectUri(client: ClientPayload, redirectUri: string): boolean {
  if (!client.redirect_uris.some((u) => safeEqual(u, redirectUri))) return false;
  return isAllowedRedirectUri(redirectUri);
}
