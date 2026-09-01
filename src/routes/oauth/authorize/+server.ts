// RFC 6749 §4.1.1 — the authorization endpoint.
//
// This endpoint only validates. The human-facing consent lives on the existing
// /mcp-connect page, which already knows how to say "this agent wants to act as
// you" and already mints the key. We hand it a signed AuthRequest and let it do
// the asking, so there is one consent screen on the platform rather than two.

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseClientId, isRegisteredRedirectUri } from '$lib/server/oauth/clients.js';
import { isSupportedMethod } from '$lib/server/oauth/pkce.js';
import { signAuthRequest, redirectWith } from '$lib/server/oauth/authreq.js';

/**
 * Errors before we trust the redirect_uri must be shown, never redirected —
 * bouncing to an unvalidated URI is how an authorization endpoint becomes an
 * open redirector (RFC 6749 §4.1.2.1).
 */
function fatal(description: string): Response {
  return new Response(
    JSON.stringify({ error: 'invalid_request', error_description: description }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const q = url.searchParams;
  const clientId = q.get('client_id') ?? '';
  const redirectUri = q.get('redirect_uri') ?? '';
  const state = q.get('state');

  const client = parseClientId(clientId);
  if (!client) return fatal('Unknown or malformed client_id. Register at /oauth/register first.');
  if (!redirectUri) return fatal('redirect_uri is required');
  if (!isRegisteredRedirectUri(client, redirectUri)) {
    return fatal('redirect_uri does not match a registered URI for this client');
  }

  // From here the redirect_uri is trusted, so failures go back to the client
  // as OAuth errors rather than as a dead end in the user's browser.
  const bounce = (error: string, description: string) =>
    redirect(302, redirectWith(redirectUri, { error, error_description: description }, state));

  if (q.get('response_type') !== 'code') {
    bounce('unsupported_response_type', 'Only response_type=code is supported');
  }

  const codeChallenge = q.get('code_challenge') ?? '';
  if (!codeChallenge) {
    bounce('invalid_request', 'PKCE is required: code_challenge is missing');
  }
  if (!isSupportedMethod(q.get('code_challenge_method'))) {
    bounce('invalid_request', 'code_challenge_method must be S256');
  }

  const authRequest = signAuthRequest({
    clientId,
    clientName: client.client_name,
    redirectUri,
    state,
    codeChallenge
  });

  const consent = `/mcp-connect?oauth=${encodeURIComponent(authRequest)}`;

  // The consent page enforces login itself, but sending an anonymous visitor
  // straight to /login keeps the signed request out of a page render that would
  // only bounce anyway.
  if (!locals.uid) {
    redirect(302, `/login?redirect=${encodeURIComponent(consent)}`);
  }

  redirect(302, consent);
};
