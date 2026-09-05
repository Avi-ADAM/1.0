/**
 * Session identity — the single place the server learns *who* is calling.
 *
 * ## Why this module exists
 *
 * Until now the answer to "who is this" came from the `id` and `un` cookies,
 * which `/api/auth` writes with `httpOnly: false` so the client can read them
 * for UI. Nothing signs them. `/api/send` gates its qids on the `id` cookie,
 * `/api/action` builds `context.userId` — the value every `self` /
 * `projectMember` authRule compares against — from the same cookie, and
 * `hooks.server.js` puts it on `locals.uid` for ~45 SSR call sites.
 *
 * The gate is public on `api.1lev1.com`, so this was not a browser problem that
 * `httpOnly: true` would have fixed: a plain
 *
 *     curl -H 'Cookie: jwt=<my real token>; id=<someone else>' …
 *
 * asserts any identity it likes. **Only the JWT is bound to a user by
 * cryptography**, so only the JWT may answer the question.
 *
 * ## How the identity is established
 *
 * Two verifiers, tried in order, because the two deployments differ:
 *
 * 1. **Local HS256 verify** (`JWT_SECRET`). `api.1lev1.com` runs beside Strapi,
 *    so it can hold Strapi's own signing secret and settle the question with no
 *    network at all — and, importantly, reject a forged token *before* it
 *    reaches anything. Set `JWT_SECRET` to the same value as Strapi's.
 * 2. **Ask Strapi** (`me { id username }` with the caller's own token). Works
 *    with no shared secret, so a front that is not co-located (Vercel) is still
 *    safe. Strapi verifies the signature; we just read the answer.
 *
 * Step 2 also supplies `username`, which a Strapi JWT payload (`{id, iat, exp}`)
 * does not carry — and `username` is a security identifier in at least one
 * place (the consensus voter id), so it cannot come from the cookie either.
 *
 * Results are cached per token for {@link CACHE_TTL_MS}, never past the token's
 * own `exp`, which keeps the amortized cost at roughly one Strapi call per
 * signed-in user per five minutes.
 *
 * ## Reading this from route code
 *
 * Don't. `hooks.server.js` resolves once per request and publishes the result
 * as `locals.uid` / `locals.un`; use those. This module is for the two proxies
 * that run before/outside that, and for tests.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { ssrApiBase } from '$lib/server/ssrApiBase.js';
import { decodeJwtPayload, isExpiredJwt } from '$lib/server/session.js';

/** How long a resolved identity may be reused without re-checking. */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** Upper bound on cached tokens, so a burst of visitors cannot grow the heap. */
const CACHE_MAX = 5000;

/**
 * A failed lookup is cached too — briefly. Long enough that a script replaying
 * one bad token cannot turn itself into a Strapi load generator, short enough
 * that a real user is never stuck signed out by a transient Strapi 401.
 */
const NEGATIVE_TTL_MS = 30 * 1000;

/**
 * @typedef {Object} SessionIdentity
 * @property {string} id        the authenticated user id — verified, never from a cookie
 * @property {string | null} username  their Strapi username, when it is known
 */

/** @type {Map<string, { at: number, ttl: number, value: SessionIdentity | null }>} */
const cache = new Map();

/** Test seam — drops every cached answer. */
export function clearIdentityCache() {
  cache.clear();
}

function cacheKey(token) {
  // The token is already a secret held only by this process; hashing it keeps
  // the raw credential out of a heap dump and out of any map we might log.
  return createHmac('sha256', 'session-identity').update(token).digest('base64');
}

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > hit.ttl) {
    cache.delete(key);
    return undefined;
  }
  return hit;
}

function writeCache(key, value, ttl) {
  if (cache.size >= CACHE_MAX) {
    // Oldest insertion first — Map preserves it, and an approximate eviction is
    // all a five-minute cache needs.
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { at: Date.now(), ttl, value });
}

function b64urlToBuffer(part) {
  const b64 = String(part).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64');
}

/**
 * Verify an HS256 JWT against a shared secret.
 *
 * Strapi signs its user tokens with HS256 and `JWT_SECRET`; nothing else is
 * accepted here on purpose — `alg: none` and an RS→HS confusion are exactly the
 * tricks this check exists to refuse.
 *
 * @param {string} token
 * @param {string} secret
 * @returns {Record<string, any> | null} the payload, or null if the signature
 *   does not hold, the header is not HS256, or the token is malformed.
 */
export function verifyHs256(token, secret) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, signaturePart] = parts;

    const header = JSON.parse(b64urlToBuffer(headerPart).toString('utf8'));
    if (header?.alg !== 'HS256') return null;

    const expected = createHmac('sha256', secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest();
    const actual = b64urlToBuffer(signaturePart);
    if (actual.length !== expected.length) return null;
    if (!timingSafeEqual(actual, expected)) return null;

    const payload = JSON.parse(b64urlToBuffer(payloadPart).toString('utf8'));
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Ask Strapi who the token belongs to. Strapi checks the signature; a bad token
 * comes back as an auth error and resolves to null.
 *
 * @param {string} token
 * @param {typeof globalThis.fetch} doFetch
 * @returns {Promise<{ ok: true, identity: SessionIdentity | null } | { ok: false }>}
 *   `ok:false` means "could not reach Strapi" — a different thing from
 *   "Strapi says no", and the caller must not treat it as a rejection.
 */
async function askStrapi(token, doFetch) {
  let body;
  try {
    const res = await doFetch(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: 'query SessionIdentity { me { id username } }' })
    });
    body = await res.json();
  } catch {
    return { ok: false };
  }

  const me = body?.data?.me;
  if (me?.id != null) {
    return {
      ok: true,
      identity: { id: String(me.id), username: me.username ? String(me.username) : null }
    };
  }
  // `me: null` with no errors is Strapi's way of saying "not a valid session".
  return { ok: true, identity: null };
}

