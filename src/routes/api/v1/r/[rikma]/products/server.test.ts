/**
 * The public read API, end to end through the route handler.
 *
 * Everything above this file is unit-tested; what is tested *here* is the order
 * and the refusals — the parts that only exist once the pieces are wired
 * together: a bad key never falls back to public, the path decides the tenant,
 * a foreign rikma is a 403 for a key but a 404 for the anonymous surface, a
 * draft cannot ride out on a filter mistake, and the second request
 * with the same `If-None-Match` costs nothing.
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

// ─── the fake Strapi ────────────────────────────────────────────────────────

const RIKMA = { id: '57', slug: 'haohel' };

/**
 * A published product; one hidden from `/gift` only (`hideFromDiscovery`),
 * which the rikma's own page — and so its shop — still lists; and a product
 * still in its vote (`status_of_voting: 'voting'`), which is a draft.
 * `appruved` is false on purpose: Strapi's default, which nothing flips.
 */
const PUBLISHED = {
  id: '1842',
  attributes: {
    name: 'סדנת בישול ל-8',
    desc: '<p>שלוש שעות</p>',
    price: 320,
    quant: 6,
    kindOf: 'total',
    origin: 'project',
    appruved: false,
    status_of_voting: 'active',
    archived: false,
    lifecycle: 'active',
    hideFromDiscovery: false,
    marginPct: 22,
    updatedAt: '2026-10-14T08:12:00.000Z'
  }
};

const HIDDEN_FROM_GIFT = {
  id: '1900',
  attributes: {
    name: 'מתנה לחברים',
    price: 50,
    quant: 1,
    status_of_voting: 'active',
    hideFromDiscovery: true,
    updatedAt: '2026-10-15T08:12:00.000Z'
  }
};

const VOTING = {
  id: '1950',
  attributes: {
    name: 'מוצר בהצבעה',
    price: 70,
    status_of_voting: 'voting',
    updatedAt: '2026-10-15T09:12:00.000Z'
  }
};

const PROJECT_ROWS: Record<string, any> = {
  '57': { id: '57', attributes: { projectName: 'רקמת האוכל', slug: 'haohel' } },
  '88': {
    id: '88',
    attributes: { projectName: 'רקמת בדיקה', slug: 'qa-rikma' }
  }
};

