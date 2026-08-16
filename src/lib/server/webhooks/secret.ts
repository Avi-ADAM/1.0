// src/lib/server/webhooks/secret.ts
//
// The signing secret for an api-key's outgoing webhooks.
//
// It is DERIVED from the key's Strapi id rather than stored: the server can
// always recompute it, the UI shows it once next to the raw key, and there is
// one fewer long-lived secret sitting in a database backup. It shares the
// API_KEY_NONCE that already protects the key hashes, so a leaked webhook
// secret reveals nothing about the key itself (HMAC is one-way) and vice versa.

import crypto from 'crypto';
import 'dotenv/config';

const NONCE = process.env.API_KEY_NONCE!;
if (!NONCE || NONCE.length < 32) {
  throw new Error('API_KEY_NONCE חייב להיות מוגדר ולהכיל לפחות 32 תווים');
}

/** Stable secret for this key's deliveries. Same input ⇒ same secret, forever. */
export function webhookSecretForKey(keyId: string | number): string {
  return crypto
    .createHmac('sha256', NONCE)
    .update(`webhook:${String(keyId)}`)
    .digest('hex');
}

/**
 * The value of the `X-1lev1-Signature` header for a raw JSON body.
 *
 * Signs the body EXACTLY as it goes on the wire — the receiver must verify
 * against the raw request text too, because re-serialising parsed JSON can
 * reorder keys and break the comparison.
 */
export function signWebhookBody(rawBody: string, secret: string): string {
  const digest = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return `sha256=${digest}`;
}

/**
 * Constant-time verification, exported so the docs page can show the receiver
 * the exact code it needs (and so the tests verify what we actually send).
 */
export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  const expected = signWebhookBody(rawBody, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(header, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
