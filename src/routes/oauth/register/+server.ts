// RFC 7591 — Dynamic Client Registration.
//
// claude.ai cannot be pre-registered: it registers itself the first time a user
// adds the connector. The client_id we return is a signed envelope carrying the
// redirect_uris, so there is no client table to keep (see oauth/clients.ts).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mintClientId, clientSecretFor } from '$lib/server/oauth/clients.js';
import { isAllowedRedirectUri } from '$lib/server/oauth/redirects.js';

/**
 * Registration is PKCE-only in substance, but clients declare themselves in
 * three different ways and every one of them ends at the same place.
 */
const AUTH_METHODS = ['none', 'client_secret_post', 'client_secret_basic'];

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

  // The exchange is authenticated by PKCE, never by the secret — but refusing
  // the secret-bearing methods outright locked out real clients, so we accept
  // the declaration and hand back a secret they may use or ignore. See
  // clientSecretFor() for why the secret is not load-bearing.
  const method = String(body?.token_endpoint_auth_method ?? 'none');
  if (!AUTH_METHODS.includes(method)) {
    return regError(
      'invalid_client_metadata',
      `Unsupported token_endpoint_auth_method: ${method}. Supported: ${AUTH_METHODS.join(', ')}`
    );
  }

  const client_name = String(body?.client_name ?? 'MCP client').slice(0, 120);
  const client_id = mintClientId({
    redirect_uris,
    client_name,
    iat: Math.floor(Date.now() / 1000)
  });

  console.log(
    `[OAuth] Registered client "${client_name}" (${method}) for ${redirect_uris.join(', ')}`
  );

  return json(
    {
      client_id,
      // Returned to every client, including the ones that registered with
      // "none": ChatGPT registers that way and then fails the connection if the
      // 201 carries no client_secret.
      client_secret: clientSecretFor(client_id),
      client_name,
      redirect_uris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: method,
      // 0 = neither the client_id nor the secret expires. Both stay valid until
      // OAUTH_SECRET rotates, which invalidates every registration at once.
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
