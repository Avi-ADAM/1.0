import { describe, it, expect, vi } from 'vitest';

const generate = vi.fn(async () => ({
  boards: [{ title: 'b', descrip: '', rationale: '', items: [{ kind: 'mission', name: 'Build it', nhours: 10, valph: 100 }] }],
  siteUsed: null
}));

vi.mock('$lib/server/planning/seedPlan.js', () => ({ generateSeedPlan: generate }));
vi.mock('@mastra/core/agent', () => ({ Agent: class {} }));
vi.mock('../../../mastra/lib/createModel', () => ({ createModelChain: () => null }));

const { POST } = await import('./+server');

const IDEA = 'A neighbourhood bakery with sourdough bread and a weekend baking class for parents and kids.';

function call(body: unknown, ip = '10.0.0.1') {
  return POST({
    request: new Request('http://x/api/vision-preview', { method: 'POST', body: JSON.stringify(body) }),
    getClientAddress: () => ip
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
});