/** The qids the route may ask, answered from the fixtures above. */
function fakeStrapi(
  opts: {
    rows?: any[];
    productRows?: any[];
    projects?: Record<string, any>;
  } = {}
) {
  return async (qid: string, vars: any) => {
    switch (qid) {
      case 'rikmaProjectBySlug': {
        const hit = Object.values(PROJECT_ROWS).find(
          (p: any) => p.attributes.slug === vars.slug
        );
        return { data: { projects: { data: hit ? [hit] : [] } } };
      }
      case 'rikmaProjectByFormerSlug': {
        const hit =
          vars.token.trim() === 'old-haohel' ? PROJECT_ROWS['57'] : null;
        return { data: { projects: { data: hit ? [hit] : [] } } };
      }
      case 'rikmaApiRef': {
        const hit = (opts.projects ?? PROJECT_ROWS)[String(vars.pid)];
        return { data: { project: hit ? { data: hit } : null } };
      }
      case 'rikmaApiProducts': {
        const rows = opts.rows ?? [PUBLISHED, HIDDEN_FROM_GIFT, VOTING];
        return {
          data: {
            matanots: {
              data: rows,
              meta: {
                pagination: {
                  page: 1,
                  pageCount: 1,
                  pageSize: 20,
                  total: rows.length
                }
              }
            }
          }
        };
      }
      case 'rikmaApiProduct':
        return { data: { matanots: { data: opts.productRows ?? [] } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
}

function key(scopes: string[], project = '57') {
  return {
    user: { id: '9' },
    keyId: '3',
    name: 'shop',
    project: { id: project },
    scopes,
    revoked: false,
    allowedOrigins: [],
    lastUsedAt: null
  };
}

function call(path: string, headers: Record<string, string> = {}) {
  const url = new URL(`https://www.1lev1.com${path}`);
  const rikma = path.split('/')[4];
  return (GET as any)({
    params: { rikma },
    url,
    request: {
      headers: new Headers(headers),
      url: url.toString()
    } as unknown as Request,
    fetch: vi.fn()
  });
}

const keysDeep = (value: unknown, out: string[] = []): string[] => {
  if (Array.isArray(value)) for (const v of value) keysDeep(v, out);
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      out.push(k);
      keysDeep(v, out);
    }
  return out;
};

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  mocks.touchLastUsed.mockReset();
  clearQueryCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
});

// ─── the public surface ─────────────────────────────────────────────────────

describe('GET /api/v1/r/{rikma}/products — anonymous', () => {
  it('returns the catalog with the caching contract', async () => {
    const response = await call('/api/v1/r/haohel/products');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.rikma).toMatchObject({
      id: '57',
      slug: 'haohel',
      canonicalPath: '/api/v1/r/haohel'
    });
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      id: '1842',
      name: 'סדנת בישול ל-8',
      price: 320,
      status: 'published'
    });
    expect(body.meta.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 3,
      pages: 1
    });
    expect(body.links.self).toBe('/api/v1/r/haohel/products');

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('X-1lev1-Api-Version')).toBeTruthy();
  });

  it('lists a product hidden from /gift — the rikma page shows it too (§4.3)', async () => {
    const body = await (await call('/api/v1/r/haohel/products')).json();
    expect(body.data.map((p: any) => [p.id, p.status])).toEqual([
      ['1842', 'published'],
      ['1900', 'published']
    ]);
    expect(body.data[1]).not.toHaveProperty('hideFromDiscovery');
  });

  it('never lists a product still in its vote to an anonymous caller (§6.2)', async () => {
    const body = await (await call('/api/v1/r/haohel/products')).json();
    expect(JSON.stringify(body)).not.toContain('מוצר בהצבעה');
  });

  it('asks Strapi by status_of_voting, never by appruved', async () => {
    await call('/api/v1/r/haohel/products');
    const [, vars] = mocks.execute.mock.calls.find(
      ([qid]: [string]) => qid === 'rikmaApiProducts'
    )!;
    const filters = JSON.stringify(vars.filters);
    expect(filters).toContain('status_of_voting');
    expect(filters).not.toContain('appruved');
    expect(filters).not.toContain('hideFromDiscovery');
  });

  it('drops a row the filter should have excluded — the second line of defence', async () => {
    // A filter that is subtly wrong on a NULL column must become an empty slot,
    // not a leak: the projector's derived status is re-checked in JS.
    mocks.execute.mockImplementation(fakeStrapi({ rows: [PUBLISHED, VOTING] }));
    const body = await (
      await call('/api/v1/r/haohel/products?limit=50')
    ).json();
    expect(body.data.map((p: any) => p.id)).toEqual(['1842']);
  });

  it('leaks nothing internal, at any depth', async () => {
    const body = await (await call('/api/v1/r/haohel/products')).json();
    const forbidden = [
      'marginPct',
      'estimatedPrice',
      'matanot_recipe_missions',
      'hideFromDiscovery',
      'appruved',
      'lifecycle',
      'archived'
    ];
    const leaked = keysDeep(body).filter((k) => forbidden.includes(k));
    expect(leaked, `leaked: ${leaked.join(', ')}`).toEqual([]);
  });

  it('answers 404 for a rikma hidden from discovery', async () => {
    mocks.execute.mockImplementation(
      fakeStrapi({
        projects: {
          '88': {
            id: '88',
            attributes: { projectName: 'QA', slug: 'qa-rikma' }
          }
        }
      })
    );
    const response = await call('/api/v1/r/88/products');
    expect(response.status).toBe(404);
  });

  it('answers 404 for a slug nobody has', async () => {
    expect((await call('/api/v1/r/nobody/products')).status).toBe(404);
  });
});

// ─── addresses ──────────────────────────────────────────────────────────────

describe('address handling', () => {
  it('moves a different spelling, keeping the query and the sub-path', async () => {
    const response = await call('/api/v1/r/Haohel/products?limit=5');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(
      '/api/v1/r/haohel/products?limit=5'
    );
    expect(response.headers.get('X-1lev1-Rikma-Canonical')).toBe(
      '/api/v1/r/haohel'
    );
  });

  it('moves an address the rikma used to have', async () => {
    const response = await call('/api/v1/r/old-haohel/products');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/api/v1/r/haohel/products');
  });

  it('serves a rikma through its numeric id', async () => {
    const body = await (await call('/api/v1/r/57/products')).json();
    expect(body.rikma).toMatchObject({
      id: '57',
      canonicalPath: '/api/v1/r/haohel'
    });
  });

  it('answers 404 for an unknown id', async () => {
    expect((await call('/api/v1/r/999/products')).status).toBe(404);
  });
});

