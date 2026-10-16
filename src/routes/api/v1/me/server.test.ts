/**
 * GET /api/v1/me — the call an integration starts with (§5.2). It must name the
 * rikma, hand back the addresses built from its slug, and state the quota —
 * without ever answering an anonymous caller.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  verifyApiKeyDetailed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('$lib/server/actions/index.js', () => ({
  strapiClient: { execute: mocks.execute }
}));
vi.mock('$lib/server/apiKeys.js', () => ({
  verifyApiKeyDetailed: mocks.verifyApiKeyDetailed,
  touchLastUsed: mocks.touchLastUsed,
  assertScope: (key: any, scope: string) =>
    Array.isArray(key.scopes) && key.scopes.includes(scope)
}));

const { GET } = await import('./+server');
const { clearQueryCache } = await import('$lib/server/apiPublic/cache.js');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

function fakeStrapi({ rikma = true, name = 'dana' } = {}) {
  return async (qid: string) => {
    if (qid === 'rikmaApiRef') {
      return {
        data: {
          project: rikma
            ? {
                data: {
                  id: '57',
                  attributes: { projectName: 'רקמת האוכל', slug: 'haohel' }
                }
              }
            : null
        }
      };
    }
    if (qid === 'rikmaApiUserName') {
      return {
        data: {
          usersPermissionsUser: {
            data: { id: '9', attributes: { username: name } }
          }
        }
      };
    }
    throw new Error(`unexpected qid ${qid}`);
  };
}

const key = (scopes: string[]) => ({
  user: { id: '9' },
  keyId: '3',
  name: 'shop key',
  project: { id: '57' },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: '2026-10-15T10:00:00.000Z'
});

const call = (headers: Record<string, string> = {}) =>
  (GET as any)({
    request: { headers: new Headers(headers) } as unknown as Request,
    fetch: vi.fn()
  });

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
});

describe('GET /api/v1/me', () => {
  it('refuses an anonymous caller — there is nothing to describe', async () => {
    const response = await call();
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('KEY_REQUIRED');
  });

  it('names the key, its owner, its rikma and every address derived from the slug', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const response = await call({ Authorization: 'Bearer 1lev1_x' });
    expect(response.status).toBe(200);

    const { data } = await response.json();
    expect(data.user).toEqual({ id: '9', name: 'dana' });
    expect(data.rikma).toEqual({
      id: '57',
      slug: 'haohel',
      name: 'רקמת האוכל',
      canonicalPath: '/api/v1/r/haohel'
    });
    expect(data.scopes).toEqual(['products:read']);
    expect(data.access).toEqual({ read: true, draft: false });
    expect(data.quota.limit).toBe(600);
    expect(data.quota.remaining).toBeGreaterThan(0);
    expect(data.endpoints).toEqual({
      rikma: '/api/v1/r/haohel',
      products: '/api/v1/r/haohel/products',
      product: '/api/v1/r/haohel/products/{productId}',
      categories: '/api/v1/r/haohel/categories',
      sales: '/api/v1/r/haohel/sales',
      tasks: '/api/v1/r/haohel/tasks',
      task: '/api/v1/r/haohel/tasks/{externalId}',
      me: '/api/v1/me'
    });
  });

  it('says a draft key is a draft key', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(
      key(['products:read', 'products:read:draft'])
    );
    const { data } = await (
      await call({ Authorization: 'Bearer 1lev1_x' })
    ).json();
    expect(data.access).toEqual({ read: true, draft: true });
  });

  it('falls back to the id when the rikma has no address yet', async () => {
    mocks.execute.mockImplementation((async (qid: string) =>
      qid === 'rikmaApiRef'
        ? {
            data: {
              project: {
                data: {
                  id: '57',
                  attributes: { projectName: 'בלי כתובת', slug: null }
                }
              }
            }
          }
        : { data: {} }) as any);
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const { data } = await (
      await call({ Authorization: 'Bearer 1lev1_x' })
    ).json();
    expect(data.rikma.canonicalPath).toBe('/api/v1/r/57');
    expect(data.endpoints.products).toBe('/api/v1/r/57/products');
  });

  it('is never stored — it reports live quota', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const response = await call({ Authorization: 'Bearer 1lev1_x' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('ETag')).toBeNull();
  });

  it('still answers when the display name cannot be read', async () => {
    mocks.execute.mockImplementation(async (qid: string) => {
      if (qid === 'rikmaApiRef') {
        return {
          data: {
            project: {
              data: {
                id: '57',
                attributes: { projectName: 'רקמת האוכל', slug: 'haohel' }
              }
            }
          }
        };
      }
      throw new Error('usersPermissionsUser is not readable');
    });
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const { data } = await (
      await call({ Authorization: 'Bearer 1lev1_x' })
    ).json();
    expect(data.user.name).toBeNull();
    expect(data.rikma.slug).toBe('haohel');
  });
});

describe('the quota it reports is the window it just spent', () => {
  it('drops by exactly one per call', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const first = await (
      await call({ Authorization: 'Bearer 1lev1_x' })
    ).json();
    const second = await (
      await call({ Authorization: 'Bearer 1lev1_x' })
    ).json();
    expect(second.data.quota.remaining).toBe(first.data.quota.remaining - 1);
    expect(second.data.quota.limit).toBe(600);
  });
});
