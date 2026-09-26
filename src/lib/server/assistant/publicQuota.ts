/**
 * Limits for the assistant's public doors — prepareSignup and the agent signup
 * screen (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.6, §13.5). Anyone can call them,
 * so each address gets a few tries an hour and the whole platform a daily
 * ceiling; neither ever calls a model, so this bounds rows, not spend.
 *
 * In-process, like the other limiters here: one API container today.
 */

import { RateLimiter, callerKey } from '$lib/server/translation/rateLimit';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const perAddress = new RateLimiter();
const platform = new RateLimiter({ maxKeys: 10 });

export const PREPARE_PER_HOUR = 5;
export const PREPARE_PER_DAY = 300;
export const SIGN_PER_HOUR = 10;

/** One prepared signup (a pending row). */
export function takePrepare(ip: string): { ok: boolean; retryAfterSeconds?: number } {
  const a = perAddress.take(`prepare:${callerKey(undefined, ip)}`, PREPARE_PER_HOUR, HOUR);
  if (!a.ok) return { ok: false, retryAfterSeconds: Math.ceil(a.retryAfterMs / 1000) };
  const d = platform.take('prepare:all', PREPARE_PER_DAY, DAY);
  if (!d.ok) return { ok: false, retryAfterSeconds: Math.ceil(d.retryAfterMs / 1000) };
  return { ok: true };
}

/** One signature from the agent screen (a chezin row). */
export function takeSign(ip: string): { ok: boolean; retryAfterSeconds?: number } {
  const a = perAddress.take(`sign:${callerKey(undefined, ip)}`, SIGN_PER_HOUR, HOUR);
  return a.ok ? { ok: true } : { ok: false, retryAfterSeconds: Math.ceil(a.retryAfterMs / 1000) };
}