/**
 * Resolve the caller's identity from their session token.
 *
 * @param {Object} [opts]
 * @param {string | false | null} [opts.jwt]  the `jwt` cookie
 * @param {typeof globalThis.fetch} [opts.fetch]  injectable for tests
 * @returns {Promise<SessionIdentity | null>} null for "no usable session" —
 *   guest, expired, forged, or revoked. Never throws.
 */
export async function resolveSessionIdentity({ jwt, fetch: injected } = {}) {
  if (!jwt) return null;
  if (isExpiredJwt(jwt)) return null;

  const key = cacheKey(jwt);
  const hit = readCache(key);
  if (hit) return hit.value;

  return verifyAgainstStrapi(jwt, key, injected);
}

/**
 * The uncached half of {@link resolveSessionIdentity}.
 * @param {string} jwt
 * @param {string} key
 * @param {typeof globalThis.fetch} [injected]
 * @returns {Promise<SessionIdentity | null>}
 */
async function verifyAgainstStrapi(jwt, key, injected) {
  // Step 1 — local signature check, when this instance holds Strapi's secret.
  const secret = String(env.JWT_SECRET ?? '').trim();
  /** @type {string | null} */
  let verifiedId = null;
  if (secret) {
    const payload = verifyHs256(jwt, secret);
    if (!payload || payload.id == null) {
      // A token that fails a signature check we are able to perform is settled:
      // it is not a session, and it is not worth a round trip.
      writeCache(key, null, NEGATIVE_TTL_MS);
      return null;
    }
    verifiedId = String(payload.id);
  }

  // Step 2 — Strapi. Always asked (it is the only source of `username`, and the
  // only authority when no local secret is configured).
  const answer = await askStrapi(jwt, injected || fetch);

  if (answer.ok) {
    if (!answer.identity) {
      writeCache(key, null, NEGATIVE_TTL_MS);
      return null;
    }
    // Belt and braces: if both verifiers spoke, they must agree.
    if (verifiedId && verifiedId !== answer.identity.id) {
      writeCache(key, null, NEGATIVE_TTL_MS);
      return null;
    }
    writeCache(key, answer.identity, CACHE_TTL_MS);
    return answer.identity;
  }

  // Strapi is unreachable. A locally verified id is still trustworthy — the
  // signature held — so an outage costs the username, not the session.
  if (verifiedId) {
    const identity = { id: verifiedId, username: null };
    writeCache(key, identity, NEGATIVE_TTL_MS);
    return identity;
  }
  return null;
}

/**
 * Resolve the identity for a live request, taking the deployment into account.
 *
 * On the VPS instance (`SSR_API_BASE` unset) this is {@link resolveSessionIdentity}
 * against the co-located Strapi. On a front that proxies its `/api/*` elsewhere
 * — Vercel — Strapi is not meant to be reachable directly (that is the whole
 * point of §5 of the proxy plan), so the question goes through the same front
 * door every other server-side call uses: `/api/whoami`, which `handleFetch`
 * re-points at `SSR_API_BASE` with the caller's cookies attached.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {Promise<SessionIdentity | null>}
 */
export async function resolveEventIdentity(event) {
  const jwt = event.cookies.get('jwt');
  if (!jwt) return null;
  if (isExpiredJwt(jwt)) return null;

  const key = cacheKey(jwt);
  const hit = readCache(key);
  if (hit) return hit.value;

  // Mirrors rewriteToApiBase: a base that resolves to this very origin means
  // "I am the API instance", and the call would loop back through nginx.
  let proxied = false;
  try {
    const base = ssrApiBase();
    proxied = Boolean(base) && new URL(base).origin !== event.url.origin;
  } catch {
    proxied = false;
  }
  if (!proxied) return verifyAgainstStrapi(jwt, key);

  try {
    const res = await event.fetch('/api/whoami');
    if (res.status === 401) {
      writeCache(key, null, NEGATIVE_TTL_MS);
      return null;
    }
    if (!res.ok) return null; // upstream trouble — guest for this request only
    const body = await res.json();
    if (body?.id == null) {
      writeCache(key, null, NEGATIVE_TTL_MS);
      return null;
    }
    const identity = {
      id: String(body.id),
      username: body.username ? String(body.username) : null
    };
    writeCache(key, identity, CACHE_TTL_MS);
    return identity;
  } catch {
    // The API front is unreachable. Nothing on the page could have rendered
    // signed-in data anyway; do not cache the failure.
    return null;
  }
}

/**
 * The caller's verified user id, or null.
 * @param {{ get(name: string): string | undefined }} cookies
 * @param {typeof globalThis.fetch} [doFetch]
 * @returns {Promise<string | null>}
 */
export async function resolveSessionUserId(cookies, doFetch) {
  const identity = await resolveSessionIdentity({ jwt: cookies.get('jwt'), fetch: doFetch });
  return identity?.id ?? null;
}

/**
 * Last-resort id for code that has no `locals` and no cookie jar: read the
 * claim without verifying it. Only ever safe when the same request forwards the
 * caller's JWT to Strapi, so a forged payload dies on Strapi's own signature
 * check in the same breath. Prefer {@link resolveSessionIdentity} everywhere else.
 *
 * @param {string | false | undefined} token
 * @returns {string | null}
 */
export function unverifiedJwtUserId(token) {
  if (!token) return null;
  const id = decodeJwtPayload(token)?.id;
  return id == null ? null : String(id);
}
