/**
 * /api/report is public, so its confirmation mail must not be a relay
 * (PLAN_PROXY_SECURITY §14.5): a guest gets the fixed template only, at most
 * once per address per day; a signed-in reporter is answered at the address
 * on their account (locals.uid), never at the one the body names. The report
 * itself — Strapi row, rikma mirror, Telegram — is unchanged.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderProps = vi.fn();
const mirrorSiteReport = vi.fn(async () => {});

vi.mock('$env/dynamic/private', () => ({
  env: {
    ADMINMONTHER: 'test-admin-token',
    STRAPI_URL: 'http://strapi.test',
    TELEGRAM_BOT_TOKEN_NEW: 'bot',
    NEW_TELEGRAM: 'chat'
  }
}));
vi.mock('$lib/server/siteReportMirror.js', () => ({
  mirrorSiteReport: (...a: unknown[]) => mirrorSiteReport(...(a as []))
}));
vi.mock('$lib/components/mail/siteReportReceived.svelte', () => ({ default: {} }));
// The rendered "HTML" is the props themselves, so a test can see exactly what
// would have reached the inbox.
vi.mock('svelty-email', () => ({
  render: async (_c: unknown, props: Record<string, unknown>) => {
    renderProps(props);
    return { html: JSON.stringify(props), text: '' };
  }
}));

const { POST } = await import('./+server.js');
const { resetGuestConfirmationLimits } = await import('$lib/server/reportConfirmation.js');

const SPAM = 'Your account is suspended — verify at https://evil.example now';

/** Account rows the mocked Strapi GraphQL knows. */
let accounts: Record<string, { email: string | null; username: string; blocked?: boolean }>;
let graphqlCalls: Array<{ uid: string; auth: string | null }>;
let telegramBodies: any[];
let strapiSaves: any[];

function stubStrapi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const u = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      if (u === 'http://strapi.test/api/site-reports') {
        strapiSaves.push(body);
        return new Response(JSON.stringify({ data: { id: 77 } }), { status: 200 });
      }
      if (u === 'http://strapi.test/graphql') {
        const uid = body.variables.uid;
        graphqlCalls.push({ uid, auth: new Headers(init?.headers).get('Authorization') });
        const a = accounts[uid];
        return new Response(
          JSON.stringify({ data: { usersPermissionsUser: { data: a ? { id: uid, attributes: a } : null } } }),
          { status: 200 }
        );
      }
      if (u.startsWith('https://api.telegram.org/')) {
        telegramBodies.push(body);
        return new Response('{}', { status: 200 });
      }
      throw new Error(`unexpected fetch ${u}`);
    })
  );
}

