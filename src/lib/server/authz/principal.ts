/**
 * Principal resolution — turns the credentials on a request into a Principal.
 *
 * Centralizes logic that was previously scattered across /api/send,
 * /api/action, /api/v1/actions and /api/mcp. Resolution NEVER throws for a
 * bad credential — it degrades ('anonymous' / cookie fallback) and lets the
 * authorization layer deny, matching the existing endpoints' behaviour
 * (e.g. isSer:true without the internal secret falls back to the cookie JWT).
 *
 * Env access is via $env/dynamic/private so unit tests can stub it and so
 * the module stays importable when optional secrets are absent.
 */

import { env } from '$env/dynamic/private';
import { isInternalRequest } from '$lib/server/internalSecret.js';
import { isMeetingsRequest } from '$lib/server/meetingsProxy.js';
import type { Principal } from './types.js';

export const CONSENSUS_SECRET_HEADER = 'x-consensus-secret';

function normalizeSecret(value: unknown, name?: string): string {
  let normalized = String(value ?? '').replace(/\s+/g, '');
  if (name && normalized.startsWith(`${name}=`)) {
    normalized = normalized.slice(name.length + 1);
  }
  return normalized;
}

/** Minimal cookie reader — matches SvelteKit's `cookies.get` surface. */
export interface CookieReader {
  get(name: string): string | undefined;
}

/** A user id and name that something has actually verified — see identity.js. */
export interface VerifiedIdentity {
  id?: string | null;
  username?: string | null;
}

/**
 * Principal for the normal browser path (and for a server `load` forwarding the
 * user's cookies).
 *
 * The `jwt` cookie says *that* there is a session; `identity` — resolved from
 * that token by `$lib/server/identity.js` and published as `locals.uid` — says
 * *whose*. The `id` / `un` cookies are written httpOnly:false for the UI and
 * are attacker-controlled on a public gate, so they are never read here.
 *
 * A token we could not resolve to a user is not a session: it degrades to
 * anonymous and the authorization layer denies from there.
 */
export function resolveSessionPrincipal(
  cookies: CookieReader,
  identity?: VerifiedIdentity | null
): Principal {
  const jwt = cookies.get('jwt');
  if (!jwt) return { kind: 'anonymous' };
  if (!identity?.id) return { kind: 'anonymous' };
  return {
    kind: 'user',
    userId: String(identity.id),
    username: identity.username ?? undefined
  };
}

/**
 * Principal for a request that already proved it is server-originated
 * (isSer:true + valid x-internal-secret — the caller MUST have verified
 * isInternalRequest before treating the request as service).
 *
 * A valid x-consensus-secret header narrows the principal to the
 * limited-scope consensus service; otherwise it is the admin service.
 */
export function resolveServicePrincipal(request: Request): Principal {
  const secret = normalizeSecret(env.CONSENSUS_PROXY_SECRET, 'CONSENSUS_PROXY_SECRET');
  const incoming = request.headers.get(CONSENSUS_SECRET_HEADER);
  if (secret && incoming === secret) {
    return { kind: 'serviceConsensus' };
  }
  return { kind: 'serviceAdmin' };
}

/**
 * Combined resolver for /api/send and /api/action:
 * service principal when the isSer flag is genuine, cookie principal otherwise.
 */
export function resolvePrincipal(opts: {
  request: Request;
  cookies: CookieReader;
  isSerFlag?: boolean;
  /** verified session identity (`locals.uid` / `locals.un`), when there is one */
  identity?: VerifiedIdentity | null;
}): Principal {
  const { request, cookies, isSerFlag, identity } = opts;
  if (isSerFlag === true && isInternalRequest(request)) {
    return resolveServicePrincipal(request);
  }
  // The meetings app proving itself. Checked before the cookie so a guest —
  // who has no cookie to fall back to — resolves to something other than
  // anonymous, and after isSer so it can never widen a genuine service call.
  if (isMeetingsRequest(request)) {
    return { kind: 'serviceMeetings' };
  }
  return resolveSessionPrincipal(cookies, identity);
}

/**
 * Principal from an Authorization: Bearer 1lev1_… header.
 * Returns null when the header is missing/invalid so callers can 401.
 *
 * Note: Strapi does not know API keys as an auth mechanism — verifyApiKey
 * maps the key to its owning user (and scopes) and execution later happens
 * with the admin token; this Principal is the ONLY permission boundary.
 */
export async function resolveApiKeyPrincipal(
  authHeader: string | null
): Promise<Principal | null> {
  if (!authHeader) return null;
  const raw = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  // Lazy import: apiKeys.ts reads process.env at module load (dotenv), keep
  // that out of the hot path of modules that never see API keys.
  const { verifyApiKey } = await import('$lib/server/apiKeys');
  const user = await verifyApiKey(raw);
  if (!user?.id) return null;
  return {
    kind: 'apiKey',
    userId: String(user.id),
    scopes: user.scopes ?? undefined
  };
}
