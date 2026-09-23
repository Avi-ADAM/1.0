/**
 * Signed one-object tickets for the **local** storage driver
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * R2 has presigned URLs; a folder on our own VPS does not, so this is the
 * equivalent: a short-lived HMAC that says "this exact object key, this
 * direction, until this moment" — and nothing else. The blob endpoint needs no
 * session and no database lookup to honour it, which is what lets the browser
 * PUT straight to the API host and GET the bytes back without a cookie.
 *
 * Pure (the secret is passed in), so the forgery cases are tested directly.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export type BlobMode = 'put' | 'get';

export interface BlobClaims {
  key: string;
  mode: BlobMode;
  /** Content type: enforced on upload, and what the download is served as. */
  mime: string;
  /** `put`: the largest body accepted. `get`: unused (0). */
  maxBytes: number;
  /** `get`: the download's file name. */
  fileName: string;
  expiresAt: number;
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export function mintBlobToken(claims: BlobClaims, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      k: claims.key,
      m: claims.mode,
      t: claims.mime,
      s: Math.max(0, Math.floor(claims.maxBytes)),
      n: claims.fileName,
      exp: claims.expiresAt
    })
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/** The claims, or null for anything forged, expired or malformed. */
export function readBlobToken(token: unknown, secret: string, now = Date.now()): BlobClaims | null {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (p?.v !== 1 || (p.m !== 'put' && p.m !== 'get')) return null;
    if (typeof p.k !== 'string' || p.k === '' || !(Number(p.exp) > now)) return null;
    return {
      key: p.k,
      mode: p.m,
      mime: String(p.t ?? ''),
      maxBytes: Number(p.s) || 0,
      fileName: String(p.n ?? ''),
      expiresAt: Number(p.exp)
    };
  } catch {
    return null;
  }
}
