/**
 * The connect-flow cookie (PLAN_CODE_RIKMA §3).
 *
 * Both flows leave the site and come back through GitHub: linking a member's
 * GitHub account, and installing the App for a rikma. What comes back on the
 * callback URL (`code`, `installation_id`) is attacker-controllable, so the
 * callback trusts only what it wrote itself before leaving — this cookie:
 * who started the flow, why, for which rikma, and until when. It is signed
 * (HMAC), httpOnly, short-lived and single use.
 *
 * `nonce` doubles as the OAuth `state`. A callback whose `state` does not match
 * is refused; the install flow is the one case GitHub may come back without a
 * `state`, and the callback then refuses to link an identity from it.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const STATE_COOKIE = 'gh_connect';
export const STATE_TTL_MS = 10 * 60 * 1000;

export type GithubIntent = 'link' | 'install';

export interface GithubState {
  nonce: string;
  uid: string;
  intent: GithubIntent;
  projectId?: string;
  /**
   * The frontend origin the member started from (e.g. https://www.1lev1.com).
   * The flow runs on the API host, so this is where the callback sends them
   * back. Validated against the allowed origins before it is written here.
   */
  returnOrigin?: string;
  /** epoch ms */
  exp: number;
}

const ORIGIN_SHAPE = /^https?:\/\/[^/\s]+$/;

/** Per-deployment signing key, derived so no extra secret has to be configured. */
export function stateKey(clientSecret: string): Buffer {
  return createHmac('sha256', clientSecret).update('1lev1:github-connect-state').digest();
}

function sign(body: string, key: Buffer | string): string {
  return createHmac('sha256', key).update(body).digest('base64url');
}

export function createState(
  input: { uid: string; intent: GithubIntent; projectId?: string; returnOrigin?: string },
  key: Buffer | string,
  now = Date.now()
): { value: string; state: GithubState } {
  const state: GithubState = {
    nonce: randomBytes(18).toString('base64url'),
    uid: String(input.uid),
    intent: input.intent,
    ...(input.projectId ? { projectId: String(input.projectId) } : {}),
    ...(input.returnOrigin && ORIGIN_SHAPE.test(input.returnOrigin)
      ? { returnOrigin: input.returnOrigin }
      : {}),
    exp: now + STATE_TTL_MS
  };
  const body = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
  return { value: `${body}.${sign(body, key)}`, state };
}

export function readState(
  value: string | null | undefined,
  key: Buffer | string,
  now = Date.now()
): GithubState | null {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const expected = Buffer.from(sign(body, key));
  const actual = Buffer.from(value.slice(dot + 1));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  let s: any;
  try {
    s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof s?.nonce !== 'string' || typeof s?.uid !== 'string') return null;
  if (s.intent !== 'link' && s.intent !== 'install') return null;
  if (s.intent === 'install' && typeof s.projectId !== 'string') return null;
  if (s.returnOrigin !== undefined && (typeof s.returnOrigin !== 'string' || !ORIGIN_SHAPE.test(s.returnOrigin))) {
    return null;
  }
  if (typeof s.exp !== 'number' || s.exp <= now) return null;
  return s as GithubState;
}
