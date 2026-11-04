/**
 * `POST /api/v1/r/{rikma}/leads` and `GET /leads/{externalId}`
 * (docs/inprogress/PLAN_LEADS.md §5.1, §5.3) — the HTTP contract around
 * `createLead`: who may call, from where, what is refused before any lookup,
 * and that nothing about the person comes back out. The writes themselves are
 * tested against an in-memory Strapi in configs/leads.test.ts.
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
  assertScope: (key: any, scope: string) => Array.isArray(key.scopes) && key.scopes.includes(scope)
}));

const { POST } = await import('./+server');
const { GET } = await import('./[externalId]/+server');
const { clearQueryCache } = await import('$lib/server/apiPublic/cache.js');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');
const { resetShopSchemaVerdict } = await import('$lib/server/apiPublic/catalog.js');

const key = (scopes: string[], project = '57') => ({
  user: { id: '9' },
  keyId: '3',
  name: 'vaad-server',
  project: { id: project },
  scopes,
  revoked: false,
  allowedOrigins: [],
  lastUsedAt: null
});

const BODY = {
  name: 'דנה כהן',
  phone: '050-0000000',
  email: 'dana@example.com',
  organization: 'בניין הרצל 12, חיפה',
  details: { apartments: 16, interest: 'shared' },
  externalId: 'lead_6f1c',
  sourceLabel: 'טופס דף הבית',
  consent: { text: 'אני מסכים/ה שהפרטים יועברו לרקמה ב-1lev1', at: '2026-11-03T10:00:00Z' }
};

const LEAD_NODE = {
  id: '77',
  attributes: {
    status: 'contacted',
    externalId: 'lead_6f1c',
    lastActivityAt: '2026-11-03T12:00:00Z',
    owner: { data: { id: '5' } },
    act: { data: { id: '902' } }
  }
};

function fakeStrapi({ leadsLive = true } = {}) {
  return async (qid: string, vars: any) => {
    switch (qid) {
      case 'rikmaProjectBySlug':
        return {
          data: { projects: { data: vars.slug === 'haohel' ? [{ id: '57', attributes: { slug: 'haohel' } }] : [] } }
        };
      case 'rikmaProjectByFormerSlug':
        return { data: { projects: { data: [] } } };
      case 'rikmaApiLeadsSchema':
        if (!leadsLive) throw new Error('GRAPHQL_VALIDATION_FAILED: Cannot query field "leads"');
        return { data: { leads: { data: [] } } };
      case 'leadByExternalId':
        return { data: { leads: { data: vars.pid === '57' && vars.externalId === 'lead_6f1c' ? [LEAD_NODE] : [] } } };
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
  attempt(POST({ params: { rikma }, request: request(headers, body), fetch: vi.fn() } as any));
const get = (headers: Record<string, string>, externalId: string) =>
  attempt(GET({ params: { rikma: 'haohel', externalId }, request: request(headers), fetch: vi.fn() } as any));

const AUTH = { Authorization: 'Bearer 1lev1_server' };

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  mocks.verifyApiKeyDetailed.mockReset();
  clearQueryCache();
  resetRateLimits();
  resetShopSchemaVerdict();
  mocks.execute.mockImplementation(fakeStrapi());
  mocks.verifyApiKeyDetailed.mockResolvedValue(key(['leads:create', 'leads:read']));
  mocks.executeAction.mockResolvedValue({
    success: true,
    data: { leadId: '77', externalId: 'lead_6f1c', status: 'new', taskId: '902', duplicated: false, warnings: [] }
  });
});

describe('POST /leads', () => {
  it('records the lead as the key owner, under the key’s rikma, with the key as its source', async () => {
    const r = await post(AUTH);
    expect(r.status).toBe(201);
    expect(r.body).toEqual({
      success: true,
      duplicated: false,
      leadId: '77',
      externalId: 'lead_6f1c',
      status: 'new',
      taskId: '902',
      warnings: []
    });
    const [actionKey, params, ctx] = mocks.executeAction.mock.calls[0];
    expect(actionKey).toBe('createLead');
    expect(params).toMatchObject({
      projectId: '57',
      name: 'דנה כהן',
      email: 'dana@example.com',
      source: 'api',
      sourceKeyId: '3',
      details: { apartments: 16, interest: 'shared' },
      consent: { text: BODY.consent.text, at: '2026-11-03T10:00:00.000Z' }
    });
    expect(ctx.userId).toBe('9');
  });

  it('answers a retry or a returning contact with 200 and the reason', async () => {
    mocks.executeAction.mockResolvedValue({
      success: true,
      data: { leadId: '77', status: 'talking', duplicated: true, reason: 'sameContact', warnings: [] }
    });
    const r = await post(AUTH);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ duplicated: true, reason: 'sameContact', leadId: '77' });
  });

  it('refuses a lead without consent before touching anything', async () => {
    const { consent: _c, ...noConsent } = BODY;
    const r = await post(AUTH, noConsent);
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('CONSENT_REQUIRED');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('will not let a site claim to be a member typing in a phone call', async () => {
    const r = await post(AUTH, { ...BODY, source: 'manual' });
    expect(r.status).toBe(400);
    expect(r.body.error.details.field).toBe('source');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('names the bad field', async () => {
    const r = await post(AUTH, { ...BODY, phone: undefined, email: undefined });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatchObject({ code: 'VALIDATION', details: { field: 'email' } });
  });

  it('refuses a browser — a leads key carries people’s contact details', async () => {
    const r = await post({ ...AUTH, Origin: 'https://vaad.example' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('needs the leads:create scope', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['tasks:create', 'leads:read']));
    expect((await post(AUTH)).status).toBe(403);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('keeps the key in its own rikma', async () => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['leads:create'], '99'));
    const r = await post(AUTH);
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('RIKMA_MISMATCH');
  });

  it('says leads are not ready while the schema is not deployed', async () => {
    mocks.execute.mockImplementation(fakeStrapi({ leadsLive: false }));
    const r = await post(AUTH);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('LEADS_NOT_READY');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('maps the action’s refusals', async () => {
    mocks.executeAction.mockResolvedValue({ success: false, error: { code: 'NOT_FOUND', message: 'No such product in this rikma' } });
    expect((await post(AUTH, { ...BODY, productId: '999' })).status).toBe(404);
    mocks.executeAction.mockResolvedValue({ success: false, error: { code: 'EXECUTION_FAILED', message: 'strapi down' } });
    const r = await post(AUTH);
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe('UPSTREAM_ERROR');
    expect(r.body.error.message).not.toContain('strapi');
  });
});

describe('GET /leads/{externalId}', () => {
  it('answers the status — and nothing about the person or the member', async () => {
    const r = await get(AUTH, 'lead_6f1c');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      success: true,
      leadId: '77',
      externalId: 'lead_6f1c',
      status: 'contacted',
      hasOwner: true,
      lastActivityAt: '2026-11-03T12:00:00Z'
    });
  });

  it('is a 404 for an unknown id, and needs leads:read', async () => {
    expect((await get(AUTH, 'nope')).status).toBe(404);
    mocks.verifyApiKeyDetailed.mockResolvedValue(key(['leads:create']));
    expect((await get(AUTH, 'lead_6f1c')).status).toBe(403);
  });
});

describe('POST /leads from a public form (leads:create:public, §5.2)', () => {
  const SITE = 'https://vaad.example';
  const publicKey = (origins: string[] = [SITE]) => ({ ...key(['leads:create:public']), allowedOrigins: origins });
  const FROM_SITE = { ...AUTH, Origin: SITE, 'x-forwarded-for': '203.0.113.7' };

  beforeEach(() => {
    mocks.verifyApiKeyDetailed.mockResolvedValue(publicKey());
  });

  it('files the lead as a form, and the page learns nothing back', async () => {
    mocks.executeAction.mockResolvedValue({
      success: true,
      data: { leadId: '77', status: 'talking', duplicated: true, reason: 'sameContact', warnings: [] }
    });
    const r = await post(FROM_SITE, { ...BODY, source: 'api' });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({ success: true });
    expect(mocks.executeAction.mock.calls[0][1]).toMatchObject({ source: 'form', projectId: '57' });
  });

  it('answers the page with its own origin, never *', async () => {
    const res = (await POST({
      params: { rikma: 'haohel' },
      request: request(FROM_SITE, BODY),
      fetch: vi.fn()
    } as any)) as Response;
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE);
  });

  it('works only from the origins on the key — and not at all without them', async () => {
    let r = await post({ ...FROM_SITE, Origin: 'https://evil.example' });
    expect(r.status).toBe(403);
    r = await post({ ...AUTH, 'x-forwarded-for': '203.0.113.7' });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    mocks.verifyApiKeyDetailed.mockResolvedValue(publicKey([]));
    r = await post(FROM_SITE);
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('PUBLIC_KEY_NEEDS_ORIGINS');
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('tells a bot that filled the hidden field "done", and files nothing', async () => {
    const r = await post(FROM_SITE, { ...BODY, website: 'http://spam.example' });
    expect(r.status).toBe(201);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('takes ten an hour from one address', async () => {
    for (let i = 0; i < 10; i++) expect((await post(FROM_SITE)).status).toBe(201);
    const r = await post(FROM_SITE);
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe('RATE_LIMITED');
    expect((await post({ ...FROM_SITE, 'x-forwarded-for': '198.51.100.2' })).status).toBe(201);
  });

  it('still needs consent', async () => {
    const { consent: _c, ...noConsent } = BODY;
    expect((await post(FROM_SITE, noConsent)).status).toBe(400);
  });

  it('cannot read a status back', async () => {
    expect((await get(FROM_SITE, 'lead_6f1c')).status).toBe(403);
  });
});