function event(body: Record<string, unknown>, opts: { uid?: string | false; ip?: string } = {}) {
  const eventFetch = vi.fn(async () => new Response('{}', { status: 200 }));
  return {
    ev: {
      request: new Request('http://localhost/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }),
      fetch: eventFetch,
      url: new URL('http://localhost/api/report'),
      locals: { uid: opts.uid ?? false },
      getClientAddress: () => opts.ip ?? '203.0.113.1'
    } as any,
    eventFetch
  };
}

/** The /api/sendMail calls the endpoint made, decoded. */
function mails(eventFetch: ReturnType<typeof vi.fn>) {
  return eventFetch.mock.calls
    .filter(([path]) => path === '/api/sendMail')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  accounts = { '12': { email: 'owner@account.example', username: 'Dana' } };
  graphqlCalls = [];
  telegramBodies = [];
  strapiSaves = [];
  renderProps.mockClear();
  mirrorSiteReport.mockClear();
  resetGuestConfirmationLimits();
  stubStrapi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('guest reporter', () => {
  it('gets the fixed template at the typed address — no description, no name', async () => {
    const { ev, eventFetch } = event({
      type: 'bug',
      description: SPAM,
      userName: 'Click https://evil.example',
      userEmail: ' victim@example.com ',
      lang: 'en'
    });
    const res = await POST(ev);
    expect(res.status).toBe(200);

    const sent = mails(eventFetch);
    expect(sent).toHaveLength(1);
    expect(sent[0].email).toBe('victim@example.com');
    expect(JSON.stringify(sent[0])).not.toContain('evil.example');
    expect(renderProps).toHaveBeenCalledWith(
      expect.objectContaining({ description: '', username: '', isGuest: true, link: 'http://localhost/signup' })
    );
    expect(graphqlCalls).toHaveLength(0);
  });

  it('a body userId without a session is still a guest', async () => {
    const { ev, eventFetch } = event({
      type: 'bug',
      description: SPAM,
      userId: '12',
      userEmail: 'victim@example.com'
    });
    await POST(ev);
    const sent = mails(eventFetch);
    expect(sent).toHaveLength(1);
    expect(sent[0].email).toBe('victim@example.com');
    expect(JSON.stringify(sent[0])).not.toContain('evil.example');
    expect(graphqlCalls).toHaveLength(0);
  });

  it('one confirmation per address per day, whatever the case or IP', async () => {
    const first = event({ type: 'bug', description: 'a', userEmail: 'victim@example.com' }, { ip: '1.1.1.1' });
    await POST(first.ev);
    const again = event({ type: 'bug', description: 'b', userEmail: 'VICTIM@example.com' }, { ip: '2.2.2.2' });
    const res = await POST(again.ev);

    expect(mails(first.eventFetch)).toHaveLength(1);
    expect(mails(again.eventFetch)).toHaveLength(0);
    // The report itself still went through.
    expect(res.status).toBe(200);
    expect(strapiSaves).toHaveLength(2);
    expect(telegramBodies).toHaveLength(2);
  });

  it('a handful of confirmations per IP per hour', async () => {
    let sent = 0;
    for (let i = 0; i < 8; i++) {
      const { ev, eventFetch } = event({ type: 'bug', description: 'x', userEmail: `v${i}@example.com` });
      await POST(ev);
      sent += mails(eventFetch).length;
    }
    expect(sent).toBe(5);
  });

  it('nothing for an address no mailbox could have', async () => {
    const { ev, eventFetch } = event({ type: 'bug', description: 'x', userEmail: 'a@b.c, d@e.f' });
    await POST(ev);
    expect(mails(eventFetch)).toHaveLength(0);
  });

  it('nothing when no address was left', async () => {
    const { ev, eventFetch } = event({ type: 'bug', description: 'x' });
    await POST(ev);
    expect(mails(eventFetch)).toHaveLength(0);
  });
});

describe('signed-in reporter', () => {
  it('is answered at the account address, never the body one, with their words', async () => {
    const { ev, eventFetch } = event(
      { type: 'feature', description: 'please add dark mode', userId: '99', userEmail: 'victim@example.com' },
      { uid: '12' }
    );
    await POST(ev);

    const sent = mails(eventFetch);
    expect(sent).toHaveLength(1);
    expect(sent[0].email).toBe('owner@account.example');
    expect(graphqlCalls).toEqual([{ uid: '12', auth: 'Bearer test-admin-token' }]);
    expect(renderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'please add dark mode',
        username: 'Dana',
        isGuest: false,
        link: 'http://localhost/lev'
      })
    );
  });

  it('is not rate-limited like a guest', async () => {
    let sent = 0;
    for (let i = 0; i < 3; i++) {
      const { ev, eventFetch } = event({ type: 'bug', description: 'x', userEmail: 'me@x.com' }, { uid: '12' });
      await POST(ev);
      sent += mails(eventFetch).length;
    }
    expect(sent).toBe(3);
  });

  it('nothing when no address was left — the body still decides whether to answer', async () => {
    const { ev, eventFetch } = event({ type: 'bug', description: 'x' }, { uid: '12' });
    await POST(ev);
    expect(mails(eventFetch)).toHaveLength(0);
    expect(graphqlCalls).toHaveLength(0);
  });

  it.each([
    ['unknown account', '404'],
    ['blocked account', 'blocked'],
    ['account without an address', 'noemail']
  ])('nothing for an %s — and no fallback to the body address', async (_label, uid) => {
    accounts.blocked = { email: 'b@x.com', username: 'b', blocked: true };
    accounts.noemail = { email: null, username: 'n' };
    const { ev, eventFetch } = event({ type: 'bug', description: 'x', userEmail: 'victim@example.com' }, { uid });
    const res = await POST(ev);
    expect(res.status).toBe(200);
    expect(mails(eventFetch)).toHaveLength(0);
  });
});

describe('the report itself is unchanged', () => {
  it('saves the row and tells Telegram exactly what was sent', async () => {
    const { ev } = event(
      {
        type: 'bug',
        description: SPAM,
        page: '/lev',
        userId: '12',
        userName: 'Dana',
        userEmail: 'typed@example.com',
        lang: 'he'
      },
      { uid: '12' }
    );
    const res = await POST(ev);
    expect(await res.json()).toEqual({ success: true, strapiId: 77 });

    expect(strapiSaves[0].data).toMatchObject({
      type: 'bug',
      description: SPAM,
      page: '/lev',
      userId: '12',
      userName: 'Dana',
      userEmail: 'typed@example.com',
      lang: 'he',
      status: 'new'
    });
    expect(mirrorSiteReport).toHaveBeenCalledTimes(1);
    expect(telegramBodies[0].text).toContain(SPAM);
    expect(telegramBodies[0].text).toContain('typed@example.com');
  });

  it('still refuses an empty description', async () => {
    const { ev, eventFetch } = event({ type: 'bug', description: '  ', userEmail: 'v@example.com' });
    const res = await POST(ev);
    expect(res.status).toBe(400);
    expect(eventFetch).not.toHaveBeenCalled();
  });
});
