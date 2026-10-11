/**
 * /api/sendMail must not be an open mail relay.
 *
 * It took any recipient and any HTML and sent it as notifications@1lev1.com,
 * to anyone who POSTed. Zoho answers that kind of traffic by blocking the
 * whole account (`550 5.4.6`, see $lib/server/mailer.js). The nuti and sma
 * endpoints were the same hole behind a template — and because they reach
 * /api/sendMail through the SvelteKit fetch, handleFetch stamped them as
 * internal on the way, so gating sendMail alone would not have closed it.
 *
 * Every one of them now answers only to this server ($lib/server/internalOnly.js).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMailSafe = vi.fn(async (_opts: unknown) => ({ ok: true }));

vi.mock('$env/dynamic/private', () => ({ env: { ADMINMONTHER: 'test-admin-token' } }));
vi.mock('$lib/server/mailer.js', () => ({
  sendMailSafe: (opts: unknown) => sendMailSafe(opts)
}));
vi.mock('svelty-email', () => ({ render: async () => ({ html: '<p>x</p>', text: 'x' }) }));

const sendMailRoute = await import('./+server.js');
const nutiRoute = await import('../nuti/+server.js');
const smaRoute = await import('../sma/+server.js');

// What handleFetch stamps — internalSecret.js's derivation for the mocked env.
const INTERNAL = createHash('sha256').update('test-admin-token:internal-proxy:v1').digest('hex');

function req(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
}

/** The event a POST handler gets; `uid` is a logged-in user (locals.uid). */
function event(request: Request, extra: Record<string, unknown> = {}) {
  return {
    request,
    fetch: vi.fn(async () => new Response('{}')),
    locals: { uid: '12' },
    cookies: { get: () => undefined },
    ...extra
  } as any;
}

const spam = { email: 'victim@example.com', previewText: 'Win', emailHtml: '<a href="x">claim</a>' };

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  sendMailSafe.mockClear();
});

describe('/api/sendMail', () => {
  it('refuses a browser request — no internal secret', async () => {
    const res = await sendMailRoute.POST(event(req('/api/sendMail', spam)));
    expect(res.status).toBe(403);
    expect(sendMailSafe).not.toHaveBeenCalled();
  });

  it('refuses a logged-in user too: a free account must not buy a relay', async () => {
    const res = await sendMailRoute.POST(
      event(req('/api/sendMail', spam, { cookie: 'jwt=abc; id=12' }), { locals: { uid: '12' } })
    );
    expect(res.status).toBe(403);
    expect(sendMailSafe).not.toHaveBeenCalled();
  });

  it('refuses a forged internal header', async () => {
    const res = await sendMailRoute.POST(
      event(req('/api/sendMail', spam, { 'x-internal-secret': 'test-admin-token' }))
    );
    expect(res.status).toBe(403);
    expect(sendMailSafe).not.toHaveBeenCalled();
  });

  it('sends for the server itself, both body shapes', async () => {
    const internal = { 'x-internal-secret': INTERNAL };

    let res = await sendMailRoute.POST(event(req('/api/sendMail', spam, internal)));
    expect(res.status).toBe(200);
    expect(sendMailSafe).toHaveBeenLastCalledWith({
      to: 'victim@example.com',
      subject: 'Win',
      html: '<a href="x">claim</a>',
      text: undefined
    });

    // svelty-email's { html, text } forwarded whole (EmailService, report).
    res = await sendMailRoute.POST(
      event(req('/api/sendMail', { ...spam, emailHtml: { html: '<b/>', text: 't' } }, internal))
    );
    expect(res.status).toBe(200);
    expect(sendMailSafe).toHaveBeenLastCalledWith(
      expect.objectContaining({ html: '<b/>', text: 't' })
    );
  });
});

