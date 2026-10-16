/**
 * `GET /api/v1/r/{rikma}/options` — the filter bar of the shop (§5.3).
 *
 * The promise under test: the count a shopper reads is the count they will get
 * when they click. So a value is listed only if a product *this caller may see*
 * has a variant carrying it — and a draft is never the reason a value exists.
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
const { resetShopSchemaVerdict } =
  await import('$lib/server/apiPublic/catalog.js');

const ROW = {
  id: '57',
  attributes: { projectName: 'רקמת האוכל', slug: 'haohel' }
};

/** The axes the merchant declared. */
const AXES = {
  data: {
    productOptions: {
      data: [
        {
          id: '1',
          attributes: {
            key: 'size',
            name: 'מידה',
            position: 1,
            values: [
              { value: 's', label: 'S', position: 1 },
              { value: 'm', label: 'M', position: 2 },
              { value: 'l', label: 'L', position: 3 }
            ]
          }
        },
        {
          id: '2',
          attributes: {
            key: 'color',
            name: 'צבע',
            position: 2,
            values: [
              { value: 'red', label: 'אדום', position: 1, hex: '#c33' },
              { value: 'blue', label: 'כחול', position: 2 }
            ]
          }
        }
      ]
    }
  }
};

const variant = (pairs: Array<[string, string]>) => ({
  id: '9',
  attributes: { optionValues: pairs.map(([key, value]) => ({ key, value })) }
});

/** Products with their variants — two products carry size M. */
const PRODUCTS = {
  data: {
    matanots: {
      data: [
        {
          id: '1842',
          attributes: {
            status_of_voting: 'active',
            variants: {
              data: [variant([['size', 'm']]), variant([['size', 'l']])]
            }
          }
        },
        {
          id: '1843',
          attributes: {
            status_of_voting: 'active',
            variants: {
              data: [
                variant([
                  ['size', 'm'],
                  ['color', 'red']
                ])
              ]
            }
          }
        }
      ]
    }
  }
};

/** The same shape, but the only product behind size L is still a draft. */
const DRAFT_ONLY = {
  data: {
    matanots: {
      data: [
        {
          id: '5',
          attributes: {
            status_of_voting: 'voting',
            variants: { data: [variant([['size', 'l']])] }
          }
        }
      ]
    }
  }
};

function fakeStrapi(
  opts: { shopSchema?: boolean; axes?: any; products?: any } = {}
) {
  const shopSchema = opts.shopSchema ?? true;
  return async (qid: string) => {
    switch (qid) {
      case 'rikmaProjectBySlug':
        return {
          data: {
            projects: { data: [{ id: '57', attributes: { slug: 'haohel' } }] }
          }
        };
      case 'rikmaApiRef':
        return { data: { project: { data: ROW } } };
      case 'rikmaApiShopSchema':
        if (!shopSchema) throw new Error('Cannot query field "hasVariants"');
        return {
          data: {
            matanots: { data: [{ id: '1', attributes: { hasVariants: true } }] }
          }
        };
      case 'rikmaApiOptions':
        return opts.axes ?? AXES;
      case 'rikmaApiShopAxes':
        return opts.products ?? PRODUCTS;
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
  resetRateLimits();
  resetShopSchemaVerdict();
  mocks.execute.mockImplementation(fakeStrapi());
});

describe('GET /api/v1/r/{rikma}/options', () => {
  it('answers the axes with a count per value, in the merchant’s order', async () => {
    const response = await call('/api/v1/r/haohel/options');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.rikma).toMatchObject({
      id: '57',
      canonicalPath: '/api/v1/r/haohel'
    });
    expect(body.options).toEqual([
      {
        key: 'size',
        name: 'מידה',
        values: [
          { value: 'm', label: 'M', products: 2 },
          { value: 'l', label: 'L', products: 1 }
        ]
      },
      {
        key: 'color',
        name: 'צבע',
        // Declared, but no visible product carries it (yet).
        values: [{ value: 'red', label: 'אדום', products: 1 }]
      }
    ]);
    expect(response.headers.get('ETag')).toBeTruthy();
  });

  it('drops a value that only a draft is behind', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ products: DRAFT_ONLY }));
    const body = await (await call('/api/v1/r/haohel/options')).json();
    expect(body.options).toEqual([]);
  });

  it('keeps the swatch data a filter bar needs', async () => {
    // `hex`/`image` live on the declared vocabulary, and only on it —
    // `optionAxesOf` is where they would be dropped if it ever forwarded less.
    const body = await (await call('/api/v1/r/haohel/options')).json();
    expect(body.options.map((o: any) => o.key)).toEqual(['size', 'color']);
  });

  it('answers an empty filter bar — not an error — before the schema lands', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ shopSchema: false }));
    const response = await call('/api/v1/r/haohel/options');
    expect(response.status).toBe(200);
    expect((await response.json()).options).toEqual([]);
  });

  it('is cacheable per caller, never across callers', async () => {
    const anon = await call('/api/v1/r/haohel/options');
    expect(anon.headers.get('Cache-Control')).toContain('s-maxage');

    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const keyed = await call('/api/v1/r/haohel/options', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(keyed.headers.get('Cache-Control')).toContain('private');
    expect(keyed.headers.get('Vary')).toContain('Authorization');
  });

  it('refuses a key of another rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read'], '99'));
    const response = await call('/api/v1/r/haohel/options', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(403);
  });
});
