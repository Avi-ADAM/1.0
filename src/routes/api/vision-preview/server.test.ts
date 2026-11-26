import { describe, it, expect, vi } from 'vitest';

const generate = vi.fn(async () => ({
  boards: [{ title: 'b', descrip: '', rationale: '', items: [{ kind: 'mission', name: 'Build it', nhours: 10, valph: 100 }] }],
  siteUsed: null
}));

vi.mock('$lib/server/planning/seedPlan.js', () => ({ generateSeedPlan: generate }));
vi.mock('@mastra/core/agent', () => ({ Agent: class {} }));
vi.mock('../../../mastra/lib/createModel', () => ({ createModelChain: () => null }));
vi.mock('$env/dynamic/private', () => ({ env: { EXHIBIT_KEY: 'fair-stand-key-2026' } }));

const { expectedPass } = await import('$lib/server/exhibit/pass');

const { POST } = await import('./+server');

const IDEA = 'A neighbourhood bakery with sourdough bread and a weekend baking class for parents and kids.';

function call(body: unknown, ip = '10.0.0.1', pass: string | null = null) {
  return POST({
    request: new Request('http://x/api/vision-preview', { method: 'POST', body: JSON.stringify(body) }),
    getClientAddress: () => ip,
    cookies: { get: () => pass ?? undefined }
  } as never);
}

describe('POST /api/vision-preview', () => {
  it('refuses short text and a filled honeypot without calling the model', async () => {
    expect((await call({ text: 'short' })).status).toBe(400);
    expect((await call({ text: IDEA, website: 'spam' })).status).toBe(400);
    expect((await call({ text: 'x'.repeat(1501) })).status).toBe(400);
    expect(generate).not.toHaveBeenCalled();
  });

  it('returns the reduced preview', async () => {
    const res = await call({ text: IDEA }, '10.0.0.2');
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.preview.missions[0]).toMatchObject({ name: 'Build it', share: 100 });
  });

  it('allows three tries an hour per address, then 429 before the model', async () => {
    generate.mockClear();
    const ip = '10.0.0.3';
    for (let i = 0; i < 3; i++) expect((await call({ text: IDEA }, ip)).status).toBe(200);
    const res = await call({ text: IDEA }, ip);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(generate).toHaveBeenCalledTimes(3);
    // Another address is unaffected.
    expect((await call({ text: IDEA }, '10.0.0.4')).status).toBe(200);
  });

  it('refuses exhibit mode without the kiosk pass, before the model', async () => {
    generate.mockClear();
    expect((await call({ text: IDEA, mode: 'exhibit' }, '10.0.0.5')).status).toBe(403);
    expect((await call({ text: IDEA, mode: 'exhibit' }, '10.0.0.5', 'forged')).status).toBe(403);
    expect(generate).not.toHaveBeenCalled();
  });

  it('gives the kiosk short texts and its own quota, not the per-address one', async () => {
    const pass = expectedPass('fair-stand-key-2026');
    const ip = '10.0.0.6';
    for (let i = 0; i < 5; i++) {
      expect((await call({ text: 'A repair café', mode: 'exhibit' }, ip, pass)).status).toBe(200);
    }
    // The planner is told the kiosk's floor, or it would drop a short idea as empty (422).
    expect(generate).toHaveBeenLastCalledWith('A repair café', expect.any(Function), { minLength: 8 });
    // Still too short even for the kiosk.
    expect((await call({ text: 'café', mode: 'exhibit' }, ip, pass)).status).toBe(400);
  });
});
