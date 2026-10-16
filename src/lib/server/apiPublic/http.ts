/**
 * The HTTP shell of the rikma read API: authentication, tenant enforcement,
 * rate limiting, error envelope and caching headers.
 *
 * One module, because the four v1 read routes (`/me`, the rikma, its products,
 * a product) must answer the same way to the same mistake. §5.6 asks for one
 * error shape and §4.5 for one caching contract; duplicating either across
 * routes is how the third route ends up disagreeing with the first two.
 *
 * The authentication ladder is the same one `v1/sales` and `v1/tasks` walk
 * (`verifyApiKeyDetailed` → `assertScope` → origin allow-list), with one
 * difference that matters here: **reading is public**, so a missing header is
 * not a 401 — it selects the anonymous view (published products only, §9.1).
 * A header that *is* present is always verified; a bad key never falls back.
 */

import crypto from 'node:crypto';
import { requestId } from '$lib/server/log.js';
import {
  verifyApiKeyDetailed,
  assertScope,
  touchLastUsed,
  type VerifiedApiKey
} from '$lib/server/apiKeys.js';
import type { ApiAccess } from './dto.js';

/** Sent as `X-1lev1-Api-Version`; bumped when the DTO changes shape (§6.6). */
export const API_VERSION = '2026-10-16';

/** The scope a key needs to read a catalog at all. */
export const PUBLIC_KEY_SCOPE = 'products:read';
/** …and the extra one that reveals drafts. */
export const PUBLIC_KEY_DRAFT_SCOPE = 'products:read:draft';

/** Requests per minute, per key. A shop's build hook asks a handful of times. */
const KEY_RATE_LIMIT = 600;
/** …and per IP for the anonymous view, which anyone can hammer. */
const ANON_RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export interface ApiAuth {
  kind: 'anonymous' | 'key';
  /** Set for a key: the row scoping the key, its owner, and the rikma it is pinned to. */
  key?: VerifiedApiKey;
  /** The rikma the key is pinned to — compared with the one in the path (§5.1). */
  projectId?: string;
  access: ApiAccess;
  /**
   * This caller's window, as `checkRateLimit` counted it. Carried on the auth
   * rather than re-derived in `respond`, so the headers report the *same*
   * budget that was just spent — a second limiter call in the response path
   * would count the request twice (§5.4).
   */
  quota?: { limit: number; remaining: number; resetAt: number };
}

/**
 * A boolean discriminant would be the obvious spelling, but this project runs
 * `strict: false`, where TypeScript does not narrow a union on `ok: true` /
 * `ok: false`. A string discriminant narrows everywhere, so the failure branch
 * is reachable from the call sites instead of being a type error on every one
 * of them.
 */
export type AuthResult =
  | { kind: 'ok'; auth: ApiAuth }
  | { kind: 'deny'; response: Response };

// ─── error envelope ─────────────────────────────────────────────────────────

/**
 * `{ error: { code, message, details } }` — the shape `v1/sales` already
 * answers with, so one client-side error handler covers the whole surface.
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({ error: { code, message, details: {} } }),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...CORS_HEADERS,
        ...extra
      }
    }
  );
}

export function preflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── rate limiting ──────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let sincePrune = 0;

/**
 * In-memory, per-process — the same first line of defence `v1/sales` and
 * `v1/tasks` carry, with the same known limit: two instances behind a load
 * balancer each get their own counter (the real quota layer is P1, §4.10).
 * What it does buy is that one leaking script cannot flatten Strapi.
 */
export function checkRateLimit(
  bucket: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  if (++sincePrune % 500 === 0) {
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }
  const current = buckets.get(bucket);
  if (!current || current.resetAt <= now) {
    const resetAt = now + RATE_WINDOW_MS;
    buckets.set(bucket, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (current.count >= limit)
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: current.resetAt
  };
}

/** Test seam: the limiter is process state, and tests must not inherit it. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * The caller's address, as far as we can trust it.
 *
 * The app runs behind nginx (`adapter-node`, no `ADDRESS_HEADER` configured),
 * so `x-forwarded-for`'s first hop is what nginx saw. It is trivially
 * spoofable by anything reaching the app directly — which is exactly why the
 * anonymous limit is a blunt instrument, not a security boundary.
 */
export function clientIpOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}

