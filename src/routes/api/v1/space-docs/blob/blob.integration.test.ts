import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$env/static/private', () => ({ ADMINMONTHER: 'test-admin-token' }));

import { GET, HEAD, PUT } from './+server.js';
import { mintBlobToken } from '$lib/server/storage/blobToken.js';
import { blobSecret } from '$lib/server/storage/local.js';

/**
 * The local driver end to end through its own endpoint: a ticket goes in,
 * bytes land on disk, and the same bytes come back out — plus every refusal
 * that keeps a ticket from being more than it says.
 */
const dir = await mkdtemp(join(tmpdir(), 'blob-endpoint-'));
const KEY = 'rikma/3/abc/lease.pdf';
const MIME = 'application/pdf';

beforeAll(() => {
  env.SPACE_DOCS_DIR = dir;
  env.SPACE_DOCS_MAX_MB = '1';
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const ticket = (over: Partial<Parameters<typeof mintBlobToken>[0]> = {}) =>
  mintBlobToken(
    {
      key: KEY,
      mode: 'put',
      mime: MIME,
      maxBytes: 1024 * 1024,
      fileName: 'חוזה שכירות.pdf',
      expiresAt: Date.now() + 60_000,
      ...over
    },
    blobSecret()!
  );

const call = (handler: any, token: string, init?: RequestInit & { method?: string }) => {
  const url = new URL(`http://api.test/api/v1/space-docs/blob?token=${encodeURIComponent(token)}`);
  const request = new Request(url, { method: init?.method ?? 'GET', ...init } as any);
  return handler({ request, url } as any);
};

const status = async (p: Promise<Response>) => {
  try {
    return (await p).status;
  } catch (e: any) {
    return e?.status ?? 500;
  }
};

describe('the blob endpoint', () => {
  it('stores what a put ticket describes, then serves it back', async () => {
    const body = new TextEncoder().encode('%PDF-1.7 hello');
    const put = await call(PUT, ticket(), { method: 'PUT', body, headers: { 'content-type': MIME } });
    expect(put.status).toBe(204);

    const get = ticket({ mode: 'get' });
    const head = await call(HEAD, get, { method: 'HEAD' });
    expect(head.status).toBe(200);
    // This is how createSpaceDoc learns the true size.
    expect(head.headers.get('content-length')).toBe(String(body.byteLength));

    const res = await call(GET, get);
    expect(await res.text()).toBe('%PDF-1.7 hello');
    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition).toMatch(/^attachment;/);
    // Hebrew survives, RFC 5987 style.
    expect(disposition).toContain("filename*=UTF-8''%D7%97");
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('refuses a forged ticket, another secret, and an expired one', async () => {
    const good = ticket({ mode: 'get' });
    expect(await status(call(GET, good.slice(0, -4) + 'aaaa'))).toBe(403);
    expect(await status(call(GET, mintBlobToken({ key: KEY, mode: 'get', mime: MIME, maxBytes: 0, fileName: 'x', expiresAt: Date.now() + 1000 }, 'someone-elses-secret')))).toBe(403);
    expect(await status(call(GET, ticket({ mode: 'get', expiresAt: Date.now() - 1 })))).toBe(403);
  });

  it('will not let a download ticket upload, or an upload ticket download', async () => {
    expect(
      await status(call(PUT, ticket({ mode: 'get' }), { method: 'PUT', body: new Uint8Array([1]), headers: { 'content-type': MIME } }))
    ).toBe(403);
    expect(await status(call(GET, ticket()))).toBe(403);
  });

  it('refuses a body whose type is not the one the ticket names', async () => {
    const res = await status(
      call(PUT, ticket({ key: 'rikma/3/abc/other.pdf' }), {
        method: 'PUT',
        body: new Uint8Array([1, 2]),
        headers: { 'content-type': 'text/html' }
      })
    );
    expect(res).toBe(415);
  });

  it('refuses a body over the ticket’s cap', async () => {
    const small = ticket({ key: 'rikma/3/abc/big.pdf', maxBytes: 4 });
    const res = await status(
      call(PUT, small, { method: 'PUT', body: new Uint8Array(50), headers: { 'content-type': MIME } })
    );
    expect(res).toBe(413);
  });

  it('is 404 for a key that was never uploaded', async () => {
    expect(await status(call(GET, ticket({ key: 'rikma/3/abc/ghost.pdf', mode: 'get' })))).toBe(404);
  });

  it('serves a photo inline but never an SVG', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await call(PUT, ticket({ key: 'rikma/3/abc/p.png', mime: 'image/png' }), {
      method: 'PUT',
      body: png,
      headers: { 'content-type': 'image/png' }
    });
    const shown = await call(GET, ticket({ key: 'rikma/3/abc/p.png', mode: 'get', mime: 'image/png', fileName: 'p.png' }));
    expect(shown.headers.get('content-disposition')).toMatch(/^inline;/);
    expect(shown.headers.get('content-type')).toBe('image/png');

    await call(PUT, ticket({ key: 'rikma/3/abc/s.svg', mime: 'image/svg+xml' }), {
      method: 'PUT',
      body: new TextEncoder().encode('<svg onload="alert(1)"/>'),
      headers: { 'content-type': 'image/svg+xml' }
    });
    const svg = await call(GET, ticket({ key: 'rikma/3/abc/s.svg', mode: 'get', mime: 'image/svg+xml', fileName: 's.svg' }));
    expect(svg.headers.get('content-disposition')).toMatch(/^attachment;/);
    expect(svg.headers.get('content-type')).toBe('application/octet-stream');
  });

  it('is 404 on an instance with no local storage at all', async () => {
    const dirValue = env.SPACE_DOCS_DIR;
    delete env.SPACE_DOCS_DIR;
    expect(await status(call(GET, ticket({ mode: 'get' })))).toBe(404);
    env.SPACE_DOCS_DIR = dirValue;
  });
});
