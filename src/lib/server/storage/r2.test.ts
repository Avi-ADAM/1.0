import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import {
  headObject,
  isProjectKey,
  newObjectKey,
  presignGet,
  presignPut,
  r2Config,
  safeKeyName
} from './r2.js';

const FULL = {
  R2_ACCOUNT_ID: 'acct',
  R2_ACCESS_KEY_ID: 'AKID',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_BUCKET: 'rikma-docs'
};

beforeEach(() => {
  for (const k of Object.keys(env)) delete env[k];
});

describe('r2Config', () => {
  it('is off until all four variables are set', () => {
    expect(r2Config()).toBeNull();
    Object.assign(env, { ...FULL, R2_BUCKET: '' });
    expect(r2Config()).toBeNull();
  });

  it('builds the account host and a 100MB default cap', () => {
    Object.assign(env, FULL);
    expect(r2Config()).toMatchObject({
      host: 'acct.r2.cloudflarestorage.com',
      protocol: 'https',
      region: 'auto',
      bucket: 'rikma-docs',
      maxBytes: 100 * 1024 * 1024
    });
  });

  // The same driver serves a self-hosted store (MinIO, Garage) in Docker —
  // that is the whole point of keeping it S3-shaped rather than R2-shaped.
  it('takes a self-hosted endpoint over http, with its own region', () => {
    Object.assign(env, {
      S3_ENDPOINT: 'http://minio:9000',
      S3_ACCESS_KEY_ID: 'A',
      S3_SECRET_ACCESS_KEY: 'S',
      S3_BUCKET: 'rikma-docs'
    });
    expect(r2Config()).toMatchObject({
      host: 'minio:9000',
      protocol: 'http',
      region: 'us-east-1',
      bucket: 'rikma-docs'
    });
    env.S3_REGION = 'eu-1';
    expect(r2Config()?.region).toBe('eu-1');
  });

  it('needs credentials and a bucket whichever naming is used', () => {
    Object.assign(env, { S3_ENDPOINT: 'http://minio:9000', S3_ACCESS_KEY_ID: 'A' });
    expect(r2Config()).toBeNull();
  });

  it('takes the cap from SPACE_DOCS_MAX_MB', () => {
    Object.assign(env, FULL, { SPACE_DOCS_MAX_MB: '250' });
    expect(r2Config()?.maxBytes).toBe(250 * 1024 * 1024);
  });
});

describe('object keys', () => {
  it('mints keys under the rikma prefix', () => {
    const key = newObjectKey('3', 'חוזה שכירות.pdf');
    expect(key).toMatch(/^rikma\/3\/[0-9a-f-]{36}\/חוזה שכירות\.pdf$/);
    expect(isProjectKey(key, '3')).toBe(true);
    expect(isProjectKey(key, '4')).toBe(false);
  });

  it('never lets a file name change the key’s shape', () => {
    expect(safeKeyName('../../etc/passwd')).toBe('..-..-etc-passwd');
    expect(safeKeyName('a\\b/c')).toBe('a-b-c');
    expect(safeKeyName('..')).toBe('file');
    expect(safeKeyName('')).toBe('file');
    expect(newObjectKey('3', '../x').split('/')).toHaveLength(4);
  });

  it('rejects prefix look-alikes and traversal', () => {
    expect(isProjectKey('rikma/30/u/a.pdf', '3')).toBe(false);
    expect(isProjectKey('rikma/3/../4/a.pdf', '3')).toBe(false);
    expect(isProjectKey('rikma/3//a.pdf', '3')).toBe(false);
    expect(isProjectKey(42, '3')).toBe(false);
  });
});

describe('signed URLs', () => {
  const cfg = {
    host: 'acct.r2.cloudflarestorage.com',
    protocol: 'https' as const,
    region: 'auto',
    bucket: 'b',
    accessKeyId: 'A',
    secretAccessKey: 'S',
    maxBytes: 1
  };

  it('binds a PUT to its content type', () => {
    const url = new URL(presignPut(cfg, 'rikma/3/u/a.pdf', 'application/pdf'));
    expect(url.pathname).toBe('/b/rikma/3/u/a.pdf');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-type;host');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
  });

  it('opens a photo inline and downloads everything else', () => {
    const photo = new URL(presignGet(cfg, 'k', { fileName: 'a.png', mime: 'image/png' }));
    expect(photo.searchParams.get('response-content-disposition')).toMatch(/^inline;/);
    expect(photo.searchParams.get('response-content-type')).toBe('image/png');

    const pdf = new URL(presignGet(cfg, 'k', { fileName: 'חוזה.pdf', mime: 'application/pdf' }));
    const disposition = pdf.searchParams.get('response-content-disposition') ?? '';
    expect(disposition).toMatch(/^attachment;/);
    expect(disposition).toContain("filename*=UTF-8''%D7%97");
    expect(pdf.searchParams.get('X-Amz-Expires')).toBe('300');
  });

  it('never serves SVG as an image — inline it could run script', () => {
    const svg = new URL(presignGet(cfg, 'k', { fileName: 'a.svg', mime: 'image/svg+xml' }));
    expect(svg.searchParams.get('response-content-disposition')).toMatch(/^attachment;/);
    expect(svg.searchParams.get('response-content-type')).toBe('application/octet-stream');
  });
});

describe('headObject', () => {
  const cfg = {
    host: 'h',
    protocol: 'https' as const,
    region: 'auto',
    bucket: 'b',
    accessKeyId: 'A',
    secretAccessKey: 'S',
    maxBytes: 1
  };

  it('reports size when the object is there', async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 200, headers: { 'content-length': '2048' } }));
    expect(await headObject(cfg, 'k', fetchFn as any)).toMatchObject({ size: 2048 });
    expect((fetchFn.mock.calls[0] as any)[1]).toEqual({ method: 'HEAD' });
  });

  it('is null when the upload never arrived', async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 404 }));
    expect(await headObject(cfg, 'k', fetchFn as any)).toBeNull();
  });
});
