/**
 * The token in an agent-prepared signup link, /hascama?agent=<token>
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1, §5.6).
 *
 * AES-256-GCM, the envelope the OAuth codes use, under a key of its own. It
 * carries only what the one signup screen prefills — the person's name, email,
 * countries, why they came, their language — and the id of the pending
 * session the agent prepared. Nothing in it authenticates anyone: the person
 * still signs, chooses a password and confirms their email; the session is
 * claimed through the signatory row created on that screen (§5.4).
 *
 * The key exists only in the VPS env, so www never opens a token itself — it
 * asks /api/assistant/signup-token.
 */

import crypto from 'crypto';
import { agentSignupKey, b64url, fromB64url } from '$lib/server/oauth/secret.js';

export const SIGNUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const SIGNUP_INTENTS = ['join', 'business', 'partnership', 'idea', 'order'] as const;
export type SignupIntent = (typeof SIGNUP_INTENTS)[number];

export interface SignupTokenPayload {
  sid: string;
  name: string;
  email: string;
  countryIds: number[];
  intent: SignupIntent;
  lang: string;
  /** Absolute expiry, ms since epoch. */
  exp: number;
}

export function mintSignupToken(
  input: Omit<SignupTokenPayload, 'exp'>,
  now: number = Date.now(),
  key: Buffer = agentSignupKey()
): string {
  const payload: SignupTokenPayload = { ...input, exp: now + SIGNUP_TOKEN_TTL_MS };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(payload), 'utf8')), cipher.final()]);
  return `${b64url(iv)}.${b64url(ct)}.${b64url(cipher.getAuthTag())}`;
}

/**
 * The payload, or null for anything that is not a live token of ours —
 * tampered, truncated, expired or from another key. One answer for all of
 * them: the page then shows the ordinary agreement, never an error.
 */
export function openSignupToken(
  token: unknown,
  now: number = Date.now(),
  key: Buffer = agentSignupKey()
): SignupTokenPayload | null {
  if (typeof token !== 'string' || token.length > 4000) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const [iv, ct, tag] = parts.map(fromB64url);
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    const p = JSON.parse(json) as SignupTokenPayload;
    if (!p || typeof p.exp !== 'number' || p.exp <= now) return null;
    if (typeof p.sid !== 'string' || typeof p.email !== 'string') return null;
    if (!(SIGNUP_INTENTS as readonly string[]).includes(p.intent)) return null;
    return p;
  } catch {
    return null;
  }
}
