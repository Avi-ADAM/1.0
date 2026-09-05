import { describe, it, expect, vi } from 'vitest';
import { POST, GET } from './+server.js';
import { AUTH_COOKIES } from '$lib/server/session.js';

/** A `cookies` stub that only records what was deleted. */
function cookieSpy() {
  const del = vi.fn();
  return { del, cookies: { delete: del } as never };
}

/** Names deleted, deduped — the same name is deleted once per domain scope. */
const deleted = (del: ReturnType<typeof vi.fn>) =>
  new Set(del.mock.calls.map(([name]) => name));

describe('POST /logout', () => {
  it('clears the session cookies the browser could never clear itself', async () => {
    const { del, cookies } = cookieSpy();

    const res = await POST({
      cookies,
      url: new URL('https://www.1lev1.com/logout')
    } as never);

    expect(res.status).toBe(200);
    // jwt is HttpOnly and `id`/`un`/`when` are written on `.1lev1.com` — the
    // old client-side document.cookie loop reached none of them.
    for (const name of AUTH_COOKIES) expect(deleted(del)).toContain(name);
    expect(del).toHaveBeenCalledWith('jwt', { path: '/' });
    expect(del).toHaveBeenCalledWith('jwt', { path: '/', domain: '.1lev1.com' });
    expect(del).toHaveBeenCalledWith('jwt', { path: '/', domain: 'www.1lev1.com' });
  });

  it("also drops the previous user's email prefill and signup crumbs", async () => {
    const { del, cookies } = cookieSpy();
    await POST({ cookies, url: new URL('http://localhost:5173/logout') } as never);

    // Unlike a *stale* session (where `email` stays to prefill /login), an
    // explicit sign-out must not leave the next person that identity.
    expect(deleted(del)).toContain('email');
    expect(deleted(del)).toContain('fpval');
    expect(deleted(del)).toContain('invite_token');
  });

  it('keeps preferences that are not identity', async () => {
    const { del, cookies } = cookieSpy();
    await POST({ cookies, url: new URL('http://localhost:5173/logout') } as never);

    expect(deleted(del)).not.toContain('lang');
    expect(deleted(del)).not.toContain('theme');
  });

  it('does not touch the `.1lev1.com` scopes off the real domain', async () => {
    const { del, cookies } = cookieSpy();
    await POST({ cookies, url: new URL('http://localhost:5173/logout') } as never);

    expect(del.mock.calls.every(([, scope]) => !scope.domain)).toBe(true);
  });
});

describe('GET /logout', () => {
  const run = (url: string) => {
    const { del, cookies } = cookieSpy();
    try {
      GET({ cookies, url: new URL(url) } as never);
      return { del, redirect: null as null | { status: number; location: string } };
    } catch (e) {
      const r = e as { status: number; location: string };
      return { del, redirect: { status: r.status, location: r.location } };
    }
  };

  it('clears the cookies and sends the visitor home', () => {
    const { del, redirect } = run('https://www.1lev1.com/logout');
    expect(deleted(del)).toContain('jwt');
    expect(redirect).toEqual({ status: 303, location: '/' });
  });

  it('honours an in-app ?to=', () => {
    expect(run('https://www.1lev1.com/logout?to=/login').redirect?.location).toBe('/login');
  });

  it('refuses an off-site ?to= (open redirect)', () => {
    expect(run('https://www.1lev1.com/logout?to=https://evil.example').redirect?.location).toBe('/');
    expect(run('https://www.1lev1.com/logout?to=//evil.example').redirect?.location).toBe('/');
  });
});
