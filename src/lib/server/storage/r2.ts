/**
 * The private **S3-compatible** bucket behind a rikma's shared library
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * Cloudflare R2 (`R2_*`) or anything else that speaks S3 — MinIO, Garage,
 * Backblaze — through `S3_ENDPOINT`/`S3_REGION`. Only the endpoint and the
 * region differ; the signature is the same, which is why a self-hosted store
 * in Docker needs no code, just env. For a folder on our own disk with no
 * store at all, see `local.ts`.
 *
 * Why not "point Strapi's upload provider at R2", as the plan's first draft
 * said: Strapi's provider is global and it is **Cloudinary** (1.0b
 * `config/plugins.js`). Profile photos, product images and every other public
 * picture go through it and are meant to be public. Swapping the provider for
 * a private bucket would break all of those; pointing it at a public R2 bucket
 * would change nothing about privacy. So the library bypasses Strapi's upload
 * entirely: the browser PUTs straight to R2 on a presigned URL, the row stores
 * only the object key, and every read goes through a members-checked endpoint
 * that redirects to a URL valid for a few minutes. The bucket is never public.
 *
 * Off unless all four `R2_*` variables are set — then the tab keeps working
 * exactly as stage 1 did (proxy upload to Cloudinary), so deploying this code
 * before the bucket exists changes nothing.
 *
 * Secrets are read through `$env/dynamic/private`: `process.env` is empty under
 * `vite dev`. They live only on the API instance (api.1lev1.com), like the
 * GitHub App's — the endpoints under `/api/v1/space-docs/` run there.
 */

import { env } from '$env/dynamic/private';
import { randomUUID } from 'node:crypto';
import { presignUrl } from './s3presign.js';
import { DIRECT_MAX_BYTES_DEFAULT } from '$lib/uploads/policy.js';

export interface R2Config {
  host: string;
  protocol: 'http' | 'https';
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxBytes: number;
}

/**
 * The bucket's config, or null when no S3-compatible store is set here.
 *
 * Two ways to name the endpoint:
 * - `R2_ACCOUNT_ID` → `<id>.r2.cloudflarestorage.com`, region `auto`
 * - `S3_ENDPOINT` (e.g. `http://minio:9000`) + optional `S3_REGION`
 *
 * Credentials are `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` (or the `S3_`
 * twins) and the bucket is `R2_BUCKET`/`S3_BUCKET`.
 */
export function r2Config(): R2Config | null {
  const pick = (a: string, b: string) => (env[a] || env[b] || '').trim();
  const accessKeyId = pick('R2_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID');
  const secretAccessKey = pick('R2_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY');
  const bucket = pick('R2_BUCKET', 'S3_BUCKET');
  const accountId = (env.R2_ACCOUNT_ID || '').trim();
  const endpoint = (env.S3_ENDPOINT || '').trim();
  if (!accessKeyId || !secretAccessKey || !bucket || (!accountId && !endpoint)) return null;

  let host: string;
  let protocol: 'http' | 'https' = 'https';
  let region = (env.S3_REGION || '').trim();
  if (endpoint) {
    try {
      const url = new URL(endpoint.includes('://') ? endpoint : `https://${endpoint}`);
      host = url.host;
      protocol = url.protocol === 'http:' ? 'http' : 'https';
    } catch {
      return null;
    }
    region ||= 'us-east-1';
  } else {
    host = `${accountId}.r2.cloudflarestorage.com`;
    region ||= 'auto';
  }

  const mb = Number(env.SPACE_DOCS_MAX_MB);
  return {
    host,
    protocol,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    maxBytes: Number.isFinite(mb) && mb > 0 ? Math.floor(mb * 1024 * 1024) : DIRECT_MAX_BYTES_DEFAULT
  };
}

/** How long each kind of URL lives. Short: they are bearer tokens. */
export const PUT_TTL_SECONDS = 10 * 60; // a slow upload on a phone
export const GET_TTL_SECONDS = 5 * 60; // long enough to start a download
const HEAD_TTL_SECONDS = 60;

/**
 * Every object a rikma owns lives under `rikma/<projectId>/`. The prefix is
 * what `createSpaceDoc` checks, so a member of rikma A cannot attach an object
 * key that was minted for rikma B — the key is the only proof of which rikma
 * an upload belongs to, because the upload itself never passed through us.
 */
export function projectPrefix(projectId: string | number): string {
  return `rikma/${String(projectId)}/`;
}

/**
 * The file name as stored in the key: readable in the R2 dashboard, but with
 * nothing that could change the key's shape. The real name is kept on the row
 * and is what the download is called.
 */
export function safeKeyName(fileName: string): string {
  const cleaned = String(fileName ?? '')
    .normalize('NFC')
    .replace(/[\\/]+/g, '-')
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-120);
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? 'file' : cleaned;
}

/** A fresh key under the rikma's prefix. The uuid makes names never collide. */
export function newObjectKey(projectId: string | number, fileName: string): string {
  return `${projectPrefix(projectId)}${randomUUID()}/${safeKeyName(fileName)}`;
}

export function isProjectKey(key: unknown, projectId: string | number): boolean {
  if (typeof key !== 'string') return false;
  if (!key.startsWith(projectPrefix(projectId))) return false;
  // No traversal, no empty segments: the key must be exactly what newObjectKey mints.
  return !key.split('/').some((seg) => seg === '' || seg === '.' || seg === '..');
}

function objectPath(cfg: R2Config, key: string) {
  return `/${cfg.bucket}/${key}`;
}

export function presignPut(cfg: R2Config, key: string, contentType: string, now = new Date()): string {
  return presignUrl({
    method: 'PUT',
    host: cfg.host,
    protocol: cfg.protocol,
    path: objectPath(cfg, key),
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    expires: PUT_TTL_SECONDS,
    date: now,
    headers: { 'content-type': contentType }
  });
}

/**
 * A download URL. `Content-Disposition` is set by the signature, not by
 * whatever was stored: images open inline, everything else downloads under the
 * name the member gave it. RFC 5987 `filename*` so Hebrew/Arabic names survive.
 */
export function presignGet(
  cfg: R2Config,
  key: string,
  opts: { fileName: string; mime: string },
  now = new Date()
): string {
  const inline = /^image\/(jpeg|png|webp|gif)$/.test(opts.mime);
  const ascii = safeKeyName(opts.fileName).replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  const disposition = `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(
    safeKeyName(opts.fileName)
  )}`;
  return presignUrl({
    method: 'GET',
    host: cfg.host,
    protocol: cfg.protocol,
    path: objectPath(cfg, key),
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    expires: GET_TTL_SECONDS,
    date: now,
    query: {
      'response-content-disposition': disposition,
      // SVG is deliberately not served as an image: rendered inline it is a
      // document that can run script. As an attachment it is just a file.
      'response-content-type': inline ? opts.mime : 'application/octet-stream'
    }
  });
}

/**
 * Did the upload actually land, and how big is it? The browser *said* it
 * uploaded; the bucket is the only witness. Returns null when the object is
 * not there.
 */
export async function headObject(
  cfg: R2Config,
  key: string,
  fetchFn: typeof fetch = fetch
): Promise<{ size: number; contentType: string } | null> {
  const url = presignUrl({
    method: 'HEAD',
    host: cfg.host,
    protocol: cfg.protocol,
    path: objectPath(cfg, key),
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    expires: HEAD_TTL_SECONDS,
    date: new Date()
  });
  const res = await fetchFn(url, { method: 'HEAD' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 HEAD ${res.status}`);
  return {
    size: Number(res.headers.get('content-length') ?? 0),
    contentType: res.headers.get('content-type') ?? ''
  };
}
