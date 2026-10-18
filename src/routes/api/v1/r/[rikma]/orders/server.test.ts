/**
 * `POST /api/v1/r/{rikma}/orders` and `GET /orders/{ref}` (§5.4) — the HTTP
 * contract around `createPaidOrder`: who may call, from where, and which
 * status each refusal becomes. The writes themselves are tested against an
 * in-memory Strapi in createPaidOrder.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  executeAction: vi.fn(),
  verifyApiKeyDetailed: vi.fn(),
  touchLastUsed: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'test-admin' } }));
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
const { GET } = await import('./[ref]/+server');
const { POST: CANCEL } = await import('./[ref]/cancel/+server');
const { clearQueryCache } = await import('$lib/server/apiPublic/cache.js');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');
const { resetShopSchemaVerdict } = await import('$lib/server/apiPublic/catalog.js');

const key = (scopes: string[], project = '57') => ({
  user: { id: '9' },
  keyId: '3',
  name: 'shop-server',
  project: { id: project },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: null
});

const BODY = {
  externalId: 'pi_1',
  delivery: { preference: 'pickup' },
  lines: [{ productId: '1842', variantId: '77', quantity: 2, unitPrice: 310 }]
};

const ORDER_NODE = {
  id: '100',
  attributes: {
    ref: '57:pi_1',
    externalId: 'pi_1',
    status: 'shipped',
    oversold: false,
    total: 620,
    currencyCode: 'ILS',
    buyerPhone: '050-0000000',
    lines: { data: [] },
    sales: { data: [] }
  }
};

function fakeStrapi({ schemaLive = true, ordersLive = true } = {}) {
  return async (qid: string, vars: any) => {
    switch (qid) {
      case 'rikmaProjectBySlug':
        return {
          data: {
            projects: {
              data: vars.slug === 'haohel' ? [{ id: '57', attributes: { slug: 'haohel' } }] : []
            }
          }
        };
      case 'rikmaProjectByFormerSlug':
        return { data: { projects: { data: [] } } };
      case 'rikmaApiShopSchema':
        if (!schemaLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "hasVariants"');
        return { data: { matanots: { data: [{ id: '1', attributes: { hasVariants: false } }] } } };
      case 'rikmaApiOrdersSchema':
        if (!ordersLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "displayNumber"');
        return { data: { orders: { data: [] } } };
      case 'rikmaApiOrderByRef':
        return { data: { orders: { data: vars.ref === '57:pi_1' ? [ORDER_NODE] : [] } } };
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
}

const request = (headers: Record<string, string>, body?: unknown) =>
  ({
    headers: new Headers(headers),
    json: async () => {
      if (body === undefined) throw new Error('no body');
      return body;
    }
  }) as unknown as Request;

const attempt = async (p: unknown): Promise<{ status: number; body: any }> => {
  try {
    const response = (await p) as Response;
    return { status: response.status, body: await response.json().catch(() => null) };
  } catch (e: any) {
    return { status: e?.status ?? 500, body: e?.body ?? null };
  }
};

const post = (headers: Record<string, string>, body: unknown = BODY, rikma = 'haohel') =>
  attempt(
    POST({ params: { rikma }, request: request(headers, body), fetch: vi.fn() } as any)
  );
const get = (headers: Record<string, string>, ref: string) =>
  attempt(GET({ params: { rikma: 'haohel', ref }, request: request(headers), fetch: vi.fn() } as any));

const AUTH = { Authorization: 'Bearer 1lev1_server' };

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetRateLimits();
  resetShopSchemaVerdict();
  mocks.execute.mockImplementation(fakeStrapi());
  mocks.verifyApiKeyDetailed.mockResolvedValue(key(['orders:create', 'orders:read']));
  mocks.executeAction.mockResolvedValue({
    success: true,
    data: {
      duplicated: false,
      orderRef: '57:pi_1',
      status: 'paid',
      oversold: false,
      total: 620,
      currency: 'ILS',
      lines: [{ productId: '1842', variantId: '77', quantity: 2, saleId: '5521' }]
    }
  });
});

describe('POST /orders', () => {
  it('records the order as the key owner, under the key’s rikma', async () => {
    const r = await post(AUTH);
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ success: true, duplicated: false, orderRef: '57:pi_1', status: 'paid' });
    const [actionKey, params, ctx] = mocks.executeAction.mock.calls[0];
    expect(actionKey).toBe('createPaidOrder');
    expect(params.projectId).toBe('57');
    expect(params.order.externalId).toBe('pi_1');
    expect(ctx.userId).toBe('9');
  });

  it('answers a retry of the same charge with 200 duplicated', async () => {
    mocks.executeAction.mockResolvedValue({
      success: true,
      data: { duplicated: true, orderRef: '57:pi_1', status: 'paid', lines: [] }
    });
    const r = await post(AUTH);
    expect(r.status).toBe(200);
    expect(r.body.duplicated).toBe(true);
  });

  it('refuses a browser outright — an orders key does not belong in a page', async () => {
    const r = await post({ ...AUTH, Origin: 'https://haohel.example' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('needs the orders:create scope', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['sales:report', 'orders:read']));
    expect((await post(AUTH)).status).toBe(403);
  });

  it('keeps the key in its own rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['orders:create'], '99'));
    const r = await post(AUTH);
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('RIKMA_MISMATCH');
  });

  it('says the shop is not ready while the schema is not deployed', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ schemaLive: false }));
    const r = await post(AUTH);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('SHOP_NOT_READY');
  });

  it('says the shop is not ready while the order columns are not deployed', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ ordersLive: false }));
    const r = await post(AUTH);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('SHOP_NOT_READY');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('passes the storefront order number through and answers both numbers', async () => {
    mocks.executeAction.mockResolvedValue({
      success: true,
      data: { duplicated: false, orderId: '312', displayNumber: '1042', orderRef: '57:pi_1', status: 'paid', lines: [] }
    });
    const r = await post(AUTH, { ...(BODY as any), displayNumber: '1042' });
    expect(r.status).toBe(201);
    expect(mocks.executeAction.mock.calls[0][1].order.displayNumber).toBe('1042');
    expect(r.body.orderId).toBe('312');
    expect(r.body.displayNumber).toBe('1042');
  });

  it('returns every field problem in one 400', async () => {
    const r = await post(AUTH, { lines: [{ productId: '1842', quantity: 0 }] });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION');
    expect(r.body.error.details.problems.length).toBeGreaterThanOrEqual(3);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it.each([
    ['PRODUCT_NOT_FOUND', 404],
    ['VARIANT_NOT_FOUND', 404],
    ['NOT_CHECKOUTABLE', 409],
    ['VARIANT_REQUIRED', 409],
    ['EXTERNAL_ID_CONFLICT', 409]
  ])('maps %s to %i', async (code, expected) => {
    mocks.executeAction.mockResolvedValue({
      success: false,
      error: { code, message: 'no', details: { line: 0 } }
    });
    const r = await post(AUTH);
    expect(r.status).toBe(expected);
    expect(r.body.error).toMatchObject({ code, details: { line: 0 } });
  });

  it('turns an unexpected failure into a retryable 502', async () => {
    mocks.executeAction.mockResolvedValue({ success: false, error: { code: 'STRAPI_ERROR', message: 'x' } });
    const r = await post(AUTH);
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe('UPSTREAM_ERROR');
    expect(r.body.error.message).toMatch(/same externalId/);
  });
});

describe('GET /orders/{ref}', () => {
  it('reads the order — without the buyer', async () => {
    const r = await get(AUTH, '57:pi_1');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ orderRef: '57:pi_1', status: 'shipped', total: 620 });
    expect(JSON.stringify(r.body)).not.toContain('050-0000000');
  });

  it("is 404 for another rikma's ref, without asking Strapi", async () => {
    const r = await get(AUTH, '58:pi_1');
    expect(r.status).toBe(404);
    expect(mocks.execute.mock.calls.map(([qid]) => qid)).not.toContain('rikmaApiOrderByRef');
  });

  it('is 404 for an unknown ref', async () => {
    expect((await get(AUTH, '57:nope')).status).toBe(404);
  });

  it('needs orders:read', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['orders:create']));
    expect((await get(AUTH, '57:pi_1')).status).toBe(403);
  });
});

describe('POST /orders/{ref}/cancel', () => {
  const cancel = (headers: Record<string, string>, ref = '57:pi_1', body: unknown = { reason: 'הקונה ביטל' }) =>
    attempt(CANCEL({ params: { rikma: 'haohel', ref }, request: request(headers, body), fetch: vi.fn() } as any));

  beforeEach(() => {
    mocks.executeAction.mockResolvedValue({
      success: true,
      data: {
        orderRef: '57:pi_1',
        status: 'cancelled',
        alreadyCancelled: false,
        restocked: true,
        refunds: { reset: ['1', '2'], afterSplit: ['3'], notMine: [], already: [] }
      }
    });
  });

  it('cancels as the key owner and says what the rikma still has to settle', async () => {
    const r = await cancel(AUTH);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'cancelled', restocked: true, refunds: { reset: 2, leftForRikma: 1 } });
    const [actionKey, params, ctx] = mocks.executeAction.mock.calls[0];
    expect(actionKey).toBe('cancelOrder');
    expect(params).toEqual({ projectId: '57', orderRef: '57:pi_1', reason: 'הקונה ביטל' });
    expect(ctx.userId).toBe('9');
  });

  it('needs orders:create — a read key cannot refund', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['orders:read']));
    expect((await cancel(AUTH)).status).toBe(403);
  });

  it('refuses a browser like the rest of /orders', async () => {
    expect((await cancel({ ...AUTH, Origin: 'https://x.example' })).status).toBe(403);
  });

  it("is 404 for another rikma's ref", async () => {
    expect((await cancel(AUTH, '58:pi_1')).status).toBe(404);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('refuses a restock that is not a boolean', async () => {
    expect((await cancel(AUTH, '57:pi_1', { restock: 'yes' })).status).toBe(400);
  });

  it.each([
    ['NOT_HOLDER', 403],
    ['ORDER_CANCELLED', 409],
    ['NOT_FOUND', 404]
  ])('maps %s to %i', async (code, expected) => {
    mocks.executeAction.mockResolvedValue({ success: false, error: { code, message: 'no' } });
    expect((await cancel(AUTH)).status).toBe(expected);
  });
});