describe('the templated relays in front of it', () => {
  const nutiBody = {
    pn: 'p',
    pl: '',
    pid: '1',
    uid: '1',
    kind: 'pend',
    name: 'n',
    pu: [
      { id: '1', email: 'me@example.com', username: 'me' },
      { id: '2', email: 'victim@example.com', username: 'v' }
    ]
  };
  const smaBody = { kind: 'nonreg', email: 'victim@example.com', link: 'https://evil', lang: 'en' };

  it.each([
    ['/api/nuti', () => nutiRoute.POST, nutiBody],
    ['/api/sma', () => smaRoute.POST, smaBody]
  ])('%s refuses a request without the internal secret', async (path, handler, body) => {
    const ev = event(req(path, body));
    const res = await handler()(ev);
    expect(res.status).toBe(403);
    expect(sendMailSafe).not.toHaveBeenCalled();
    expect(ev.fetch).not.toHaveBeenCalled();
  });

  it('/api/nuti still mails the other members for the server', async () => {
    const res = await nutiRoute.POST(
      event(req('/api/nuti', nutiBody, { 'x-internal-secret': INTERNAL }))
    );
    expect(res.status).toBe(200);
    expect(sendMailSafe).toHaveBeenCalledTimes(1);
    expect(sendMailSafe).toHaveBeenCalledWith(expect.objectContaining({ to: 'victim@example.com' }));
  });

  it('/api/sma still relays to /api/sendMail for the server', async () => {
    const ev = event(req('/api/sma', smaBody, { 'x-internal-secret': INTERNAL }));
    const res = await smaRoute.POST(ev);
    expect(res.status).toBe(200);
    expect(ev.fetch).toHaveBeenCalledWith('/api/sendMail', expect.anything());
  });
});

// ── Guard: a new endpoint must not reopen the relay ─────────────────────────
//
// An endpoint that sends mail itself, or forwards to /api/sendMail on the
// SvelteKit fetch (which stamps it internal), is a relay for whoever can call
// it. It is gated with rejectUnlessInternal, or it is listed here with the
// reason it may answer to someone else — and then it, not the caller, must
// decide who receives what.
const REVIEWED_PUBLIC_MAILERS: Record<string, string> = {
  'src/routes/api/monthi/+server.js': 'key-gated (x-monthi-key = ADMINMONTHER); recipients come from Strapi',
  'src/routes/api/report/+server.ts':
    'public bug report; a signed-in reporter is answered at their account address (locals.uid), ' +
    'a guest gets the fixed template with none of their text, once per address per day ' +
    '($lib/server/reportConfirmation.ts, report/server.test.ts)'
};

const ROOT = join(__dirname, '../../../..');

function serverFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) serverFiles(full, out);
    else if (/^\+server\.(js|ts)$/.test(name)) out.push(full);
  }
  return out;
}

const SENDS_MAIL =
  /\b(sendMailSafe|sendBolkMail|getTransporter|nodemailer)\b|fetch\w*\(\s*['"`]\/api\/(sendMail|nuti|nutiUser|nutifyPm|sma)['"`]/;
const MAILERS = serverFiles(join(ROOT, 'src/routes/api'))
  .map((f) => relative(ROOT, f).split('\\').join('/'))
  .filter((rel) => SENDS_MAIL.test(readFileSync(join(ROOT, rel), 'utf8')));

describe('every mailing endpoint is gated or reviewed', () => {
  it('finds the ones we know about (the scan works)', () => {
    expect(MAILERS).toContain('src/routes/api/sendMail/+server.js');
    expect(MAILERS).toContain('src/routes/api/sma/+server.js');
    expect(MAILERS).toContain('src/routes/api/report/+server.ts');
  });

  it.each(MAILERS)('%s', (rel) => {
    const gated = /rejectUnlessInternal\(/.test(readFileSync(join(ROOT, rel), 'utf8'));
    expect(
      gated || rel in REVIEWED_PUBLIC_MAILERS,
      `${rel} sends mail but is neither gated with rejectUnlessInternal nor reviewed in REVIEWED_PUBLIC_MAILERS`
    ).toBe(true);
  });

  it('the endpoints that send arbitrary content are gated, not merely reviewed', () => {
    for (const rel of [
      'src/routes/api/sendMail/+server.js',
      'src/routes/api/nuti/+server.js',
      'src/routes/api/sma/+server.js'
    ]) {
      expect(rel in REVIEWED_PUBLIC_MAILERS, rel).toBe(false);
      expect(readFileSync(join(ROOT, rel), 'utf8')).toMatch(/rejectUnlessInternal\(/);
    }
  });
});