// ─── authentication ─────────────────────────────────────────────────────────

/**
 * Resolve who is asking.
 *
 * - no `Authorization` header → the anonymous view (§9.1);
 * - a header → verified exactly like the write APIs: invalid/revoked ⇒ 401,
 *   missing `products:read` ⇒ 403, not pinned to a rikma ⇒ 403 ("mint a
 *   rikma-scoped key in the moach" — a global key does not exist by design),
 *   origin allow-list and the per-key rate limit as usual.
 *
 * The tenant half of §5.1 (key's rikma vs the rikma in the path) is *not* here:
 * it needs the resolved path, so `assertTenant` does it right after.
 */
export async function authenticateRead(
  request: Request,
  fetchFn?: typeof fetch
): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    const ip = clientIpOf(request);
    const rate = checkRateLimit(`anon:${ip}`, ANON_RATE_LIMIT);
    if (!rate.allowed) {
      return {
        kind: 'deny',
        response: errorResponse(
          429,
          'RATE_LIMITED',
          'Too many requests from this address',
          {
            'Retry-After': String(
              Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
            )
          }
        )
      };
    }
    return {
      kind: 'ok',
      auth: {
        kind: 'anonymous',
        access: { level: 'anonymous' },
        quota: {
          limit: ANON_RATE_LIMIT,
          remaining: rate.remaining,
          resetAt: rate.resetAt
        }
      }
    };
  }

  const rawKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  const key = await verifyApiKeyDetailed(rawKey);
  if (!key)
    return {
      kind: 'deny',
      response: errorResponse(401, 'INVALID_KEY', 'Invalid API key')
    };
  if (key.revoked)
    return {
      kind: 'deny',
      response: errorResponse(401, 'KEY_REVOKED', 'API key has been revoked')
    };

  const hasRead = assertScope(key, PUBLIC_KEY_SCOPE);
  const hasDraft = assertScope(key, PUBLIC_KEY_DRAFT_SCOPE);
  if (!hasRead && !hasDraft) {
    return {
      kind: 'deny',
      response: errorResponse(
        403,
        'SCOPE_MISSING',
        `API key is missing the "${PUBLIC_KEY_SCOPE}" scope`
      )
    };
  }
  if (!key.project?.id) {
    return {
      kind: 'deny',
      response: errorResponse(
        403,
        'KEY_NOT_SCOPED',
        'API key is not scoped to a rikma — mint one from the rikma’s API page'
      )
    };
  }

  const rate = checkRateLimit(`key:${key.keyId}`, KEY_RATE_LIMIT);
  if (!rate.allowed) {
    return {
      kind: 'deny',
      response: errorResponse(
        429,
        'RATE_LIMITED',
        'Rate limit exceeded for this API key',
        {
          'Retry-After': String(
            Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
          )
        }
      )
    };
  }

  if (key.allowedOrigins.length > 0) {
    const origin = request.headers.get('Origin');
    if (origin && !key.allowedOrigins.includes(origin)) {
      return {
        kind: 'deny',
        response: errorResponse(
          403,
          'ORIGIN_NOT_ALLOWED',
          'Origin not allowed for this API key'
        )
      };
    }
  }

  // "Seen last at" — fire and forget, exactly like the write APIs.
  touchLastUsed(key.keyId, fetchFn);

  return {
    kind: 'ok',
    auth: {
      kind: 'key',
      key,
      projectId: String(key.project.id),
      access: { level: hasDraft ? 'draft' : 'key' },
      quota: {
        limit: KEY_RATE_LIMIT,
        remaining: rate.remaining,
        resetAt: rate.resetAt
      }
    }
  };
}

/**
 * The second, independent source of the tenant (§5.0 #2): the key is pinned to
 * one rikma, the path names one — a mismatch is a `403`, not a silent fallback
 * to the key's rikma. Being a member of both rikmas does not help: the key was
 * minted for one shop.
 */
