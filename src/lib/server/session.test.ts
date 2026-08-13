import { describe, it, expect, vi } from 'vitest';
import {
  decodeJwtPayload,
  isExpiredJwt,
  isAuthFailure,
  authCookieScopes,
  clearStaleAuthCookies,
  AUTH_COOKIES
} from './session.js';

/** Build a JWT-shaped string with the given payload (signature is never checked). */
function jwt(payload: Record<string, unknown>) {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}

const SEC = 1000;
const NOW = 1_700_000_000_000;

describe('decodeJwtPayload', () => {
  it('reads a base64url payload', () => {
    expect(decodeJwtPayload(jwt({ id: 7, exp: 123 }))).toEqual({ id: 7, exp: 123 });
  });

  it('survives UTF-8 in the payload', () => {
    expect(decodeJwtPayload(jwt({ name: 'ברוך', exp: 1 }))?.name).toBe('ברוך');
  });

  it('returns null instead of throwing on junk', () => {
    for (const junk of ['', 'not-a-jwt', 'a.b', 'a.!!!.c']) {
      expect(decodeJwtPayload(junk)).toBeNull();
    }
  });
});

describe('isExpiredJwt', () => {
  it('is true for a token whose exp has passed', () => {
    expect(isExpiredJwt(jwt({ exp: NOW / 1000 - 60 }), NOW)).toBe(true);
  });

  it('is false for a token still in date', () => {
    expect(isExpiredJwt(jwt({ exp: NOW / 1000 + 60 }), NOW)).toBe(false);
  });

  it('tolerates small clock skew rather than signing a live session out', () => {
    // expired 10s ago — inside the 30s skew window
    expect(isExpiredJwt(jwt({ exp: NOW / 1000 - 10 }), NOW)).toBe(false);
  });

  it('leaves alone anything it cannot prove expired', () => {
    expect(isExpiredJwt(jwt({ id: 7 }), NOW)).toBe(false); // no exp claim
    expect(isExpiredJwt(jwt({ exp: 'soon' }), NOW)).toBe(false); // non-numeric exp
    expect(isExpiredJwt('garbage', NOW)).toBe(false);
    expect(isExpiredJwt(false, NOW)).toBe(false);
    expect(isExpiredJwt(undefined, NOW)).toBe(false);
  });

  it('defaults to the real clock', () => {
    expect(isExpiredJwt(jwt({ exp: Date.now() / 1000 - 3600 }))).toBe(true);
    expect(isExpiredJwt(jwt({ exp: Date.now() / 1000 + 3600 }))).toBe(false);
  });
});

describe('isAuthFailure', () => {
  it('recognises what sendToSer throws on a 401', () => {
    expect(isAuthFailure(null, new Error('Unauthorized'))).toBe(true);
  });

  it('recognises the shapes /api/send answers with', () => {
    expect(isAuthFailure({ error: { status: 401, message: 'Unauthorized' } })).toBe(true);
    expect(isAuthFailure({ error: { name: 'UnauthorizedError' } })).toBe(true);
    expect(isAuthFailure({ errors: [{ message: 'Invalid token.' }] })).toBe(true);
    expect(isAuthFailure({ errors: [{ extensions: { code: 'UNAUTHENTICATED' } }] })).toBe(true);
    expect(isAuthFailure({ errors: [{ message: 'Forbidden access' }] })).toBe(true);
  });

  it('does not mistake a real failure for an auth problem', () => {
    expect(isAuthFailure({ data: { openMission: { data: null } } })).toBe(false);
    expect(isAuthFailure({ errors: [{ message: 'Cannot query field "nope"' }] })).toBe(false);
    expect(isAuthFailure(null, new Error('fetch failed'))).toBe(false);
    expect(isAuthFailure(null)).toBe(false);
  });

  it('tolerates malformed error entries instead of throwing', () => {
    expect(isAuthFailure({ errors: [null, undefined, {}] })).toBe(false);
  });
});

describe('authCookieScopes', () => {
  it('covers every scope /login may have written, on our own domain', () => {
    expect(authCookieScopes('www.1lev1.com')).toEqual([
      { path: '/' },
      { path: '/', domain: '.1lev1.com' },
      { path: '/', domain: 'www.1lev1.com' }
    ]);
    expect(authCookieScopes('1lev1.com')).toHaveLength(3);
  });

  it('stays host-only elsewhere — a .1lev1.com cookie is rejected there anyway', () => {
    expect(authCookieScopes('my-app.vercel.app')).toEqual([{ path: '/' }]);
    expect(authCookieScopes('localhost')).toEqual([{ path: '/' }]);
    // A look-alike domain must not be treated as ours.
    expect(authCookieScopes('evil1lev1.com')).toEqual([{ path: '/' }]);
  });
});

describe('clearStaleAuthCookies', () => {
  it('deletes each auth cookie in each scope, and never the email prefill', () => {
    const del = vi.fn();
    clearStaleAuthCookies({
      url: new URL('https://www.1lev1.com/availableMission/160'),
      cookies: { delete: del }
    } as never);

    expect(del).toHaveBeenCalledTimes(AUTH_COOKIES.length * 3);
    expect(del).toHaveBeenCalledWith('jwt', { path: '/' });
    expect(del).toHaveBeenCalledWith('jwt', { path: '/', domain: '.1lev1.com' });
    expect(del.mock.calls.some(([name]) => name === 'email')).toBe(false);
  });

  it('keeps going when a scope cannot be deleted', () => {
    const del = vi.fn(() => {
      throw new Error('no such cookie scope');
    });
    expect(() =>
      clearStaleAuthCookies({
        url: new URL('http://localhost:5173/lev'),
        cookies: { delete: del }
      } as never)
    ).not.toThrow();
    expect(del).toHaveBeenCalledTimes(AUTH_COOKIES.length);
  });
});
