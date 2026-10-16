/**
 * `POST /api/v1/sales` — the legacy address of the sales API.
 *
 * It is deprecated, not changed (§5.8): the body, the statuses and the scope
 * are the same ones the new `/api/v1/r/{rikma}/sales` answers, because it *is*
 * the same handler. What this file guards is that the migration added exactly
 * two things to the old address — the deprecation headers and one log line —
 * and took nothing away.
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

const { POST } = await import('./+server');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

const key = (scopes = ['sales:report'], project = '57') => ({
  user: { id: '9' },
  keyId: '3',
  name: 'shop',
  project: { id: project },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: null
});

const BODY = {
  productId: '1842',
  holderUserId: '12',
  amount: 320,
  quantity: 1,
  externalId: 'ORDER-1'
};

function fakeStrapi({ productInRikma = true, duplicate = false } = {}) {
  return async (qid: string) => {
    if (qid === 'salesApiProductInfo') {
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
    }
    if (qid === 'saleByExternalId') {
      return {
        data: {
          sales: {
            data: duplicate
              ? [{ id: '900', attributes: { holderStatus: 'pending' } }]
              : []
          }
        }
      };
    }
    throw new Error(`unexpected qid ${qid}`);
  };
}

/**
 * A request stub carrying headers and a body. happy-dom's `Request` drops
 * headers an agent sets (the browser forbids it), and these routes read
 * `Authorization` off the request — so the three members the handler touches
 * are supplied directly.
 */
const requestStub = (headers: Record<string, string>, body?: unknown) =>
  ({
    headers: new Headers(headers),
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return typeof body === 'string' ? JSON.parse(body) : body;
    }
  }) as unknown as Request;

const post = (
  body: unknown = BODY,
  headers: Record<string, string> = { Authorization: 'Bearer 1lev1_x' }
) => (POST as any)({ request: requestStub(headers, body), fetch: vi.fn() });

const status = async (p: Promise<unknown>) => {
  try {
    return ((await p) as Response).status;
  } catch (e: any) {
    return e?.status ?? 500;
  }
};

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  resetRateLimits();
  mocks.execute.mockImplementation(fakeStrapi());
  mocks.verifyApiKeyDetailed.mockResolvedValue(key());
  mocks.executeAction.mockResolvedValue({
    success: true,
    data: { saleId: '501', holderStatus: 'pending' }
  });
});

describe('POST /api/v1/sales — the deprecated address', () => {
  it('reports the sale exactly as it always did', async () => {
    const response = await post();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      success: true,
      duplicated: false,
      saleId: '501',
      holderStatus: 'pending'
    });
    expect(mocks.executeAction).toHaveBeenCalledWith(
      'createSale',
      expect.objectContaining({
        projectId: '57',
        productId: '1842',
        total: 320,
        source: 'api'
      }),
      expect.objectContaining({ userId: '9' })
    );
  });

  it('sends the caller to their own new address, not to a template', async () => {
    const response = await post();
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toMatch(/GMT$/);
    expect(response.headers.get('Link')).toBe(
      '</api/v1/r/57/sales>; rel="successor-version"'
    );
  });

  it('keeps answering duplicated for a retried externalId', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ duplicate: true }));
    const response = await post();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      duplicated: true,
      saleId: '900'
    });
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('still refuses an anonymous caller and a key without the scope', async () => {
    expect(
      await status(
        (POST as any)({
          request: new Request('https://www.1lev1.com/api/v1/sales', {
            method: 'POST'
          }),
          fetch: vi.fn()
        })
      )
    ).toBe(401);

    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['products:read']));
    expect(await status(post())).toBe(403);
  });

  it('still answers 404 for a product of another rikma', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ productInRikma: false }));
    expect(await status(post())).toBe(404);
  });
});
