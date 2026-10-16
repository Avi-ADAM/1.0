/**
 * One product inside one rikma — the refusals of §5.0 in particular:
 * a product of another rikma is a 404 (never a 403, which would confirm the id
 * exists somewhere), and so is a product this caller may not see.
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

const RIKMA_ROW = {
  id: '57',
  attributes: { projectName: 'רקמת האוכל', slug: 'haohel' }
};

const PRODUCT = {
  id: '1842',
  attributes: {
    name: 'סדנת בישול ל-8',
    desc: '<p>שלוש שעות</p>',
    price: 320,
    quant: 6,
    status_of_voting: 'active',
    lifecycle: 'active',
    updatedAt: '2026-10-14T08:12:00.000Z'
  }
};

/** A product of another rikma never comes back: the qid itself scopes it. */
function fakeStrapi(rows: any[] = [PRODUCT]) {
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
      case 'rikmaProjectByFormerSlug':
        return { data: { projects: { data: [] } } };
      case 'rikmaApiRef':
        return {
          data: {
            project:
              String(vars.pid) === '57' ? { data: { ...RIKMA_ROW } } : null
          }
        };
      case 'rikmaApiProduct':
        // The real query returns nothing for a product that is not of $pid.
        return {
          data: { matanots: { data: String(vars.pid) === '57' ? rows : [] } }
        };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
}

function call(path: string, headers: Record<string, string> = {}) {
  const url = new URL(`https://www.1lev1.com${path}`);
  const parts = url.pathname.split('/');
  return (GET as any)({
    params: { rikma: parts[4], productId: parts[6] },
    url,
    request: { headers: new Headers(headers) } as unknown as Request,
    fetch: vi.fn()
  });
}

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
});

describe('GET /api/v1/r/{rikma}/products/{productId}', () => {
  it('returns the product with its DTO and a cacheable answer', async () => {
    const response = await call('/api/v1/r/haohel/products/1842');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      id: '1842',
      name: 'סדנת בישול ל-8',
      status: 'published',
      price: 320,
      availability: { unlimited: false, quantity: 6 },
      url: 'https://www.1lev1.com/gift/1842'
    });
    expect(response.headers.get('ETag')).toBeTruthy();
  });

  it('answers 404 for a product of another rikma', async () => {
    // Same id shape, a rikma the product does not belong to: the query returns
    // no row, and the API must not say "it exists but not for you".
    mocks.execute.mockImplementation(fakeStrapi([]));
    const response = await call('/api/v1/r/57/products/1842');
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('answers 404 for a product this caller may not see', async () => {
    mocks.execute.mockImplementation(
      fakeStrapi([
        { id: '1900', attributes: { name: 'טיוטה', status_of_voting: 'voting' } }
      ])
    );
    expect((await call('/api/v1/r/haohel/products/1900')).status).toBe(404);
  });

  it('shows a product hidden from /gift to anyone — its page is public (§4.3)', async () => {
    mocks.execute.mockImplementation(
      fakeStrapi([
        {
          id: '1901',
          attributes: { name: 'מוסתר', status_of_voting: 'active', hideFromDiscovery: true }
        }
      ])
    );
    const response = await call('/api/v1/r/haohel/products/1901');
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe('published');
  });

  it('shows an archived product to a key that asks for its rikma', async () => {
    mocks.execute.mockImplementation(
      fakeStrapi([
        {
          id: '1900',
          attributes: { name: 'בארכיון', status_of_voting: 'active', lifecycle: 'released' }
        }
      ])
    );
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
    const response = await call('/api/v1/r/haohel/products/1900', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe('archived');
  });

  it('refuses a product id that is not one, before asking Strapi anything', async () => {
    const response = await call('/api/v1/r/haohel/products/../../etc/passwd');
    expect(response.status).toBe(404);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('moves a different spelling without losing the product', async () => {
    const response = await call('/api/v1/r/Haohel/products/1842?locale=en');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      '/api/v1/r/haohel/products/1842?locale=en'
    );
  });

  it('honours a sparse fieldset', async () => {
    const body = await (
      await call('/api/v1/r/haohel/products/1842?fields=name,seller.type')
    ).json();
    expect(body.data).toEqual({
      id: '1842',
      name: 'סדנת בישול ל-8',
      seller: { type: 'rikma' }
    });
  });

  it('answers 304 to a matching tag', async () => {
    const first = await call('/api/v1/r/haohel/products/1842');
    const second = await call('/api/v1/r/haohel/products/1842', {
      'If-None-Match': first.headers.get('ETag')!
    });
    expect(second.status).toBe(304);
  });
});
