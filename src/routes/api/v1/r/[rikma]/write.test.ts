/**
 * The write API at the rikma's own address (§5.8): `/api/v1/r/{rikma}/sales`
 * and `/api/v1/r/{rikma}/tasks`.
 *
 * The body of the request is the same body the legacy address takes — that is
 * the point of the migration. What this file exists for is the *address*: the
 * path names a tenant, and the key must be that tenant's.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  executeAction: vi.fn(),
  verifyApiKeyDetailed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
  env: { ADMINMONTHER: 'test-admin' }
}));
vi.mock('$lib/server/actions/index.js', () => ({
  strapiClient: { execute: mocks.execute },
  actionService: { executeAction: mocks.executeAction }
}));
vi.mock('$lib/server/apiKeys.js', () => ({
  verifyApiKeyDetailed: mocks.verifyApiKeyDetailed,
  touchLastUsed: mocks.touchLastUsed,
  assertScope: (key: any, scope: string) =>
    Array.isArray(key.scopes) && key.scopes.includes(scope)
}));

const { POST: SALE } = await import('./sales/+server');
const { POST: TASK } = await import('./tasks/+server');
const { GET: STATUS } = await import('./tasks/[externalId]/+server');
const { clearQueryCache } = await import('$lib/server/apiPublic/cache.js');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

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

const SALE_BODY = {
  productId: '1842',
  holderUserId: '12',
  amount: 320,
  quantity: 1,
  externalId: 'ORDER-1'
};
const TASK_BODY = {
  name: 'כרטיס מהאתר',
  externalId: 'TICKET-1',
  urgency: 'yellow'
};

function fakeStrapi({ productInRikma = true } = {}) {
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
      case 'salesApiProductInfo':
        return {
          data: {
            project: {
              data: {
                attributes: {
                  matanotofs: {
                    data: productInRikma
                      ? [
                          {
                            id: '1842',
                            attributes: { quant: 6, kindOf: 'total' }
                          }
                        ]
                      : []
                  }
                }
              }
            }
          }
        };
      case 'saleByExternalId':
        return { data: { sales: { data: [] } } };
      case 'tasksApiActByExternalId':
        return { data: { acts: { data: [] } } };
      case 'tasksApiProjectRefs':
        return {
          data: {
            project: {
              data: {
                attributes: {
                  user_1s: { data: [] },
                  tafkidims: { data: [] },
                  mesimabetahaliches: { data: [] }
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

const requestStub = (headers: Record<string, string>, body?: unknown) =>
  ({
    headers: new Headers(headers),
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    }
  }) as unknown as Request;

const call = (
  handler: any,
  args: { params?: Record<string, string> },
  headers: Record<string, string>,
  body?: unknown
) =>
  handler({
    ...args,
    params: { rikma: 'haohel', externalId: 'TICKET-1', ...(args.params ?? {}) },
    request: requestStub(headers, body),
    fetch: vi.fn()
  });

/**
 * Both outcomes of a handler, in one shape: SvelteKit's `error()` throws an
 * `HttpError` (the legacy routes always did), while the new refusals come back
 * as responses. A test should read the same either way.
 */
const attempt = async (
  p: Promise<unknown>
): Promise<{ status: number; body: any }> => {
  try {
    const response = (await p) as Response;
    return {
      status: response.status,
      body: await response.json().catch(() => null)
    };
  } catch (e: any) {
    return { status: e?.status ?? 500, body: e?.body ?? null };
  }
};

const status = async (p: Promise<unknown>) => (await attempt(p)).status;

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
  mocks.verifyApiKeyDetailed.mockResolvedValue(
    key(['sales:report', 'tasks:create', 'tasks:read'])
  );
  mocks.executeAction.mockResolvedValue({
    success: true,
    data: { saleId: '501', holderStatus: 'pending', id: '777' }
  });
});

describe('POST /api/v1/r/{rikma}/sales', () => {
  it('reports the sale through the same handler, under the path’s rikma', async () => {
    const response = await call(
      SALE,
      {},
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      duplicated: false,
      saleId: '501',
      holderStatus: 'pending'
    });
    // No deprecation on the address that is the destination of the migration.
    expect(response.headers.get('Deprecation')).toBeNull();
    expect(response.headers.get('Link')).toBeNull();
  });

  it('refuses a key minted for another rikma — and files nothing', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['sales:report'], '88'));
    const response = await call(
      SALE,
      {},
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('answers 404 for a rikma nobody has, before touching the key’s budget', async () => {
    const response = await call(
      SALE,
      {},
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(response.status).toBe(201);

    const missing = await call(
      SALE,
      { params: { rikma: 'nobody' } },
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe('RIKMA_NOT_FOUND');
    expect(mocks.executeAction).toHaveBeenCalledTimes(1);
  });

  it('takes a numeric id as the same rikma', async () => {
    const response = await call(
      SALE,
      { params: { rikma: '57' } },
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(response.status).toBe(201);
  });

  it('needs no redirect for a differently-spelled path — it answers in place', async () => {
    // A 301 on a POST may be replayed as a GET: a sale that was never reported
    // must never look reported.
    const response = await call(
      SALE,
      { params: { rikma: 'Haohel' } },
      { Authorization: 'Bearer 1lev1_x' },
      SALE_BODY
    );
    expect(response.status).toBe(201);
  });
});

describe('POST /api/v1/r/{rikma}/tasks', () => {
  it('opens the task under the path’s rikma', async () => {
    const response = await call(
      TASK,
      {},
      { Authorization: 'Bearer 1lev1_x' },
      TASK_BODY
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      success: true,
      duplicated: false,
      taskId: '777'
    });
    expect(mocks.executeAction).toHaveBeenCalledWith(
      'createTask',
      expect.objectContaining({ projectId: '57', name: 'כרטיס מהאתר' }),
      expect.objectContaining({ userId: '9' })
    );
  });

  it('refuses a key minted for another rikma — and proposes nothing', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['tasks:create'], '88'));
    const response = await call(
      TASK,
      {},
      { Authorization: 'Bearer 1lev1_x' },
      TASK_BODY
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/r/{rikma}/tasks/{externalId}', () => {
  it('answers 404 for an externalId this rikma does not have', async () => {
    const response = await attempt(
      call(STATUS, {}, { Authorization: 'Bearer 1lev1_x' })
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toContain('TICKET-1');
  });

  it('refuses a key minted for another rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['tasks:read'], '88'));
    const response = await call(
      STATUS,
      {},
      { Authorization: 'Bearer 1lev1_x' }
    );
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('RIKMA_MISMATCH');
  });

  it('answers 404 for an unknown rikma without ever looking up the task', async () => {
    await attempt(
      call(
        STATUS,
        { params: { rikma: 'nobody' } },
        { Authorization: 'Bearer 1lev1_x' }
      )
    );
    const taskLookups = mocks.execute.mock.calls.filter(
      ([qid]) => qid === 'tasksApiActByExternalId'
    );
    expect(taskLookups).toEqual([]);
  });

  it('still 404s a path that cannot be a rikma at all', async () => {
    expect(
      await status(
        call(
          STATUS,
          { params: { rikma: 'not a slug' } },
          { Authorization: 'Bearer 1lev1_x' }
        )
      )
    ).toBe(404);
  });
});
