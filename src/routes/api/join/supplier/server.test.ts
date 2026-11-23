import { describe, expect, it, vi, beforeEach } from 'vitest';

const prepareSignup = vi.fn();
vi.mock('$lib/server/assistant/prepareSignup.js', () => ({
  prepareSignup: (...args: unknown[]) => prepareSignup(...args)
}));
vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: {} }));
const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));

const { POST } = await import('./+server');

const blueprint = { fields: { track: 'business', name: 'צילום דנה' }, products: [{ name: 'צילום חתונה' }] };

let ip = 0;
/** A fresh address per call, so the per-address quota never decides a test. */
function event(body: unknown, { loggedIn = false } = {}) {
  ip += 1;
  return {
    request: new Request('http://localhost/api/join/supplier', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }),
    fetch: (() => {}) as unknown as typeof fetch,
    locals: { tok: loggedIn ? 'jwt' : undefined },
    getClientAddress: () => `10.0.0.${ip}`
  } as any;
}

describe('POST /api/join/supplier', () => {
  beforeEach(() => {
    delete env.ASSISTANT_MCP_ENABLED;
    prepareSignup.mockReset();
    prepareSignup.mockResolvedValue({
      signupUrl: 'https://www.1lev1.com/hascama?agent=tok',
      manageUrl: 'https://www.1lev1.com/preview/rikma/studio/tok',
      expiresAt: '2026-11-24T00:00:00.000Z'
    });
  });

  it('prepares a business signup with the drawn area and sends the guest to the studio', async () => {
    const res = await POST(
      event({ name: 'דנה', email: 'Dana@X.co', lang: 'he', blueprint, area: { lat: 32.79, lng: 35.53, radius: 30 } })
    );
    await expect(res.json()).resolves.toEqual({ ok: true, next: '/preview/rikma/studio/tok', expiresAt: '2026-11-24T00:00:00.000Z' });
    const [input] = prepareSignup.mock.calls[0];
    expect(input).toMatchObject({ name: 'דנה', email: 'dana@x.co', intent: 'business' });
    expect(input.blueprint.fields.location).toEqual({ lat: 32.79, lng: 35.53, radius: 30 });
  });

  it('sends a signed-in member to their own path and prepares nothing', async () => {
    const res = await POST(event({ name: 'דנה', email: 'd@x.co', blueprint }, { loggedIn: true }));
    expect(res.status).toBe(409);
    expect(prepareSignup).not.toHaveBeenCalled();
  });

  it('refuses a request without a draft or a valid email', async () => {
    expect((await POST(event({ name: 'דנה', email: 'd@x.co' }))).status).toBe(400);
    expect((await POST(event({ name: 'דנה', email: 'nope', blueprint }))).status).toBe(400);
    expect(prepareSignup).not.toHaveBeenCalled();
  });

  it('a draft prepareSignup rejects is a 400, not a crash', async () => {
    prepareSignup.mockRejectedValueOnce(new Error('The blueprint is not valid'));
    const res = await POST(event({ name: 'דנה', email: 'd@x.co', blueprint }));
    expect(res.status).toBe(400);
  });

  it('closes with the assistant kill switch', async () => {
    env.ASSISTANT_MCP_ENABLED = 'false';
    expect((await POST(event({ name: 'דנה', email: 'd@x.co', blueprint }))).status).toBe(404);
  });
});
