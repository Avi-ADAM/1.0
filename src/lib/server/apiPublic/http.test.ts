/**
 * The HTTP shell (§5.1, §5.6): authentication ladder, the double tenant check,
 * the error envelope, rate limits and the caching contract.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyApiKeyDetailed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('$lib/server/apiKeys.js', () => ({
  verifyApiKeyDetailed: mocks.verifyApiKeyDetailed,
  touchLastUsed: mocks.touchLastUsed,
  // The real one: a flat scope array, exactly what the panel writes.
  assertScope: (key: any, scope: string) =>
    Array.isArray(key.scopes) && key.scopes.includes(scope)
}));

const {
  API_VERSION,
  assertTenant,
  authenticateRead,
  cacheControlFor,
  checkRateLimit,
  clientIpOf,
  errorResponse,
  etagOf,
  respond,
  resetRateLimits,
  traceOf
} = await import('./http.js');

function keyed(
  scopes: string[],
  project: string | null = '57',
  extra: Record<string, unknown> = {}
) {
  return {
    user: { id: '9' },
    keyId: '3',
    name: 'shop',
    project: project ? { id: project } : null,
    scopes,
    revoked: false,
    allowedOrigins: [],
    lastUsedAt: null,
    ...extra
  };
}

/**
 * A request stub carrying just headers. happy-dom's `Request` drops `Origin`
 * (the browser forbids setting it), and the origin allow-list is exactly what
 * this file has to be able to exercise — so the header bag is built directly.
 */
const request = (headers: Record<string, string> = {}) =>
  ({
    headers: new Headers(headers),
    url: 'https://www.1lev1.com/api/v1/r/haohel/products'
  }) as unknown as Request;

beforeEach(() => {
  resetRateLimits();
  mocks.verifyApiKeyDetailed.mockReset();
  mocks.touchLastUsed.mockReset();
});

describe('authenticateRead', () => {
  it('treats a request without a header as the public view', async () => {
    const result = await authenticateRead(request());
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(result.auth.kind).toBe('anonymous');
    expect(mocks.verifyApiKeyDetailed).not.toHaveBeenCalled();
  });

  it('refuses a bad key instead of falling back to public', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(null);
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_nope' })
    );
    expect(result.kind).toBe('deny');
    if (result.kind === 'deny') expect(result.response.status).toBe(401);
  });

  it('refuses a revoked key', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(
      keyed(['products:read'], '57', { revoked: true })
    );
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    if (result.kind === 'ok') throw new Error('should not pass');
    expect(result.response.status).toBe(401);
    expect((await result.response.json()).error.code).toBe('KEY_REVOKED');
  });

  it('refuses a key without the read scope', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(keyed(['sales:report']));
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    if (result.kind === 'ok') throw new Error('should not pass');
    expect(result.response.status).toBe(403);
    expect((await result.response.json()).error.code).toBe('SCOPE_MISSING');
  });

  it('refuses a key that is not pinned to a rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(
      keyed(['products:read'], null)
    );
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    if (result.kind === 'ok') throw new Error('should not pass');
    expect((await result.response.json()).error.code).toBe('KEY_NOT_SCOPED');
  });

  it('marks a draft key as the draft level', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(
      keyed(['products:read', 'products:read:draft'])
    );
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    expect(result.kind === 'ok' && result.auth.access.level).toBe('draft');
  });

  it('honours the origin allow-list and stamps last use', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(
      keyed(['products:read'], '57', {
        allowedOrigins: ['https://shop.example']
      })
    );
    const denied = await authenticateRead(
      request({
        Authorization: 'Bearer 1lev1_x',
        Origin: 'https://evil.example'
      })
    );
    if (denied.kind === 'ok') throw new Error('should not pass');
    expect((await denied.response.json()).error.code).toBe(
      'ORIGIN_NOT_ALLOWED'
    );

    const allowed = await authenticateRead(
      request({
        Authorization: 'Bearer 1lev1_x',
        Origin: 'https://shop.example'
      })
    );
    expect(allowed.kind).toBe('ok');
    expect(mocks.touchLastUsed).toHaveBeenCalledWith('3', undefined);
  });
});

describe('assertTenant — two independent sources (§5.1)', () => {
  it('allows the key’s own rikma', () => {
    expect(
      assertTenant(
        {
          kind: 'key',
          projectId: '57',
          access: { level: 'key' }
        },
        '57'
      )
    ).toBeNull();
  });

  it('refuses another rikma even for a valid key', async () => {
    const response = assertTenant(
      {
        kind: 'key',
        projectId: '57',
        access: { level: 'key' }
      },
      '58'
    );
    expect(response?.status).toBe(403);
    expect((await response!.json()).error.code).toBe('RIKMA_MISMATCH');
  });

  it('has nothing to check for an anonymous caller — the path is the tenant', () => {
    expect(
      assertTenant(
        { kind: 'anonymous', access: { level: 'anonymous' } },
        '57'
      )
    ).toBeNull();
  });
});

