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
//   'challenge' (default when OAuth is on) - spec behaviour, 401 on everything
//   'lazy'   - lazy authentication: initialize, tools/list and the public tools
//              answer without a token, and only a tools/call for any other
//              tool is the 401. Claude shows an inline Connect card on that
//              401 and retries the same call after sign-in
//              (claude.com/docs/connectors/building/lazy-authentication), so a
//              person with no account can use prepareSignup from the same
//              connector while a member signs in on first real use.
//   'public' - the old behaviour, 200 + the public tools, never a challenge
// and `?public=1` always opts a caller back into the public probe, so
// "what is 1lev1" stays answerable without a key.

import { env } from '$env/dynamic/private';
import { issuerFor } from './metadata.js';

export function oauthEnabled(): boolean {
  return env.MCP_OAUTH_ENABLED === 'true';
}

/** The configured mode, with the default applied. Anything unknown is 'challenge'. */
export function publicMode(): 'challenge' | 'lazy' | 'public' {
  const m = (env.MCP_PUBLIC_MODE ?? 'challenge').trim();
  return m === 'lazy' || m === 'public' ? m : 'challenge';
}

/** True when an unauthenticated caller should still get the two public tools. */
export function publicModeAllowed(url: URL): boolean {
  if (url.searchParams.get('public') === '1') return true;
  if (!oauthEnabled()) return true;
  return publicMode() === 'public';
}

/**
 * Lazy authentication is on for this caller: OAuth is on, the mode is 'lazy',
 * and the caller did not ask for the plain public probe.
 */
export function lazyAuthEnabled(url: URL): boolean {
  return oauthEnabled() && !publicModeAllowed(url) && publicMode() === 'lazy';
}

/**
 * The names of the tools a JSON-RPC body calls (a batch may call several).
 * Anything that is not a `tools/call` — initialize, tools/list, notifications —
 * contributes nothing, so it never meets the gate.
 */
export function calledToolNames(body: unknown): string[] {
  const messages = Array.isArray(body) ? body : [body];
  const names: string[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    if ((msg as { method?: unknown }).method !== 'tools/call') continue;
    const name = (msg as { params?: { name?: unknown } }).params?.name;
    // A tools/call with no usable name cannot be a public tool either.
    names.push(typeof name === 'string' ? name : '');
  }
  return names;
}

/** Whether an anonymous body must be refused with the 401 under lazy auth. */
export function needsSignIn(body: unknown, publicTools: ReadonlySet<string>): boolean {
  return calledToolNames(body).some((name) => !publicTools.has(name));
}

/**
 * The 401 to return to an unauthenticated caller, or `null` when this caller
 * should fall through to the public-tools response instead.
 *
 * `force` is the lazy-auth gate: the mode already decided this call needs an
 * account, so the challenge goes out even though the mode is not 'challenge'.
 */
export function oauthChallenge(url: URL, opts: { force?: boolean } = {}): Response | null {
  if (!opts.force && publicModeAllowed(url)) return null;
  if (!opts.force && publicMode() === 'lazy') return null;

  const issuer = issuerFor(url);
  const metadata = `${issuer}/.well-known/oauth-protected-resource`;

  // `scope` names the one scope there is, so the client asks for exactly that
  // instead of everything it can find in the metadata.
  const header = opts.force
    ? `Bearer error="invalid_token", error_description="Sign in to 1lev1 to use this tool", ` +
      `resource_metadata="${metadata}", scope="mcp"`
    : `Bearer resource_metadata="${metadata}"`;

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
        'WWW-Authenticate': header,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'WWW-Authenticate'
      }
    }
  );
}
