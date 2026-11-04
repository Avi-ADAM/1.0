/**
 * Upload sessions — how a chat agent gets pictures it cannot touch
 * (MCP `createUploadSession` / `getUploadSession`, the /upload/<token> page).
 *
 * A chat client does not hand the agent the bytes of a photo the user
 * attached. So the agent asks for a short link, the user opens it on their
 * phone and drops the pictures there, and the agent reads back what arrived.
 *
 * Stateless by design, nothing new in Strapi:
 *   - the token is `<payload>.<mac>` — who (userId), where (projectId, an
 *     optional productId), how many (maxFiles), until when, and a random
 *     nonce, signed with a key derived for this purpose only
 *     (`uploadSessionKey`). Nothing is looked up by the token itself; an
 *     edited token fails the signature.
 *   - every file uploaded through it is stored in Strapi's media library with
 *     the caption `1lev1-upl:<nonce>`, which is how the session finds its
 *     files again and counts them against maxFiles. The caption is not a
 *     private field, so Strapi filters on it (a private one would silently
 *     match nothing).
 *
 * The link is a bearer capability: whoever holds it may add up to maxFiles
 * pictures until it expires, and nothing else — it reads no rikma data and
 * attaches nothing to a product. Attaching is a separate, member-checked call
 * (`setProductImages`). The page re-checks that the session's user is still a
 * member before every upload.
 */

import crypto from 'crypto';
import { b64url, fromB64url, safeEqual, uploadSessionKey } from '$lib/server/oauth/secret.js';
import { SESSION_DEFAULT_FILES, SESSION_MAX_FILES, SESSION_TTL_MINUTES } from '$lib/media/imagePolicy.js';

export interface UploadSession {
  userId: string;
  projectId: string;
  productId: string | null;
  maxFiles: number;
  /** Epoch ms. */
  expiresAt: number;
  nonce: string;
}

const ID_RE = /^\d{1,12}$/;
const NONCE_RE = /^[A-Za-z0-9_-]{16}$/;
const TOKEN_RE = /^([A-Za-z0-9_-]{8,200})\.([A-Za-z0-9_-]{22})$/;

function mac(payload: string, secret: Buffer): string {
  // 128 bits is plenty for a link that lives an hour; it keeps the URL short.
  return b64url(crypto.createHmac('sha256', secret).update(payload).digest().subarray(0, 16));
}

export function clampMaxFiles(n: unknown): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return SESSION_DEFAULT_FILES;
  return Math.min(v, SESSION_MAX_FILES);
}

export function mintUploadSession(
  args: { userId: string; projectId: string; productId?: string | null; maxFiles?: number; now?: number; ttlMinutes?: number },
  secret: Buffer = uploadSessionKey()
): { token: string; session: UploadSession } {
  const userId = String(args.userId);
  const projectId = String(args.projectId);
  const productId = args.productId != null && String(args.productId).trim() ? String(args.productId).trim() : null;
  if (!ID_RE.test(userId) || !ID_RE.test(projectId) || (productId && !ID_RE.test(productId))) {
    throw new Error('Upload session ids must be numeric');
  }
  const session: UploadSession = {
    userId,
    projectId,
    productId,
    maxFiles: clampMaxFiles(args.maxFiles),
    expiresAt: (args.now ?? Date.now()) + (args.ttlMinutes ?? SESSION_TTL_MINUTES) * 60_000,
    nonce: b64url(crypto.randomBytes(12))
  };
  const payload = b64url(
    [session.userId, session.projectId, session.productId ?? '0', session.maxFiles, session.expiresAt.toString(36), session.nonce].join('.')
  );
  return { token: `${payload}.${mac(payload, secret)}`, session };
}

export type SessionCheck =
  | { ok: true; session: UploadSession }
  | { ok: false; reason: 'malformed' | 'signature' | 'expired' };

/** The session a token names, once its signature and its clock both hold. */
export function verifyUploadSession(token: unknown, now = Date.now(), secret: Buffer = uploadSessionKey()): SessionCheck {
  if (typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const m = TOKEN_RE.exec(token.trim());
  if (!m) return { ok: false, reason: 'malformed' };
  const [, payload, sig] = m;
  if (!safeEqual(sig, mac(payload, secret))) return { ok: false, reason: 'signature' };
  const parts = fromB64url(payload).toString('utf8').split('.');
  if (parts.length !== 6) return { ok: false, reason: 'malformed' };
  const [userId, projectId, productId, maxFiles, exp36, nonce] = parts;
  const expiresAt = parseInt(exp36, 36);
  if (!ID_RE.test(userId) || !ID_RE.test(projectId) || !ID_RE.test(productId) || !NONCE_RE.test(nonce) || !Number.isFinite(expiresAt)) {
    return { ok: false, reason: 'malformed' };
  }
  if (now >= expiresAt) return { ok: false, reason: 'expired' };
  return {
    ok: true,
    session: {
      userId,
      projectId,
      productId: productId === '0' ? null : productId,
      maxFiles: clampMaxFiles(maxFiles),
      expiresAt,
      nonce
    }
  };
}

/** The caption every file of a session carries in the media library. */
export function sessionCaption(nonce: string): string {
  return `1lev1-upl:${nonce}`;
}

export function uploadPagePath(token: string): string {
  return `/upload/${token}`;
}
