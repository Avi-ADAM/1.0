// src/lib/server/oauth/challenge.ts
//
// The 401 that starts the OAuth handshake.
//
// /api/mcp historically answered an unauthenticated POST with 200 and two
// public tools. To a browser client that reads as success, so it never begins
// an authorization flow and the connector sits there permanently anonymous.
// RFC 9728 §5.1 says a protected resource must answer 401 with a
// `WWW-Authenticate` header naming its resource metadata.
//
// MCP_PUBLIC_MODE controls the change:
//   'challenge' (default when OAuth is on) - spec behaviour, 401
//   'public'                               - the old behaviour, 200 + 2 tools
// and `?public=1` always opts a caller back into the public probe, so
// "what is 1lev1" stays answerable without a key.

import { env } from '$env/dynamic/private';
import { issuerFor } from './metadata.js';

export function oauthEnabled(): boolean {
  return env.MCP_OAUTH_ENABLED === 'true';
}

/** True when an unauthenticated caller should still get the two public tools. */
export function publicModeAllowed(url: URL): boolean {
  if (url.searchParams.get('public') === '1') return true;
  if (!oauthEnabled()) return true;
  return (env.MCP_PUBLIC_MODE ?? 'challenge') === 'public';
}

/**
 * The 401 to return to an unauthenticated caller, or `null` when this caller
 * should fall through to the public-tools response instead.
 */
export function oauthChallenge(url: URL): Response | null {
  if (publicModeAllowed(url)) return null;

  const issuer = issuerFor(url);
  const metadata = `${issuer}/.well-known/oauth-protected-resource`;

  // A JSON-RPC error body as well as the header: a client that reads the body
  // before the status still learns where to authenticate. `id` is null because
  // the request body belongs to the transport downstream — re-reading it here
  // would consume the stream the success path needs.
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32001,
        message: 'Authentication required',
        data: {
          resource_metadata: metadata,
          how_to_connect: `${issuer}/mcp-connect`
        }
      }
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer resource_metadata="${metadata}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'WWW-Authenticate'
      }
    }
  );
}
