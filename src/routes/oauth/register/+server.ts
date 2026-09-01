// RFC 7591 — Dynamic Client Registration.
//
// claude.ai cannot be pre-registered: it registers itself the first time a user
// adds the connector. The client_id we return is a signed envelope carrying the
// redirect_uris, so there is no client table to keep (see oauth/clients.ts).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mintClientId } from '$lib/server/oauth/clients.js';
import { isAllowedRedirectUri } from '$lib/server/oauth/redirects.js';

/** RFC 7591 §3.2.2 error shape. */
function regError(code: string, description: string, status = 400) {
  return json(
    { error: code, error_description: description },
    { status, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}

export const POST: RequestHandler = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return regError('invalid_client_metadata', 'Body must be JSON');
  }

  const uris = body?.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0) {
    return regError('invalid_redirect_uri', 'redirect_uris is required and must be a non-empty array');
  }
  if (uris.length > 8) {
    return regError('invalid_redirect_uri', 'Too many redirect_uris');
  }

  const redirect_uris = uris.map((u: unknown) => String(u));
  const rejected = redirect_uris.find((u) => !isAllowedRedirectUri(u));
  if (rejected) {
    // Naming the offender is safe — the caller supplied it — and without it a
    // client author has no way to tell which URI the allowlist refused.
    return regError('invalid_redirect_uri', `redirect_uri not allowed: ${rejected}`);
  }

  // We only issue public clients: the token endpoint authenticates the exchange
  // with PKCE, not with a client secret a browser app could not keep anyway.
  const method = body?.token_endpoint_auth_method;
  if (method && method !== 'none') {
    return regError('invalid_client_metadata', 'Only token_endpoint_auth_method "none" is supported');
  }

  const client_name = String(body?.client_name ?? 'MCP client').slice(0, 120);
  const client_id = mintClientId({
    redirect_uris,
    client_name,
    iat: Math.floor(Date.now() / 1000)
  });

  console.log(`[OAuth] Registered client "${client_name}" for ${redirect_uris.join(', ')}`);

  return json(
    {
      client_id,
      client_name,
      redirect_uris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      // 0 = the client_id does not expire. It stays valid until OAUTH_SECRET
      // rotates, which invalidates every registration at once.
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0
    },
    { status: 201, headers: { 'Access-Control-Allow-Origin': '*' } }
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
