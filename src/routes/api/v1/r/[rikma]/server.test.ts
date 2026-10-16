/**
 * `GET /api/v1/r/{rikma}` — the front door (§5.2).
 *
 * What is worth testing here is not the DTO (that is `dto.test.ts`'s job) but
 * the promises the profile alone makes: it carries the `look`, its product
 * count is the count *this caller* may see, and a count that cannot be read
 * still answers 200 — the profile is the page, the count is a nicety.
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

// What is stored is JSON a member proposed; `parseLook` is the only way in,
// so the test asserts the normalised result, not the stored string.
const LOOK = { focus: 'product', style: { hue: '#b06a3b' } };

const PROFILE = {
  projectName: 'רקמת האוכל',
  publicDescription: 'מטבח קהילתי שמכין אוכל אמיתי',
  city: 'נתניה',
  currencyCode: 'ILS',
  supportPage: '/haohel/support',
  updatedAt: '2026-10-12T07:00:00.000Z',
  location: {
    lat: 32.32,
    lng: 34.85,
    radius: 9000,
    location_hint: 'ליד השוק',
    location_mode: 'physical'
  },
  look: JSON.stringify(LOOK)
};

const ROW = {
  id: '57',
  attributes: { projectName: 'רקמת האוכל', slug: 'haohel', ...PROFILE }
};

/** `count` products come back from the list query the profile reuses. */
function fakeStrapi(
  opts: { profileFails?: boolean; productRows?: any[] } = {}
) {
  const rows = opts.productRows ?? [
    {
      id: '1842',
      attributes: {
        name: 'סדנה',
        price: 320,
        appruved: true,
        updatedAt: '2026-10-14T08:12:00.000Z'
      }
    }
  ];
  return async (qid: string, vars: any) => {
    switch (qid) {
      case 'rikmaProjectBySlug':
        return {
          data: {
            projects: { data: [{ id: '57', attributes: { slug: 'haohel' } }] }
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
      case 'rikmaApiProject':
        if (opts.profileFails) throw { getMessages: () => ['boom'] };
        return {
          data: { project: { data: { id: '57', attributes: ROW.attributes } } }
        };
      case 'rikmaApiProducts':
        return {
          data: {
            matanots: {
              data: rows,
              meta: {
                pagination: {
                  page: 1,
                  pageCount: 1,
                  pageSize: 1,
                  total: rows.length
                }
              }
            }
          }
        };
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

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetExposureCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
});

describe('GET /api/v1/r/{rikma}', () => {
  it('describes the shop, with the look (§5.3)', async () => {
    const response = await call('/api/v1/r/haohel');
    expect(response.status).toBe(200);

    const { data } = await response.json();
    expect(data).toMatchObject({
      id: '57',
      slug: 'haohel',
      name: 'רקמת האוכל',
      canonicalPath: '/api/v1/r/haohel',
      about: 'מטבח קהילתי שמכין אוכל אמיתי',
      url: 'https://www.1lev1.com/r/haohel',
      city: 'נתניה',
      location: {
        lat: 32.32,
        lng: 34.85,
        radius: 9000,
        hint: 'ליד השוק',
        isOnline: false
      },
      supportPage: '/haohel/support',
      currency: 'ILS',
      productsCount: 1
    });
    // The look leaves through `parseLook`, so what comes back is a look —
    // never the raw JSON somebody stored.
    expect(data.look).toMatchObject({
      v: 1,
      focus: 'product',
      style: { hue: '#b06a3b' }
    });
    expect(Object.keys(data).sort()).toEqual([
      'about',
      'canonicalPath',
      'city',
      'currency',
      'id',
      'location',
      'look',
      'name',
      'productsCount',
      'slug',
      'supportPage',
      'url'
    ]);
    expect(response.headers.get('ETag')).toBeTruthy();
  });

  it('answers 200 with productsCount: null when the count cannot be read', async () => {
    // The count comes from the list query; make just that one fail.
    const base = fakeStrapi();
    mocks.execute.mockImplementation(async (qid: string, vars: any) =>
      qid === 'rikmaApiProducts'
        ? Promise.reject({ getMessages: () => ['nope'] })
        : base(qid, vars)
    );

    const response = await call('/api/v1/r/haohel');
    expect(response.status).toBe(200);
    expect((await response.json()).data.productsCount).toBeNull();
  });

  it('answers 502 when the rikma itself cannot be read', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ profileFails: true }));
    const response = await call('/api/v1/r/haohel');
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('UPSTREAM_ERROR');
  });

  it('moves a stale address and says where it moved to', async () => {
    const response = await call('/api/v1/r/Haohel?locale=en');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/api/v1/r/haohel?locale=en');
    expect(response.headers.get('X-1lev1-Rikma-Canonical')).toBe(
      '/api/v1/r/haohel'
    );
  });

  it('answers 304 to a tag it issued', async () => {
    const first = await call('/api/v1/r/haohel');
    const second = await call('/api/v1/r/haohel', {
      'If-None-Match': first.headers.get('ETag')!
    });
    expect(second.status).toBe(304);
  });

  it('refuses a key pinned to another rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue({
      user: { id: '9' },
      keyId: '3',
      name: 'shop',
      project: { id: '88' },
      scopes: ['products:read'],
      revoked: false,
      allowedOrigins: [],
      lastUsedAt: null
    });
    const response = await call('/api/v1/r/haohel', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
  });

  it('answers the OPTIONS preflight', async () => {
    const { OPTIONS } = await import('./+server');
    const response = await (OPTIONS as any)({});
    expect(response.status).toBe(204);
  });
});
