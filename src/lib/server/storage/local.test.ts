import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$env/static/private', () => ({ ADMINMONTHER: 'test-admin-token' }));

import { mintBlobToken, readBlobToken } from './blobToken.js';
import { blobSecret, localConfig, objectPath, readObject, saveObject, statObject } from './local.js';

const SECRET = 'a-long-enough-test-secret';
const dir = await mkdtemp(join(tmpdir(), 'spacedocs-'));
const cfg = { dir, maxBytes: 1000 };

const stream = (bytes: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    }
  });

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
});

describe('blob tickets', () => {
  const claims = {
    key: 'rikma/3/u/a.pdf',
    mode: 'put' as const,
    mime: 'application/pdf',
    maxBytes: 500,
    fileName: 'a.pdf',
    expiresAt: 10_000
  };

  it('round-trips every claim', () => {
    expect(readBlobToken(mintBlobToken(claims, SECRET), SECRET, 5_000)).toEqual(claims);
  });

  it('is dead when expired, re-signed, or altered', () => {
    const token = mintBlobToken(claims, SECRET);
    expect(readBlobToken(token, SECRET, 10_000)).toBeNull();
    expect(readBlobToken(token, 'another-secret-entirely', 5_000)).toBeNull();

    // Keep the signature, swap the key for another rikma's object.
    const [, mac] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ v: 1, k: 'rikma/9/u/a.pdf', m: 'put', t: 'application/pdf', s: 500, n: 'a.pdf', exp: 10_000 })
    ).toString('base64url');
    expect(readBlobToken(`${forged}.${mac}`, SECRET, 5_000)).toBeNull();
    expect(readBlobToken('nonsense', SECRET, 5_000)).toBeNull();
    expect(readBlobToken(42, SECRET, 5_000)).toBeNull();
  });

  it('keeps put and get apart, so a download ticket cannot upload', () => {
    const get = readBlobToken(mintBlobToken({ ...claims, mode: 'get' }, SECRET), SECRET, 5_000);
    expect(get?.mode).toBe('get');
  });
});

describe('localConfig / blobSecret', () => {
  it('is off until SPACE_DOCS_DIR is set', () => {
    expect(localConfig()).toBeNull();
    env.SPACE_DOCS_DIR = '/data/space-docs';
    expect(localConfig()).toEqual({ dir: '/data/space-docs', maxBytes: 100 * 1024 * 1024 });
    env.SPACE_DOCS_MAX_MB = '25';
    expect(localConfig()?.maxBytes).toBe(25 * 1024 * 1024);
  });

  it('derives the ticket secret from the admin token, never exposing it', () => {
    const secret = blobSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(secret).not.toContain('test-admin-token');
  });
});

describe('objectPath', () => {
  it('maps a key under the directory', () => {
    expect(objectPath(dir, 'rikma/3/u/a.pdf')).toBe(join(dir, 'rikma', '3', 'u', 'a.pdf'));
  });

  it('refuses anything that would climb out of it', () => {
    expect(objectPath(dir, '../etc/passwd')).toBeNull();
    expect(objectPath(dir, 'rikma/../../etc/passwd')).toBeNull();
    expect(objectPath(dir, '/etc/passwd')).toBeNull();
    expect(objectPath(dir, 'a//b')).toBeNull();
    expect(objectPath(dir, 'a/\u0000b')).toBeNull();
    expect(objectPath(dir, '')).toBeNull();
  });
});

describe('saveObject / readObject', () => {
  it('stores bytes and reads them back', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const out = await saveObject(cfg, 'rikma/3/u/a.bin', stream(bytes), 1000);
    expect(out).toEqual({ ok: true, size: 5 });
    expect(await statObject(cfg, 'rikma/3/u/a.bin')).toEqual({ size: 5 });

    const web = readObject(cfg, 'rikma/3/u/a.bin')!;
    const chunks: Uint8Array[] = [];
    for await (const chunk of web as any) chunks.push(chunk);
    expect(Buffer.concat(chunks)).toEqual(Buffer.from(bytes));
  });

  it('refuses a body past the cap and leaves nothing behind', async () => {
    const out = await saveObject(cfg, 'rikma/3/u/big.bin', stream(new Uint8Array(200)), 100);
    expect(out).toEqual({ ok: false, reason: 'too-large' });
    expect(await statObject(cfg, 'rikma/3/u/big.bin')).toBeNull();
    // and no half-written temp file is left for someone to find
    await expect(readFile(join(dir, 'rikma/3/u/big.bin.part'))).rejects.toThrow();
  });

  it('refuses an empty body and a key outside the directory', async () => {
    expect(await saveObject(cfg, 'rikma/3/u/empty.bin', stream(new Uint8Array(0)), 100)).toEqual({
      ok: false,
      reason: 'empty'
    });
    expect(await saveObject(cfg, '../escape.bin', stream(new Uint8Array([1])), 100)).toEqual({
      ok: false,
      reason: 'path'
    });
  });

  it('reports nothing for a directory or a missing key', async () => {
    await mkdir(join(dir, 'rikma/3/folder'), { recursive: true });
    expect(await statObject(cfg, 'rikma/3/folder')).toBeNull();
    expect(await statObject(cfg, 'rikma/3/u/nope.bin')).toBeNull();
  });

  it('overwrites atomically — a re-upload of the same key replaces it', async () => {
    await writeFile(join(dir, 'rikma/3/u/a.bin'), 'old');
    const out = await saveObject(cfg, 'rikma/3/u/a.bin', stream(new Uint8Array([9, 9])), 1000);
    expect(out).toEqual({ ok: true, size: 2 });
    expect(await readFile(join(dir, 'rikma/3/u/a.bin'))).toEqual(Buffer.from([9, 9]));
  });
});

afterAll(async () => {
  await import('node:fs/promises').then((fs) => fs.rm(dir, { recursive: true, force: true }));
});
