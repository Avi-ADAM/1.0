// src/lib/server/oauth/metadata.ts
//
// The issuer is whichever origin the request arrived on, so the metadata a
// client reads always points back at the host it is already talking to. Pinning
// a single origin here would break the moment the app answers on both
// api.1lev1.com and www.1lev1.com — which it does.

export function issuerFor(url: URL): string {
  return url.origin;
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
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp'],
    service_documentation: 'https://1lev1.com/mcp-connect'
  };
}

export function protectedResourceMetadata(url: URL) {
  const issuer = issuerFor(url);
  return {
    resource: `${issuer}/api/mcp`,
    authorization_servers: [issuer],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp']
  };
}
