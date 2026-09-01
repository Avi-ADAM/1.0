// src/lib/server/oauth/redirects.ts
//
// Which redirect_uris a client may register. This is the boundary that stops an
// attacker from registering a client that points our authorization code at
// their own server, so it is an allowlist and never a pattern match against
// user input.

import { env } from '$env/dynamic/private';

const DEFAULT_HOSTS = 'claude.ai,*.claude.ai,claude.com,*.claude.com';

function allowedHosts(): string[] {
  return (env.MCP_OAUTH_REDIRECT_HOSTS ?? DEFAULT_HOSTS)
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function hostMatches(hostname: string, pattern: string): boolean {
  if (pattern === hostname) return true;
  // `*.example.com` matches exactly one leading label: `a.example.com` yes,
  // `a.b.example.com` no. A bare `*` is not a pattern we accept.
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    if (!hostname.endsWith('.' + suffix)) return false;
    const label = hostname.slice(0, -(suffix.length + 1));
    return label.length > 0 && !label.includes('.');
  }
  return false;
}

export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * A redirect_uri is acceptable when it is an http(s) URL, carries no fragment
 * (RFC 6749 §3.1.2), and is either a loopback address (the CLI's callback) or
 * an https URL on an allowlisted host.
 */
export function isAllowedRedirectUri(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.hash) return false;
  if (isLocalhost(u.hostname)) return u.protocol === 'http:' || u.protocol === 'https:';
  if (u.protocol !== 'https:') return false;
  return allowedHosts().some((p) => hostMatches(u.hostname.toLowerCase(), p));
}
