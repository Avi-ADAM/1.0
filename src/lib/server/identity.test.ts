/**
 * Session identity — the tests that matter are the forgery ones: the whole
 * module exists because `id` / `un` are client-writable cookies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }));

import {
  resolveSessionIdentity,
  resolveSessionUserId,
  verifyHs256,
  clearIdentityCache,
  CACHE_TTL_MS
} from './identity.js';

const SECRET = 'strapi-jwt-secret';

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** A token shaped exactly like Strapi's: `{ id, iat, exp }`, HS256. */
function makeToken(payload: Record<string, unknown>, secret: string | null = SECRET) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(
    JSON.stringify({ iat: 1_700_000_000, exp: Math.floor(Date.now() / 1000) + 3600, ...payload })
  );
  const signature = secret
    ? b64url(createHmac('sha256', secret).update(`${header}.${body}`).digest())
    : 'not-a-signature';
  return `${header}.${body}.${signature}`;
}

/** A fetch that answers the `me` query as Strapi would for `id`. */
function strapiSaying(id: string | null, username = 'dana') {
  return vi.fn(async () =>
    new Response(
      JSON.stringify({ data: { me: id == null ? null : { id, username } } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  );
}

beforeEach(() => {
  clearIdentityCache();
  for (const key of Object.keys(dynamicEnv)) delete dynamicEnv[key];
});

describe('verifyHs256', () => {
  it('accepts a correctly signed token', () => {
    expect(verifyHs256(makeToken({ id: 7 }), SECRET)).toMatchObject({ id: 7 });
  });

  it('rejects a token signed with a different secret', () => {
    expect(verifyHs256(makeToken({ id: 7 }, 'other-secret'), SECRET)).toBeNull();
  });

  it('rejects a payload edited after signing', () => {
    const [header, , signature] = makeToken({ id: 7 }).split('.');
    const forged = b64url(JSON.stringify({ id: 999, iat: 1, exp: 9_999_999_999 }));
    expect(verifyHs256(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects alg:none, whatever the payload claims', () => {
    const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ id: 999, exp: 9_999_999_999 }));
    expect(verifyHs256(`${header}.${body}.`, SECRET)).toBeNull();
  });

  it('rejects a malformed token instead of throwing', () => {
    expect(verifyHs256('nonsense', SECRET)).toBeNull();
    expect(verifyHs256('a.b', SECRET)).toBeNull();
  });
});

describe('resolveSessionIdentity', () => {
  it('is null for a guest', async () => {
    expect(await resolveSessionIdentity({ jwt: undefined })).toBeNull();
  });

  it('is null for an expired token, without asking Strapi', async () => {
    const doFetch = strapiSaying('12');
    const expired = makeToken({ id: 12, exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(await resolveSessionIdentity({ jwt: expired, fetch: doFetch })).toBeNull();
    expect(doFetch).not.toHaveBeenCalled();
  });

  it('takes the id Strapi reports, not one the caller asserts', async () => {
    const doFetch = strapiSaying('12', 'dana');
    // The token's own payload claims 999; Strapi is the authority and says 12.
    const identity = await resolveSessionIdentity({
      jwt: makeToken({ id: 999 }, null),
      fetch: doFetch
    });
    expect(identity).toEqual({ id: '12', username: 'dana' });
  });

  it('is null when Strapi does not recognise the token', async () => {
    const doFetch = strapiSaying(null);
    expect(
      await resolveSessionIdentity({ jwt: makeToken({ id: 999 }, null), fetch: doFetch })
    ).toBeNull();
  });

  describe('with JWT_SECRET configured', () => {
    beforeEach(() => {
      dynamicEnv.JWT_SECRET = SECRET;
    });

    it('rejects a forged token without a round trip', async () => {
      const doFetch = strapiSaying('999');
      const forged = makeToken({ id: 999 }, 'attacker-secret');
      expect(await resolveSessionIdentity({ jwt: forged, fetch: doFetch })).toBeNull();
      expect(doFetch).not.toHaveBeenCalled();
    });

    it('refuses a token whose two verifiers disagree', async () => {
      const doFetch = strapiSaying('12');
      const token = makeToken({ id: 7 }); // validly signed, but for a different user
      expect(await resolveSessionIdentity({ jwt: token, fetch: doFetch })).toBeNull();
    });

    it('keeps the session alive when Strapi is unreachable', async () => {
      const doFetch = vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      });
      const identity = await resolveSessionIdentity({ jwt: makeToken({ id: 7 }), fetch: doFetch });
      expect(identity).toEqual({ id: '7', username: null });
    });
  });

  it('drops the session when Strapi is unreachable and nothing else can vouch', async () => {
    const doFetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(
      await resolveSessionIdentity({ jwt: makeToken({ id: 7 }, null), fetch: doFetch })
    ).toBeNull();
  });

  it('caches a resolved identity per token', async () => {
    const doFetch = strapiSaying('12');
    const jwt = makeToken({ id: 12 }, null);
    await resolveSessionIdentity({ jwt, fetch: doFetch });
    await resolveSessionIdentity({ jwt, fetch: doFetch });
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it('re-checks once the cache entry has aged out', async () => {
    vi.useFakeTimers();
    try {
      const doFetch = strapiSaying('12');
      const jwt = makeToken({ id: 12 }, null);
      await resolveSessionIdentity({ jwt, fetch: doFetch });
      vi.advanceTimersByTime(CACHE_TTL_MS + 1);
      await resolveSessionIdentity({ jwt, fetch: doFetch });
      expect(doFetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives two different tokens two different answers', async () => {
    const doFetch = vi.fn(async (_url: any, init: any) => {
      const auth = new Headers(init.headers).get('Authorization') ?? '';
      const id = auth.includes(tokenA) ? '12' : '34';
      return new Response(JSON.stringify({ data: { me: { id, username: `u${id}` } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
    const tokenA = makeToken({ id: 12 }, null);
    const tokenB = makeToken({ id: 34 }, null);
    expect(await resolveSessionIdentity({ jwt: tokenA, fetch: doFetch as any })).toMatchObject({
      id: '12'
    });
    expect(await resolveSessionIdentity({ jwt: tokenB, fetch: doFetch as any })).toMatchObject({
      id: '34'
    });
  });
});

describe('resolveSessionUserId', () => {
  it('ignores the id cookie entirely', async () => {
    const doFetch = strapiSaying('12');
    const cookies = {
      get: (name: string) =>
        ({ jwt: makeToken({ id: 12 }, null), id: '999', un: 'mallory' })[name]
    };
    expect(await resolveSessionUserId(cookies, doFetch as any)).toBe('12');
  });
});
