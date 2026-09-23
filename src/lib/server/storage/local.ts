/**
 * The local storage driver: a private folder on the API host
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * Same job as `r2.ts`, no third party and no credit card: the bytes live in a
 * directory that nginx never serves, and the only way in or out is a signed
 * blob ticket (`blobToken.ts`) checked by `/api/v1/space-docs/blob`.
 *
 * It runs **only on the instance that owns the disk** (api.1lev1.com). That is
 * why the upload and download URLs it mints are absolute: a browser loading
 * the app from Vercel must send its bytes to the VPS, not to Vercel.
 *
 * `SPACE_DOCS_DIR` switches it on. Unset — and no R2 — leaves the library on
 * the stage-1 path (Strapi/Cloudinary), exactly as before.
 */

import { env } from '$env/dynamic/private';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat, statfs } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { ADMINMONTHER } from '$env/static/private';

export interface LocalConfig {
  dir: string;
  maxBytes: number;
}

/** Refuse new uploads when the disk is nearly full — before, not after. */
export const FREE_SPACE_FLOOR_BYTES = 2 * 1024 * 1024 * 1024;

export function localConfig(): LocalConfig | null {
  const dir = (env.SPACE_DOCS_DIR || '').trim();
  if (!dir) return null;
  const mb = Number(env.SPACE_DOCS_MAX_MB);
  return { dir, maxBytes: Number.isFinite(mb) && mb > 0 ? Math.floor(mb * 1024 * 1024) : 100 * 1024 * 1024 };
}

/**
 * The blob tickets' secret, derived from the admin token the API instance
 * already has — one less secret to deploy, and it never leaves the server.
 * Same derivation idea as `internalSecret.js`.
 */
export function blobSecret(): string | null {
  const base = (ADMINMONTHER || '').trim();
  if (!base) return null;
  return createHash('sha256').update(`${base}:space-docs-blob:v1`).digest('hex');
}

/**
 * Absolute path for an object key, or null when the key tries to leave the
 * directory. The key is always one we minted, but this is the gate that makes
 * that not matter.
 */
export function objectPath(dir: string, key: string): string | null {
  if (typeof key !== 'string' || key === '' || key.includes('\0')) return null;
  if (key.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')) return null;
  const root = resolve(dir);
  const full = resolve(join(root, key));
  return full === root || full.startsWith(root + sep) ? full : null;
}

export async function statObject(cfg: LocalConfig, key: string): Promise<{ size: number } | null> {
  const path = objectPath(cfg.dir, key);
  if (!path) return null;
  try {
    const s = await stat(path);
    return s.isFile() ? { size: s.size } : null;
  } catch {
    return null;
  }
}

/**
 * Stream a body to disk, refusing to write more than `maxBytes`.
 *
 * Written to a `.part` file next to the target and renamed only once the whole
 * body has landed, so a connection that dies halfway never leaves a truncated
 * object that a member would later download as if it were the file.
 */
export async function saveObject(
  cfg: LocalConfig,
  key: string,
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): Promise<{ ok: true; size: number } | { ok: false; reason: 'path' | 'too-large' | 'empty' | 'io' }> {
  const path = objectPath(cfg.dir, key);
  if (!path) return { ok: false, reason: 'path' };
  if (!body) return { ok: false, reason: 'empty' };

  const temp = `${path}.part`;
  try {
    await mkdir(dirname(path), { recursive: true });
    const limit = counter(maxBytes);
    await pipeline(Readable.fromWeb(body as any), limit.stream, createWriteStream(temp));
    const size = limit.size();
    if (size === 0) {
      await rm(temp, { force: true });
      return { ok: false, reason: 'empty' };
    }
    await rename(temp, path);
    return { ok: true, size };
  } catch (e) {
    const tooLarge = e instanceof Error && e.message === 'too large';
    await rm(temp, { force: true }).catch(() => {});
    return { ok: false, reason: tooLarge ? 'too-large' : 'io' };
  }
}

/**
 * A pass-through that counts bytes and kills the pipe past the cap — so a
 * client that ignores the size it declared cannot fill the disk.
 */
function counter(maxBytes: number): { stream: Transform; exceeded: () => boolean; size: () => number } {
  let total = 0;
  let over = false;
  const stream = new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > maxBytes) {
        over = true;
        return cb(new Error('too large'));
      }
      cb(null, chunk);
    }
  });
  return { stream, exceeded: () => over, size: () => total };
}

/** A web stream of the object, for the endpoint to answer with. */
export function readObject(cfg: LocalConfig, key: string): ReadableStream<Uint8Array> | null {
  const path = objectPath(cfg.dir, key);
  if (!path) return null;
  try {
    return Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>;
  } catch {
    return null;
  }
}

export async function deleteObject(cfg: LocalConfig, key: string): Promise<void> {
  const path = objectPath(cfg.dir, key);
  if (path) await rm(path, { force: true }).catch(() => {});
}

/** Bytes still free on the volume, or null when it cannot be read. */
export async function freeBytes(cfg: LocalConfig): Promise<number | null> {
  try {
    const s = await statfs(cfg.dir);
    return Number(s.bavail) * Number(s.bsize);
  } catch {
    return null;
  }
}
