import { describe, it, expect } from 'vitest';
import { csrfRejection } from './csrf.js';

// A stub rather than `new Request()`: the test environment (happy-dom) treats
// `Origin` as a forbidden header and silently drops it, which is the one header
// this module is about.
const req = (method: string, headers: Record<string, string>) =>
  ({
    method,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null }
  }) as unknown as Request;

const at = (href: string) => new URL(href);
const WWW = 'https://www.1lev1.com';
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };

describe('csrfRejection — same behaviour as SvelteKit’s built-in check', () => {
  it('refuses a cross-site form POST', () => {
    const r = csrfRejection(req('POST', { ...FORM, origin: 'https://evil.example' }), at(`${WWW}/login`));
    expect(r?.status).toBe(403);
  });

  it('refuses a form POST with no Origin at all', () => {
    expect(csrfRejection(req('POST', FORM), at(`${WWW}/me/settings`))?.status).toBe(403);
  });

  it('allows a same-origin form POST', () => {
    expect(csrfRejection(req('POST', { ...FORM, origin: WWW }), at(`${WWW}/login`))).toBeNull();
  });

  it('allows a trusted origin (the Vercel front posting to api.1lev1.com)', () => {
    const r = csrfRejection(
      req('POST', { 'content-type': 'multipart/form-data; boundary=x', origin: WWW }),
      at('https://api.1lev1.com/api/upload')
    );
    expect(r).toBeNull();
  });

  it('ignores JSON bodies, which a form cannot send', () => {
    const r = csrfRejection(
      req('POST', { 'content-type': 'application/json', origin: 'https://evil.example' }),
      at(`${WWW}/login`)
    );
    expect(r).toBeNull();
  });

  it('ignores safe methods', () => {
    expect(csrfRejection(req('GET', { ...FORM, origin: 'https://evil.example' }), at(`${WWW}/login`))).toBeNull();
  });

  it('covers PUT/PATCH/DELETE and text/plain too', () => {
    for (const m of ['PUT', 'PATCH', 'DELETE']) {
      expect(csrfRejection(req(m, { 'content-type': 'text/plain' }), at(`${WWW}/x`))?.status).toBe(403);
    }
  });

  it('answers in JSON when the caller asked for JSON', async () => {
    const res = csrfRejection(req('POST', { ...FORM, accept: 'application/json' }), at(`${WWW}/login`))!;
    expect(res.status).toBe(403);
    expect((await res.json()).message).toContain('Cross-site POST');
  });
});

describe('the OAuth token endpoint', () => {
  it('accepts claude.ai’s back-channel exchange: form-encoded, no Origin', () => {
    expect(csrfRejection(req('POST', FORM), at(`${WWW}/oauth/token`))).toBeNull();
  });

  it('exempts only the exact path', () => {
    expect(csrfRejection(req('POST', FORM), at(`${WWW}/oauth/token/x`))?.status).toBe(403);
    expect(csrfRejection(req('POST', FORM), at(`${WWW}/oauth/authorize`))?.status).toBe(403);
  });
});
