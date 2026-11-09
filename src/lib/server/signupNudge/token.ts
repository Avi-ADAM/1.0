/**
 * The signed links in the "continue your signup" mail.
 *
 * Having the mail is what proves the signature is yours, so the link alone may
 * seat it on /signup. The purpose is part of what is signed: a removal link can
 * never open a signup, or the other way round. The removal link outlives the
 * other one, since the right to be removed does not run out.
 *
 * The key exists only in the VPS env, so www opens these through
 * /api/chezin/continue.
 */
import crypto from 'crypto';
import { b64url, safeEqual, signupContinueKey } from '$lib/server/oauth/secret';

const DAY = 24 * 60 * 60 * 1000;
export type LinkPurpose = 'continue' | 'stop';
const TTL: Record<LinkPurpose, number> = { continue: 30 * DAY, stop: 3650 * DAY };

const mac = (purpose: LinkPurpose, body: string, key: Buffer) =>
  b64url(crypto.createHmac('sha256', key).update(`${purpose}:${body}`).digest());

export function mintLink(
  chezinId: string,
  purpose: LinkPurpose,
  now: number = Date.now(),
  key: Buffer = signupContinueKey()
): string {
  const body = `${chezinId}.${(now + TTL[purpose]).toString(36)}`;
  return `${body}.${mac(purpose, body, key)}`;
}

/** The chezin id, or null for anything that is not a live link of this purpose. */
export function openLink(
  token: unknown,
  purpose: LinkPurpose,
  now: number = Date.now(),
  key: Buffer = signupContinueKey()
): string | null {
  if (typeof token !== 'string' || token.length > 200) return null;
  const match = /^(\d{1,12})\.([0-9a-z]{1,12})\.([\w-]+)$/.exec(token);
  if (!match) return null;
  const [, id, exp, given] = match;
  if (!safeEqual(given, mac(purpose, `${id}.${exp}`, key))) return null;
  return parseInt(exp, 36) > now ? id : null;
}