export function assertTenant(
  auth: ApiAuth,
  projectId: string
): Response | null {
  if (auth.kind !== 'key' || !auth.projectId) return null;
  if (auth.projectId === String(projectId)) return null;
  return errorResponse(
    403,
    'RIKMA_MISMATCH',
    `This API key is scoped to rikma ${auth.projectId} and cannot read rikma ${projectId}`
  );
}

// ─── caching ────────────────────────────────────────────────────────────────

/**
 * `ETag = hash of the payload's identity` — ids + `updatedAt` + the query that
 * produced them. Two requests that would render the same bytes get the same
 * tag, which is what makes `If-None-Match` worth sending (§4.5).
 */
export function etagOf(parts: unknown): string {
  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify(parts))
    .digest('hex')
    .slice(0, 20);
  return `W/"${hash}"`;
}

/**
 * The id a 5xx hands the caller so a report can be matched to a log line
 * (§5.6). Same value `hooks.server.js` puts on `x-request-id`, so a support
 * conversation needs one id, not two.
 */
export function traceOf(request: Request): string {
  return requestId(request);
}

export function ifNoneMatchMatches(request: Request, etag: string): boolean {
  const header = request.headers.get('If-None-Match');
  if (!header) return false;
  return header
    .split(',')
    .map((v) => v.trim())
    .some((v) => v === etag || v === '*');
}

/**
 * Anonymous answers are the same for everyone, so they may sit in a CDN:
 * `public, s-maxage=60, stale-while-revalidate=300` (§4.5). A keyed answer is
 * personal to the key (it can contain drafts), so it is `private` — and
 * `Vary: Authorization` keeps a shared cache from ever serving one to the
 * other.
 */
export function cacheControlFor(auth: ApiAuth): string {
  return auth.kind === 'anonymous'
    ? 'public, s-maxage=60, stale-while-revalidate=300'
    : 'private, max-age=30, stale-while-revalidate=300';
}

export interface RespondOptions {
  request: Request;
  auth: ApiAuth;
  body: unknown;
  /** Empty string for a response that must not be conditionally revalidated. */
  etag: string;
  status?: number;
  /** Set only when the request was answered on a different (canonical) path. */
  canonicalHeader?: string | null;
  /** For a body holding live, per-key state: `Cache-Control: no-store`, no ETag. */
  noStore?: boolean;
  extraHeaders?: Record<string, string>;
}

/**
 * The single exit of every read route: cache headers, `ETag`, `304` on a
 * matching `If-None-Match`, CORS and the API version stamp.
 */
export function respond({
  request,
  auth,
  body,
  etag,
  status = 200,
  canonicalHeader,
  noStore = false,
  extraHeaders
}: RespondOptions): Response {
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': noStore ? 'no-store' : cacheControlFor(auth),
    Vary: 'Authorization, Origin',
    'X-1lev1-Api-Version': API_VERSION,
    // What the client has left before it is refused, so a shop can slow itself
    // down instead of discovering the limit by being cut off (§5.4).
    ...(auth.quota
      ? {
          'RateLimit-Limit': String(auth.quota.limit),
          'RateLimit-Remaining': String(Math.max(0, auth.quota.remaining)),
          'RateLimit-Reset': String(
            Math.max(0, Math.ceil((auth.quota.resetAt - Date.now()) / 1000))
          )
        }
      : {}),
    ...(!noStore && etag ? { ETag: etag } : {}),
    ...(canonicalHeader ? { 'X-1lev1-Rikma-Canonical': canonicalHeader } : {}),
    ...(extraHeaders ?? {})
  };

  if (!noStore && etag && ifNoneMatchMatches(request, etag)) {
    // A 304 carries no body but must repeat the cache headers: it is the cache
    // that asked, and it decides from them how long to keep the copy.
    const { 'Content-Type': _dropType, ...cacheOnly } = headers;
    return new Response(null, { status: 304, headers: cacheOnly });
  }

  return new Response(JSON.stringify(body), { status, headers });
}
