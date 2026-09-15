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
 *
 * The pick token is the second signed value here: what the callback hands the
 * code tab once an installation is verified, so the member can choose which
 * repository joins the rikma. It is signed with its own derived key, so a
 * state cookie can never be replayed as a pick token or the other way round.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const STATE_COOKIE = 'gh_connect';
export const STATE_TTL_MS = 10 * 60 * 1000;
export const PICK_TTL_MS = 30 * 60 * 1000;

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

/** A verified installation, waiting for a member to choose its repository. */
export interface PickToken {
  uid: string;
  projectId: string;
  installationId: string;
  /** epoch ms */
  exp: number;
}

const ORIGIN_SHAPE = /^https?:\/\/[^/\s]+$/;
const DIGITS = /^\d+$/;

/** Per-deployment signing key, derived so no extra secret has to be configured. */
export function stateKey(clientSecret: string): Buffer {
  return createHmac('sha256', clientSecret).update('1lev1:github-connect-state').digest();
}

export function pickKey(clientSecret: string): Buffer {
  return createHmac('sha256', clientSecret).update('1lev1:github-repo-pick').digest();
}

function sign(body: string, key: Buffer | string): string {
  return createHmac('sha256', key).update(body).digest('base64url');
}

function seal(payload: object, key: Buffer | string): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body, key)}`;
}

/** `body.signature` → the parsed body, or null unless the signature holds. */
function unseal(value: string | null | undefined, key: Buffer | string): any {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const expected = Buffer.from(sign(body, key));
  const actual = Buffer.from(value.slice(dot + 1));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
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
  return { value: seal(state, key), state };
}

export function readState(
  value: string | null | undefined,
  key: Buffer | string,
  now = Date.now()
): GithubState | null {
  const s = unseal(value, key);
  if (typeof s?.nonce !== 'string' || typeof s?.uid !== 'string') return null;
  if (s.intent !== 'link' && s.intent !== 'install') return null;
  if (s.intent === 'install' && typeof s.projectId !== 'string') return null;
  if (s.returnOrigin !== undefined && (typeof s.returnOrigin !== 'string' || !ORIGIN_SHAPE.test(s.returnOrigin))) {
    return null;
  }
  if (typeof s.exp !== 'number' || s.exp <= now) return null;
  return s as GithubState;
}

export function createPickToken(
  input: { uid: string; projectId: string; installationId: string },
  key: Buffer | string,
  now = Date.now()
): string {
  const token: PickToken = {
    uid: String(input.uid),
    projectId: String(input.projectId),
    installationId: String(input.installationId),
    exp: now + PICK_TTL_MS
  };
  return seal(token, key);
}

export function readPickToken(
  value: string | null | undefined,
  key: Buffer | string,
  now = Date.now()
): PickToken | null {
  const p = unseal(value, key);
  if (typeof p?.uid !== 'string' || !DIGITS.test(p.uid)) return null;
  if (typeof p.projectId !== 'string' || !DIGITS.test(p.projectId)) return null;
  if (typeof p.installationId !== 'string' || !DIGITS.test(p.installationId)) return null;
  if (typeof p.exp !== 'number' || p.exp <= now) return null;
  return p as PickToken;
}
