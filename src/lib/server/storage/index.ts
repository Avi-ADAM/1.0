/**
 * One storage interface, two drivers (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * - **local** (`SPACE_DOCS_DIR`) — a private folder on the API host. No third
 *   party, no account, no card. This is the default choice.
 * - **r2** (`R2_*`) — Cloudflare R2, if and when it is available.
 *
 * Everything above this file (the upload ticket endpoint, the serve endpoint,
 * `createSpaceDoc`) is written against this facade, so the library does not
 * know or care which one is behind it, and moving between them later is an env
 * change plus a file copy — not a code change.
 *
 * Neither configured ⇒ `null`, and the library stays on the stage-1 path
 * (upload proxied to Strapi/Cloudinary). Nothing breaks; files are just public
 * by URL again.
 */

import { blobSecret, freeBytes, localConfig, statObject, FREE_SPACE_FLOOR_BYTES } from './local.js';
import { mintBlobToken } from './blobToken.js';
import { GET_TTL_SECONDS, PUT_TTL_SECONDS, headObject, newObjectKey, presignGet, presignPut, r2Config } from './r2.js';

export { isProjectKey, newObjectKey } from './r2.js';
export type StorageKind = 'local' | 'r2';

/** Which driver this instance has, if any. R2 wins when both are set. */
export function storageKind(): StorageKind | null {
  if (r2Config()) return 'r2';
  if (localConfig() && blobSecret()) return 'local';
  return null;
}

/** The per-file cap of whichever driver is active. */
export function maxUploadBytes(): number {
  return r2Config()?.maxBytes ?? localConfig()?.maxBytes ?? 0;
}

export interface UploadTicket {
  key: string;
  /** Absolute: the bytes go to the bucket, or to the host that owns the disk. */
  url: string;
  headers: Record<string, string>;
  expiresIn: number;
}

/**
 * Where to PUT one new object.
 *
 * @param apiBase absolute origin of the instance that owns the disk
 *                (`ssrApiBase()`), '' when this instance is it. Ignored by R2.
 */
export async function uploadTicket(opts: {
  projectId: string;
  fileName: string;
  mime: string;
  apiBase: string;
}): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; reason: 'unconfigured' | 'disk-full' }> {
  const key = newObjectKey(opts.projectId, opts.fileName);

  const r2 = r2Config();
  if (r2) {
    return {
      ok: true,
      ticket: {
        key,
        url: presignPut(r2, key, opts.mime),
        headers: { 'Content-Type': opts.mime },
        expiresIn: PUT_TTL_SECONDS
      }
    };
  }

  const cfg = localConfig();
  const secret = blobSecret();
  if (!cfg || !secret) return { ok: false, reason: 'unconfigured' };

  // Better a refusal now than a half-written file and a wedged server later.
  const free = await freeBytes(cfg);
  if (free != null && free < FREE_SPACE_FLOOR_BYTES) return { ok: false, reason: 'disk-full' };

  const token = mintBlobToken(
    {
      key,
      mode: 'put',
      mime: opts.mime,
      maxBytes: cfg.maxBytes,
      fileName: opts.fileName,
      expiresAt: Date.now() + PUT_TTL_SECONDS * 1000
    },
    secret
  );
  return {
    ok: true,
    ticket: {
      key,
      url: `${opts.apiBase}/api/v1/space-docs/blob?token=${encodeURIComponent(token)}`,
      headers: { 'Content-Type': opts.mime },
      expiresIn: PUT_TTL_SECONDS
    }
  };
}

/** A short-lived URL that yields the object's bytes. */
export function downloadUrl(
  key: string,
  meta: { fileName: string; mime: string },
  apiBase: string
): string | null {
  const r2 = r2Config();
  if (r2) return presignGet(r2, key, meta);

  const cfg = localConfig();
  const secret = blobSecret();
  if (!cfg || !secret) return null;

  const token = mintBlobToken(
    {
      key,
      mode: 'get',
      mime: meta.mime,
      maxBytes: 0,
      fileName: meta.fileName,
      expiresAt: Date.now() + GET_TTL_SECONDS * 1000
    },
    secret
  );
  return `${apiBase}/api/v1/space-docs/blob?token=${encodeURIComponent(token)}`;
}

/**
 * Did the upload actually land, and how big is it? The browser *said* it
 * uploaded; the store is the only witness.
 *
 * With R2 that is a signed HEAD. With the local driver the disk may be on
 * another instance than the one running the action, so it asks the blob
 * endpoint over the same relative-URL path everything else uses — `handleFetch`
 * re-points it at the API host and stamps the internal secret.
 */
export async function confirmStored(
  key: string,
  meta: { fileName: string; mime: string },
  fetchFn: typeof fetch
): Promise<{ size: number } | null> {
  const r2 = r2Config();
  if (r2) return headObject(r2, key, fetchFn);

  const url = downloadUrl(key, meta, '');
  if (!url) return null;
  const res = await fetchFn(url, { method: 'HEAD' });
  if (!res.ok) return null;
  const size = Number(res.headers.get('content-length') ?? 0);
  return Number.isFinite(size) && size > 0 ? { size } : null;
}

/** For the endpoint: the local driver's own config, when it is the active one. */
export function localDriver() {
  if (r2Config()) return null;
  const cfg = localConfig();
  const secret = blobSecret();
  return cfg && secret ? { cfg, secret } : null;
}

export { statObject };
