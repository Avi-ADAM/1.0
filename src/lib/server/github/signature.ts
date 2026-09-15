/**
 * GitHub webhook signature (PLAN_CODE_RIKMA §3.1).
 *
 * GitHub signs the raw request body with the App's webhook secret and sends
 * `X-Hub-Signature-256: sha256=<hex>`. Verification must run on the body
 * exactly as received — re-serialising parsed JSON can reorder keys — and in
 * constant time. An empty secret never verifies: an unconfigured deployment
 * refuses every delivery instead of accepting all of them.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-hub-signature-256';

export function signGithubBody(rawBody: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function verifyGithubSignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string | null | undefined
): boolean {
  if (!header || !secret) return false;
  const expected = Buffer.from(signGithubBody(rawBody, secret), 'utf8');
  const actual = Buffer.from(header, 'utf8');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
