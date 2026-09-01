// src/lib/server/oauth/secret.ts
//
// One root secret, two derived keys. `OAUTH_SECRET` is preferred; a deployment
// that has not set it falls back to `API_KEY_NONCE`, which every environment
// running the api-key system already has (see apiKeys.ts). Deriving instead of
// using the root directly keeps an OAuth signature from ever colliding with an
// api-key hash, even when the two share a fallback root.

import crypto from 'crypto';
import 'dotenv/config';
import { env } from '$env/dynamic/private';

// `process.env` first, deliberately. apiKeys.ts and webhooks/secret.ts both read
// API_KEY_NONCE that way, and under `vite dev` the two sources disagree: Vite
// layers .env.local over .env, so `$env/dynamic/private` can hand back a
// different nonce than the one the api-key hashes were built with. Reading the
// same source as apiKeys.ts is what keeps the fallback root identical to the
// one already in use; `env` stays as a backstop for runtimes that populate only
// that.
function root(): string {
  const s =
    process.env.OAUTH_SECRET ||
    env.OAUTH_SECRET ||
    process.env.API_KEY_NONCE ||
    env.API_KEY_NONCE;
  if (!s || s.length < 32) {
    throw new Error(
      'OAUTH_SECRET (or API_KEY_NONCE as fallback) must be set and at least 32 characters'
    );
  }
  return s;
}

function derive(info: string): Buffer {
  // hkdfSync returns an ArrayBuffer; wrap it so callers get a real Buffer.
  return Buffer.from(
    crypto.hkdfSync('sha256', Buffer.from(root()), Buffer.alloc(0), Buffer.from(info), 32)
  );
}

/** HMAC key for client_id signatures. */
export function clientSigningKey(): Buffer {
  return derive('1lev1-oauth-client-v1');
}

/** AES-256-GCM key for authorization-code envelopes. */
export function codeEncryptionKey(): Buffer {
  return derive('1lev1-oauth-code-v1');
}

export function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

export function fromB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

/** Constant-time compare that never throws on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
