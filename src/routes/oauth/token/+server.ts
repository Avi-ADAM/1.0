// RFC 6749 §4.1.3 / RFC 7636 §4.5 — the token endpoint.
//
// The access_token we return IS a 1lev1 api-key. That is the whole point of the
// design: /api/mcp keeps calling verifyApiKey() with no idea whether the key
// arrived via `npx 1lev1-mcp` or via a cloud connector, and Settings → API keys
// revokes either one the same way.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { redeemCode } from '$lib/server/oauth/codes.js';
import { verifyChallenge } from '$lib/server/oauth/pkce.js';
import { parseClientId } from '$lib/server/oauth/clients.js';
import { safeEqual } from '$lib/server/oauth/secret.js';

const NO_STORE = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'Access-Control-Allow-Origin': '*'
};

function tokenError(code: string, description: string, status = 400) {
  return json({ error: code, error_description: description }, { status, headers: NO_STORE });
}

export const POST: RequestHandler = async ({ request }) => {
  // RFC 6749 requires form encoding; accept JSON too since some clients send it.
  let params: Record<string, string> = {};
  const ct = request.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      params = (await request.json()) as Record<string, string>;
    } else {
      params = Object.fromEntries((await request.formData()) as any);
    }
  } catch {
    return tokenError('invalid_request', 'Body must be form-encoded or JSON');
  }

  if (params.grant_type !== 'authorization_code') {
    return tokenError('unsupported_grant_type', 'Only authorization_code is supported');
  }

  const code = String(params.code ?? '');
  const verifier = String(params.code_verifier ?? '');
  if (!code) return tokenError('invalid_request', 'code is required');
  if (!verifier) return tokenError('invalid_request', 'code_verifier is required (PKCE)');

  const redeemed = redeemCode(code);
  if (!redeemed.ok) {
    // All three failures collapse into invalid_grant on purpose: telling a
    // caller "expired" versus "replayed" versus "forged" is free information
    // about codes it does not hold.
    console.warn(`[OAuth] Token exchange refused: ${redeemed.reason}`);
    return tokenError('invalid_grant', 'Authorization code is invalid, expired, or already used');
  }

  const payload = redeemed.payload;

  // The code is bound to the client and redirect_uri it was issued for
  // (RFC 6749 §4.1.3) — otherwise a code leaked to one client is spendable by
  // another.
  const clientId = String(params.client_id ?? '');
  if (clientId && !safeEqual(clientId, payload.clientId)) {
    return tokenError('invalid_grant', 'code was not issued to this client');
  }
  if (!parseClientId(payload.clientId)) {
    return tokenError('invalid_client', 'client registration is no longer valid');
  }
  const redirectUri = String(params.redirect_uri ?? '');
  if (redirectUri && !safeEqual(redirectUri, payload.redirectUri)) {
    return tokenError('invalid_grant', 'redirect_uri does not match the authorization request');
  }

  if (!verifyChallenge(verifier, payload.codeChallenge)) {
    return tokenError('invalid_grant', 'PKCE verification failed');
  }

  console.log(`[OAuth] Issued access token to user ${payload.userId} for client ${payload.clientId.slice(0, 12)}…`);

  return json(
    {
      access_token: payload.key,
      token_type: 'Bearer',
      scope: 'mcp'
      // No expires_in and no refresh_token: an api-key lives until the user
      // revokes it in Settings → API keys. See docs/PLAN_MCP_OAUTH.md.
    },
    { headers: NO_STORE }
  );
};

export const OPTIONS: RequestHandler = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
