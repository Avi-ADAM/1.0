/**
 * `GET /api/v1/r/{rikma}/categories` — the shop's own navigation (§5.2).
 *
 * The guarantee this file is here for: a category is listed only if a product
 * the caller may see is behind it. A dead filter is a worse answer than a short
 * list, and an anonymous visitor must never learn from a count that a hidden
 * product exists.
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
const { resetExposureCache } =
  await import('$lib/server/apiPublic/exposure.js');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

const ROW = {
  id: '57',
  attributes: { projectName: 'רקמת האוכל', slug: 'haohel' }
};

const workshop = { id: '4', attributes: { name: 'סדנאות' } };
const catering = { id: '9', attributes: { name: 'קייטרינג' } };

/** What the categories query returns: products, each carrying its categories. */
const ROWS = [
  {
    id: '1',
    attributes: {
      name: 'סדנה',
      appruved: true,
      categories: { data: [workshop] }
    }
  },
  {
    id: '2',
    attributes: {
      name: 'סדנה שנייה',
      appruved: true,
      categories: { data: [workshop, catering] }
    }
  }
];

// Published, but the rikma kept it out of the discovery surfaces — so an
// anonymous caller must not see its category either.
const hiddenOnly = [
  {
    id: '3',
    attributes: {
      name: 'סוד',
      appruved: true,
      hideFromDiscovery: true,
      categories: { data: [catering] }
    }
  }
];

function fakeStrapi(opts: { rows?: any[] } = {}) {
  return async (qid: string, vars: any) => {
    switch (qid) {
      case 'rikmaProjectBySlug':
        return {
          data: {
            projects: {
              data:
                vars.slug === 'haohel'
                  ? [{ id: '57', attributes: { slug: 'haohel' } }]
                  : []
            }
          }
        };
      case 'rikmaApiRef':
        return { data: { project: { data: ROW } } };
      case 'rikmaApiExposure':
        throw {
          getMessages: () => [
            'Cannot query field "exposeToApi" on type "Project"'
          ]
        };
      case 'rikmaApiCategories':
        return { data: { matanots: { data: opts.rows ?? ROWS } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
}

const call = (path: string, headers: Record<string, string> = {}) => {
  const url = new URL(`https://www.1lev1.com${path}`);
  return (GET as any)({
    params: { rikma: url.pathname.split('/')[4] },
    url,
    request: { headers: new Headers(headers) } as unknown as Request,
    fetch: vi.fn()
  });
};

const key = (scopes: string[], project = '57') => ({
  user: { id: '9' },
  keyId: '3',
  name: 'shop',
  project: { id: project },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: null
});

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetExposureCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
});

describe('GET /api/v1/r/{rikma}/categories', () => {
  it('counts the products behind each category', async () => {
    const response = await call('/api/v1/r/haohel/categories');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.rikma).toMatchObject({
      id: '57',
      canonicalPath: '/api/v1/r/haohel'
    });
    // Sorted by name, so a client renders them in a stable order.
    expect(body.data).toEqual([
      { id: '4', name: 'סדנאות', productsCount: 2 },
      { id: '9', name: 'קייטרינג', productsCount: 1 }
    ]);
    expect(response.headers.get('ETag')).toBeTruthy();
  });

  it('drops a category that only hidden products carry', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ rows: hiddenOnly }));
    const body = await (await call('/api/v1/r/haohel/categories')).json();
    expect(body.data).toEqual([]);
  });

  it('is cacheable per caller, never across callers', async () => {
    const anon = await call('/api/v1/r/haohel/categories');
    expect(anon.headers.get('Cache-Control')).toContain('s-maxage');

    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const keyed = await call('/api/v1/r/haohel/categories', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(keyed.headers.get('Cache-Control')).toContain('private');
    expect(keyed.headers.get('Vary')).toContain('Authorization');
  });

  it('moves a stale address, keeping the sub-path', async () => {
    const response = await call('/api/v1/r/Haohel/categories');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      '/api/v1/r/haohel/categories'
    );
  });

  it('answers 404 for a rikma nobody has', async () => {
    const response = await call('/api/v1/r/nobody/categories');
    expect(response.status).toBe(404);
  });

  it('refuses a key pinned to another rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read'], '88'));
    const response = await call('/api/v1/r/haohel/categories', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
  });

  it('answers 304 to a tag it issued', async () => {
    const first = await call('/api/v1/r/haohel/categories');
    const second = await call('/api/v1/r/haohel/categories', {
      'If-None-Match': first.headers.get('ETag')!
    });
    expect(second.status).toBe(304);
  });
});
