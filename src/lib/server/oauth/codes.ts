// src/lib/server/oauth/codes.ts
//
// Authorization codes as AES-256-GCM envelopes. The raw api-key travels inside
// the ciphertext because the database only ever stores its HMAC — there is no
// other moment we could hand it back at /token.
//
// Single-use is enforced by REPLAY_CACHE, an in-process set of spent jti values.
// On the single `sveltekit-api` container that is exact; across replicas a code
// could be spent once per replica inside its 60s TTL. Redemption still requires
// the PKCE verifier, so this is a corner to close before scaling out, not an
// open door. See docs/PLAN_MCP_OAUTH.md.

import crypto from 'crypto';
import { codeEncryptionKey, b64url, fromB64url } from './secret.js';

const CODE_TTL_MS = 60_000;

export interface CodePayload {
  /** The raw api-key this code will be exchanged for. */
  key: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  /** Unique id, for single-use enforcement. */
  jti: string;
  /** Absolute expiry, ms since epoch. */
  exp: number;
}

const REPLAY_CACHE = new Map<string, number>();

function sweepReplayCache(now: number): void {
  for (const [jti, exp] of REPLAY_CACHE) {
    if (exp <= now) REPLAY_CACHE.delete(jti);
  }
}

export function mintCode(
  input: Omit<CodePayload, 'jti' | 'exp'>,
  now: number = Date.now()
): string {
  const payload: CodePayload = {
    ...input,
    jti: crypto.randomBytes(16).toString('base64url'),
    exp: now + CODE_TTL_MS
  };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', codeEncryptionKey(), iv);
  const ct = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), 'utf8')),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `${b64url(iv)}.${b64url(ct)}.${b64url(tag)}`;
}

export type CodeFailure = 'malformed' | 'expired' | 'replayed';

/**
 * The result is a flat shape rather than a discriminated union on purpose: the
 * project builds with `strict: false` (see jsconfig.json), and without
 * strictNullChecks TypeScript will not narrow `{ok:true}|{ok:false}` — every
 * call site would error on the field it just proved is there.
 */
export interface RedeemResult {
  ok: boolean;
  payload?: CodePayload;
  reason?: CodeFailure;
}

/**
 * Decrypt and spend a code. Returns the payload exactly once; every later call
 * with the same code returns `replayed`.
 */
export function redeemCode(code: string, now: number = Date.now()): RedeemResult {
  if (typeof code !== 'string') return { ok: false, reason: 'malformed' };
  const parts = code.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  let payload: CodePayload;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      codeEncryptionKey(),
      fromB64url(parts[0])
    );
    decipher.setAuthTag(fromB64url(parts[2]));
    const pt = Buffer.concat([decipher.update(fromB64url(parts[1])), decipher.final()]);
    payload = JSON.parse(pt.toString('utf8')) as CodePayload;
  } catch {
    // Wrong key, tampered ciphertext, or bad base64 all land here.
    return { ok: false, reason: 'malformed' };
  }

  sweepReplayCache(now);

  if (!payload.exp || payload.exp <= now) return { ok: false, reason: 'expired' };
  if (REPLAY_CACHE.has(payload.jti)) return { ok: false, reason: 'replayed' };

  REPLAY_CACHE.set(payload.jti, payload.exp);
  return { ok: true, payload };
}

/** Test seam — the replay set is process-global otherwise. */
export function __resetReplayCache(): void {
  REPLAY_CACHE.clear();
}
