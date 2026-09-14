// src/lib/server/oauth/metadata.ts
//
// The issuer is whichever origin the request arrived on, so the metadata a
// client reads always points back at the host it is already talking to. Pinning
// a single origin here would break the moment the app answers on both
// api.1lev1.com and www.1lev1.com — which it does.

import { env } from '$env/dynamic/private';

export function issuerFor(url: URL): string {
  return url.origin;
}

/**
 * Where the protected resource sends clients to authorize. Defaults to the
 * request's own origin. api.1lev1.com only serves /api/* and 301s everything
 * else to www (Vercel), so on that host set
 * OAUTH_AUTHORIZATION_SERVER=https://www.1lev1.com: the resource metadata then
 * names `https://api.1lev1.com/api/mcp` (matching the URL the user pasted,
 * RFC 9728 §3.3) while authorize/token/register all run on www, whose own
 * metadata issuer is www — so both checks hold.
 */
export function authorizationServerFor(url: URL): string {
  const configured = env.OAUTH_AUTHORIZATION_SERVER?.trim().replace(/\/+$/, '');
  return configured || issuerFor(url);
}

export function authorizationServerMetadata(url: URL) {
  const issuer = issuerFor(url);
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    // PKCE is what actually protects the exchange; the secret-bearing methods
    // are advertised because ChatGPT and Gemini Enterprise insist on a
    // client_secret. See oauth/clients.ts → clientSecretFor().
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['mcp'],
    service_documentation: 'https://1lev1.com/mcp-connect'
  };
}

export function protectedResourceMetadata(url: URL) {
  const issuer = issuerFor(url);
  return {
    resource: `${issuer}/api/mcp`,
    authorization_servers: [authorizationServerFor(url)],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp']
  };
}