describe('rate limiting', () => {
  it('counts per bucket and reports what is left', () => {
    const first = checkRateLimit('key:1', 3);
    expect(first).toMatchObject({ allowed: true, remaining: 2 });
    checkRateLimit('key:1', 3);
    checkRateLimit('key:1', 3);
    expect(checkRateLimit('key:1', 3).allowed).toBe(false);
    // Another bucket is untouched: one noisy key must not lock everyone out.
    expect(checkRateLimit('key:2', 3).allowed).toBe(true);
  });

  it('blocks a key that exceeds its quota with a Retry-After', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(keyed(['products:read']));
    for (let i = 0; i < 600; i++)
      await authenticateRead(request({ Authorization: 'Bearer 1lev1_x' }));
    const blocked = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    if (blocked.kind === 'ok') throw new Error('should not pass');
    expect(blocked.response.status).toBe(429);
    expect(blocked.response.headers.get('Retry-After')).toBeTruthy();
  });
});

describe('clientIpOf', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(
      clientIpOf(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))
    ).toBe('203.0.113.7');
    expect(clientIpOf(request({ 'x-real-ip': '203.0.113.9' }))).toBe(
      '203.0.113.9'
    );
    expect(clientIpOf(request())).toBe('local');
  });
});

describe('respond — one shape for every read route', () => {
  const anon = {
    kind: 'anonymous' as const,
    access: { level: 'anonymous' as const }
  };
  const keyedAuth = {
    kind: 'key' as const,
    projectId: '57',
    access: { level: 'key' as const }
  };

  it('stamps the version and the cache contract the caller earned', () => {
    const publicResponse = respond({
      request: request(),
      auth: anon,
      body: { ok: true },
      etag: 'W/"a"'
    });
    expect(publicResponse.headers.get('X-1lev1-Api-Version')).toBe(API_VERSION);
    expect(publicResponse.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    expect(publicResponse.headers.get('Vary')).toBe('Authorization, Origin');
    expect(cacheControlFor(keyedAuth)).toContain('private');
  });

  it('answers 304 without a body when the tag matches', async () => {
    const notModified = respond({
      request: request({ 'If-None-Match': 'W/"a"' }),
      auth: anon,
      body: { big: 'payload' },
      etag: 'W/"a"'
    });
    expect(notModified.status).toBe(304);
    expect(await notModified.text()).toBe('');
    expect(notModified.headers.get('ETag')).toBe('W/"a"');
  });

  it('never stores a no-store answer', async () => {
    const response = respond({
      request: request(),
      auth: keyedAuth,
      body: { quota: 1 },
      etag: '',
      noStore: true
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('ETag')).toBeNull();
  });

  it('has change-sensitive tags: same rows ⇒ same tag, a new row ⇒ a new tag', () => {
    const a = etagOf({
      p: '/api/v1/r/haohel',
      q: [],
      v: ['1:2026-01-01', '2:2026-01-02']
    });
    const b = etagOf({
      p: '/api/v1/r/haohel',
      q: [],
      v: ['1:2026-01-01', '2:2026-01-02']
    });
    const c = etagOf({
      p: '/api/v1/r/haohel',
      q: [],
      v: ['1:2026-01-01', '2:2026-01-03']
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('errorResponse', () => {
  it('answers the documented envelope, in JSON, with CORS', async () => {
    const response = errorResponse(403, 'RIKMA_MISMATCH', 'nope');
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await response.json()).toEqual({
      error: { code: 'RIKMA_MISMATCH', message: 'nope', details: {} }
    });
  });
});

describe('the quota is reported, not guessed (§5.4)', () => {
  it('tells an anonymous caller what is left of its window', async () => {
    const result = await authenticateRead(request());
    if (result.kind !== 'ok') throw new Error('should be anonymous');
    expect(result.auth.quota).toMatchObject({ limit: 60, remaining: 59 });
  });

  it('counts down as calls are made', async () => {
    await authenticateRead(request());
    const second = await authenticateRead(request());
    expect(second.kind === 'ok' && second.auth.quota?.remaining).toBe(58);
  });

  it('reports a key its own, larger, budget', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue({
      user: { id: '9' },
      keyId: '3',
      name: 'shop',
      project: { id: '57' },
      scopes: ['products:read'],
      revoked: false,
      allowedOrigins: [],
      lastUsedAt: null
    });
    const result = await authenticateRead(
      request({ Authorization: 'Bearer 1lev1_x' })
    );
    if (result.kind !== 'ok') throw new Error('should be keyed');
    expect(result.auth.quota).toMatchObject({ limit: 600, remaining: 599 });
  });

  it('stamps the headers on the response, and a trace id on a failure', async () => {
    const result = await authenticateRead(request());
    if (result.kind !== 'ok') throw new Error('nope');
    const response = respond({
      request: request(),
      auth: result.auth,
      body: { ok: true },
      etag: 'W/"x"'
    });
    expect(response.headers.get('RateLimit-Limit')).toBe('60');
    expect(response.headers.get('RateLimit-Remaining')).toBeTruthy();

    const failure = errorResponse(502, 'UPSTREAM_ERROR', 'x', {
      'X-1lev1-Trace': traceOf(request())
    });
    expect(failure.headers.get('X-1lev1-Trace')).toMatch(/^[\w.:-]{8,}$/);
  });
});
