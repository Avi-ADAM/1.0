import { describe, expect, it, vi, beforeEach } from 'vitest';

const resolveMissionSpec = vi.fn();
vi.mock('$lib/server/mission/resolveMissionSpec.js', () => ({
  resolveMissionSpec: (...args: unknown[]) => resolveMissionSpec(...args)
}));

const { POST } = await import('./+server');

function cat(resolved: { id: string; name: string }[] = []) {
  return { ids: resolved.map((r) => r.id), resolved, suggestions: [], newlyCreated: [] };
}

/** Minimal RequestEvent stand-in — the handler only uses these three. */
function event(body: unknown, { loggedIn = true } = {}) {
  return {
    request: new Request('http://localhost/api/vocab/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }),
    fetch: (() => {}) as unknown as typeof fetch,
    locals: { tok: loggedIn ? 'jwt-token' : false }
  } as any;
}

describe('POST /api/vocab/resolve', () => {
  beforeEach(() => {
    resolveMissionSpec.mockClear();
    resolveMissionSpec.mockImplementation(async () => ({
      skills: cat([{ id: '7', name: 'מתכנת' }]),
      roles: cat(),
      workways: cat(),
      vallues: cat()
    }));
  });

  it('returns id + canonical name pairs', async () => {
    const res = await POST(event({ skills: ['מתכנתת'], lang: 'he' }));
    await expect(res.json()).resolves.toEqual({
      ok: true,
      skills: [{ id: '7', name: 'מתכנת' }],
      roles: [],
      workways: []
    });
  });

  it('refuses an anonymous caller — it can create catalogue entries', async () => {
    await expect(POST(event({ skills: ['x'] }, { loggedIn: false }))).rejects.toMatchObject({
      status: 401
    });
    expect(resolveMissionSpec).not.toHaveBeenCalled();
  });

  it('answers empty without touching the resolver when there is nothing to resolve', async () => {
    const res = await POST(event({ skills: [], roles: [], workways: [] }));
    await expect(res.json()).resolves.toEqual({ ok: true, skills: [], roles: [], workways: [] });
    expect(resolveMissionSpec).not.toHaveBeenCalled();
  });

  it('trims, de-duplicates and caps the terms it forwards', async () => {
    await POST(
      event({
        skills: [
          '  מתכנת ',
          'מתכנת',
          'MTKNT',
          ...Array.from({ length: 20 }, (_, i) => `skill-${i}`)
        ]
      })
    );

    const [spec] = resolveMissionSpec.mock.calls[0];
    expect(spec.skills).toHaveLength(8);
    expect(spec.skills[0]).toBe('מתכנת');
    // The whitespace-only duplicate is gone.
    expect(spec.skills.filter((s: string) => s === 'מתכנת')).toHaveLength(1);
  });

  it('clamps an absurdly long term instead of forwarding it', async () => {
    await POST(event({ roles: ['ר'.repeat(500)] }));
    const [spec] = resolveMissionSpec.mock.calls[0];
    expect(spec.roles[0].length).toBe(80);
  });

  it('defaults an unknown language to Hebrew', async () => {
    await POST(event({ skills: ['a'], lang: 'fr' }));
    expect(resolveMissionSpec.mock.calls[0][0].lang).toBe('he');

    await POST(event({ skills: ['a'], lang: 'ar' }));
    expect(resolveMissionSpec.mock.calls[1][0].lang).toBe('ar');
  });

  it('degrades to empty rather than failing the page when resolution throws', async () => {
    resolveMissionSpec.mockImplementation(async () => {
      throw new Error('pinecone down');
    });
    const res = await POST(event({ skills: ['מתכנת'] }));
    await expect(res.json()).resolves.toEqual({ ok: false, skills: [], roles: [], workways: [] });
  });

  it('treats an unparseable body as nothing to resolve', async () => {
    const res = await POST({
      request: new Request('http://localhost/api/vocab/resolve', {
        method: 'POST',
        body: 'not json'
      }),
      fetch: (() => {}) as unknown as typeof fetch,
      locals: { tok: 'jwt-token' }
    } as any);
    await expect(res.json()).resolves.toEqual({ ok: true, skills: [], roles: [], workways: [] });
  });
});
