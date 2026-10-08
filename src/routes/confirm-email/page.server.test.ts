import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/signupCookies.js', () => ({ signupCookieOptions: () => ({ path: '/' }) }));

import { actions } from './+page.server';

function cookieJar(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  return {
    get: (k: string) => jar.get(k),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
    jar
  };
}

function event(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>) {
  const body = new FormData();
  body.set('confirmation', 'tok');
  body.set('email', 'a@b.co');
  return {
    request: new Request('http://x/confirm-email?/continue', { method: 'POST', body }),
    cookies: cookieJar(),
    fetch: vi.fn(fetchImpl),
    url: new URL('http://x/confirm-email')
  } as any;
}

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('confirm-email continue (QA C-4)', () => {
  it('a network failure leaves the token unspent and offers to try again', async () => {
    const ev = event(async () => {
      throw new TypeError('fetch failed');
    });
    const res: any = await actions.continue(ev);
    expect(res.status).toBe(502);
    expect(res.data.state).toBe('error');
    // Tried twice, and never the stock (token-spending) confirmation.
    const urls = ev.fetch.mock.calls.map((c: any[]) => String(c[0]));
    expect(urls).toEqual(['/api/auth/email-confirmation-login', '/api/auth/email-confirmation-login']);
  });

  it('a 5xx does not fall back to the stock confirmation either', async () => {
    const ev = event(async () => json(503));
    const res: any = await actions.continue(ev);
    expect(res.data.state).toBe('error');
    expect(ev.fetch.mock.calls.every((c: any[]) => String(c[0]).endsWith('-login'))).toBe(true);
  });

  it('a retry that succeeds signs the person in', async () => {
    let n = 0;
    const ev = event(async () => (n++ === 0 ? json(502) : json(200, { jwt: 'J', user: { id: 7, email: 'a@b.co' } })));
    await expect(actions.continue(ev)).rejects.toMatchObject({ status: 303 });
    expect(ev.cookies.jar.get('jwt')).toBe('J');
  });

  it('only a missing route (404) falls back to the stock confirmation', async () => {
    const ev = event(async (url) => (url.endsWith('-login') ? json(404) : json(200, { status: 302 })));
    await expect(actions.continue(ev)).rejects.toMatchObject({ status: 303, location: '/login?confirmed=1' });
    expect(ev.fetch.mock.calls.map((c: any[]) => String(c[0]))).toContain('/api/auth/email-confirmation?confirmation=tok');
  });

  it('a spent token says so', async () => {
    const res: any = await actions.continue(event(async () => json(400)));
    expect(res.data.state).toBe('spent');
  });
});
