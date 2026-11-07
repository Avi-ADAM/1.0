/**
 * `POST /api/leads/ask` (PLAN_LEADS L4) — a visitor's question on a product
 * page becomes a lead of the rikma that sells it, and nothing comes back.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ execute: vi.fn(), executeAction: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'test-admin' } }));
vi.mock('$lib/server/actions/index.js', () => ({
  strapiClient: { execute: mocks.execute },
  actionService: { executeAction: mocks.executeAction }
}));

const { POST } = await import('./+server');
const { resetRateLimits } = await import('$lib/server/apiPublic/http.js');

const BODY = {
  productId: '123',
  name: 'דנה',
  phone: '050-0000000',
  message: 'כמה עולה ל-20 יחידות?',
  consent: true,
  consentText: 'אני מסכים/ה שהפרטים יועברו לרקמה דרך 1lev1'
};

const call = async (body: unknown, { ip = '203.0.113.1', uid = null as string | null } = {}) => {
  const res = (await POST({
    request: { json: async () => body } as any,
    fetch: vi.fn(),
    getClientAddress: () => ip,
    locals: { uid }
  } as any)) as Response;
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  mocks.execute.mockReset();
  mocks.executeAction.mockReset();
  resetRateLimits();
  mocks.execute.mockResolvedValue({
    data: { matanot: { data: { id: '123', attributes: { name: 'Mug', archived: false, projectcreates: { data: [{ id: '57' }] } } } } }
  });
  mocks.executeAction.mockResolvedValue({ success: true, data: { leadId: '77', taskId: '900', duplicated: false } });
});

describe('POST /api/leads/ask', () => {
  it('files a shop lead on the product\'s rikma, through the public-product door, and says nothing back', async () => {
    const r = await call(BODY);
    expect(r).toEqual({ status: 200, body: { success: true } });
    const [key, params, ctx] = mocks.executeAction.mock.calls[0];
    expect(key).toBe('createLead');
    expect(params).toMatchObject({ projectId: '57', productId: '123', source: 'shop', name: 'דנה', consent: { text: BODY.consentText } });
    expect(ctx).toMatchObject({ intake: 'publicProduct', userId: '' });
  });

  it('a signed-in visitor stays who they are', async () => {
    await call(BODY, { uid: '42' });
    expect(mocks.executeAction.mock.calls[0][2].userId).toBe('42');
  });

  it('needs consent and a product that is still for sale', async () => {
    expect((await call({ ...BODY, consent: false })).status).toBe(400);
    mocks.execute.mockResolvedValue({
      data: { matanot: { data: { id: '123', attributes: { archived: true, projectcreates: { data: [{ id: '57' }] } } } } }
    });
    expect((await call(BODY)).status).toBe(404);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('tells a bot "done" and files nothing; five an hour from one address', async () => {
    expect((await call({ ...BODY, website: 'http://spam' })).status).toBe(200);
    expect(mocks.executeAction).not.toHaveBeenCalled();
    for (let i = 0; i < 4; i++) expect((await call(BODY, { ip: '198.51.100.9' })).status).toBe(200);
    expect((await call(BODY, { ip: '198.51.100.9' })).status).toBe(200);
    expect((await call(BODY, { ip: '198.51.100.9' })).status).toBe(429);
  });

  it('a field the visitor got wrong is a 400; anything else is ours', async () => {
    mocks.executeAction.mockResolvedValue({ success: false, error: { code: 'VALIDATION_FAILED', details: { field: 'email' } } });
    expect(await call(BODY)).toEqual({ status: 400, body: { success: false, error: 'invalid', field: 'email' } });
    mocks.executeAction.mockResolvedValue({ success: false, error: { code: 'EXECUTION_FAILED' } });
    expect((await call(BODY)).status).toBe(502);
  });
});

describe('how they asked to be reached', () => {
  it('"on the site" is for someone signed in — then no phone or email is needed', async () => {
    const r = await call({ ...BODY, phone: undefined, contactVia: 'site' }, { uid: '42' });
    expect(r.status).toBe(200);
    expect(mocks.executeAction.mock.calls[0][1]).toMatchObject({ customerUserId: '42', details: { contactVia: 'site' } });
  });

  it('a guest who chose "on the site" and left nothing else is asked for a way to reach them', async () => {
    const r = await call({ ...BODY, phone: undefined, contactVia: 'site' });
    expect(r.status).toBe(400);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it('a choice without what it needs is not kept (WhatsApp with no phone)', async () => {
    await call({ ...BODY, phone: undefined, email: 'd@x.co', contactVia: 'whatsapp' });
    expect(mocks.executeAction.mock.calls[0][1].details).toBeUndefined();
  });
});
