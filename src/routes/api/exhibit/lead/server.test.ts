import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789', EXHIBIT_KEY: 'fair-stand-key-2026' }
}));

const record = vi.fn(async () => ({ ok: true }));
vi.mock('$lib/server/exhibit/lead', () => ({ recordExhibitLead: record }));

const session = {
  id: '9',
  status: 'pending',
  kind: 'rikma',
  sourceText: 'Built at the 1lev1 exhibition stand: ציור קיר לשכונה\nsource: template:mural',
  state: {
    fields: { name: 'ציור קיר לשכונה' },
    items: [
      { key: 'i1', group: 'rikmaMissions', label: 'a', status: 'proposed', spec: { holder: 'me', hours: 30, ratePerHour: 120 } },
      { key: 'i2', group: 'rikmaMissions', label: 'b', status: 'proposed', spec: { holder: 'open' } },
      { key: 'i3', group: 'rikmaResources', label: 'c', status: 'proposed', spec: { holder: 'open' } },
      { key: 'i4', group: 'products', label: 'd', status: 'proposed' }
    ]
  }
};
const load = vi.fn(async () => session);
vi.mock('$lib/server/assistant/session.js', () => ({ loadSession: load }));
vi.mock('$lib/server/actions/index.js', () => ({ strapiClient: {} }));

const { POST } = await import('./+server');
const { mintSignupToken } = await import('$lib/server/assistant/signupToken.js');
const { expectedPass } = await import('$lib/server/exhibit/pass');

const token = mintSignupToken({ sid: '9', name: '', email: '', countryIds: [], intent: 'idea', lang: 'he' });

let ip = 0;
function call(body: unknown, pass: string | null = null) {
  return POST({
    request: new Request('http://x/api/exhibit/lead', { method: 'POST', body: JSON.stringify(body) }),
    cookies: { get: () => pass ?? undefined },
    fetch,
    getClientAddress: () => `10.1.0.${++ip}`
  } as never);
}

describe('POST /api/exhibit/lead', () => {
  beforeEach(() => record.mockClear());

  it('records one lead for the draft the token names, with its open parts counted', async () => {
    const res = await call({ t: token, name: 'נועם', email: 'Noam@Example.com', consent: true, via: 'phone', shareKey: 'k1' });
    expect(res.status).toBe(200);
    expect(record).toHaveBeenCalledTimes(1);
    expect((record.mock.calls[0] as any)[0]).toMatchObject({
      sessionId: '9',
      email: 'noam@example.com',
      via: 'phone',
      idea: 'ציור קיר לשכונה',
      missions: 2,
      open: 2,
      previewUrl: 'https://www.1lev1.com/preview/rikma/k1?ref=exhibit',
      ideaSource: 'template:mural',
      words: null
    });
    const sent = (record.mock.calls[0] as any)[0];
    expect(sent.studioUrl).toBe(`https://www.1lev1.com/preview/rikma/studio/${token}`);
    expect(sent.plan.split('\n')).toEqual([
      'mission: a · 30h × 120 = 3600 · me',
      'mission: b · open',
      'resource: c · open',
      'product: d'
    ]);
  });

  it('needs consent, a way to reach them, and a live token', async () => {
    expect((await call({ t: token, email: 'a@b.co', via: 'phone' })).status).toBe(400);
    expect((await call({ t: token, consent: true, via: 'phone' })).status).toBe(400);
    expect((await call({ t: token, email: 'not-an-email', consent: true, via: 'phone' })).status).toBe(400);
    expect((await call({ t: 'forged', email: 'a@b.co', consent: true, via: 'phone' })).status).toBe(400);
    expect(record).not.toHaveBeenCalled();
  });

  it('from the stand, only with the kiosk pass', async () => {
    expect((await call({ t: token, email: 'a@b.co', consent: true, via: 'kiosk' })).status).toBe(403);
    expect((await call({ t: token, email: 'a@b.co', consent: true, via: 'kiosk' }, expectedPass('fair-stand-key-2026'))).status).toBe(200);
  });

  it('a draft someone already claimed opens no lead', async () => {
    load.mockResolvedValueOnce({ ...session, status: 'applied' });
    expect((await call({ t: token, email: 'a@b.co', consent: true, via: 'phone' })).status).toBe(400);
    expect(record).not.toHaveBeenCalled();
  });
});