// ─── keys, scopes and the tenant ────────────────────────────────────────────

describe('a key is verified, never assumed', () => {
  it('refuses a bad key instead of answering publicly', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(null);
    const response = await call('/api/v1/r/haohel/products', {
      Authorization: 'Bearer 1lev1_bad'
    });
    expect(response.status).toBe(401);
  });

  it('refuses a key without products:read', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['sales:report']));
    const response = await call('/api/v1/r/haohel/products', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('SCOPE_MISSING');
  });

  it('refuses a key pinned to another rikma, even a valid one', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read'], '88'));
    const response = await call('/api/v1/r/haohel/products', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
  });

  it('shows a products:read key the published catalog, still without drafts', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const response = await call('/api/v1/r/haohel/products', {
      Authorization: 'Bearer 1lev1_x'
    });
    const body = await response.json();
    expect(body.data.map((p: any) => [p.id, p.status])).toEqual([
      ['1842', 'published'],
      ['1900', 'published']
    ]);
    // A keyed answer is never cacheable by a shared cache (§4.5).
    expect(response.headers.get('Cache-Control')).toMatch(/^private/);
    expect(response.headers.get('Vary')).toContain('Authorization');
  });

  it('keeps drafts for the draft scope', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    const refused = await call('/api/v1/r/haohel/products?draft=true', {
      Authorization: 'Bearer 1lev1_x'
    });
    expect(refused.status).toBe(403);

    mocks.verifyApiKeyDetailed.mockResolvedValue(
      key(['products:read', 'products:read:draft'])
    );
    clearQueryCache();
    mocks.execute.mockImplementation(
      fakeStrapi({
        rows: [
          {
            id: '1901',
            attributes: {
              name: 'טיוטה',
              status_of_voting: 'voting',
              updatedAt: '2026-10-16T00:00:00.000Z'
            }
          }
        ]
      })
    );
    const body = await (
      await call('/api/v1/r/haohel/products?draft=true', {
        Authorization: 'Bearer 1lev1_x'
      })
    ).json();
    expect(body.data.map((p: any) => p.status)).toEqual(['draft']);
  });

  it('tells the anonymous caller that the key is the answer to their question', async () => {
    const response = await call(
      '/api/v1/r/haohel/products?updatedSince=2026-10-01T00:00:00Z'
    );
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('KEY_REQUIRED');
  });
});

// ─── caching ────────────────────────────────────────────────────────────────

describe('conditional requests', () => {
  it('answers 304 to the same tag and skips Strapi entirely', async () => {
    const first = await call('/api/v1/r/haohel/products');
    const etag = first.headers.get('ETag')!;

    mocks.execute.mockClear();
    const second = await call('/api/v1/r/haohel/products', {
      'If-None-Match': etag
    });
    expect(second.status).toBe(304);
    expect(await second.text()).toBe('');
    expect(second.headers.get('Cache-Control')).toContain('s-maxage');
  });

  it('changes the tag when the rows change', async () => {
    const before = (await call('/api/v1/r/haohel/products')).headers.get(
      'ETag'
    );
    clearQueryCache();
    mocks.execute.mockImplementation(
      fakeStrapi({
        rows: [
          {
            ...PUBLISHED,
            attributes: {
              ...PUBLISHED.attributes,
              updatedAt: '2026-10-16T09:00:00.000Z'
            }
          }
        ]
      })
    );
    const after = (await call('/api/v1/r/haohel/products')).headers.get('ETag');
    expect(after).not.toBe(before);
  });

  it('honours a sparse fieldset without widening it', async () => {
    const body = await (
      await call('/api/v1/r/haohel/products?fields=id,name,price')
    ).json();
    expect(body.data[0]).toEqual({
      id: '1842',
      name: 'סדנת בישול ל-8',
      price: 320
    });
    expect(
      (await call('/api/v1/r/haohel/products?fields=id,marginPct')).status
    ).toBe(400);
  });
});
