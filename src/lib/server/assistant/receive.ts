/**
 * A rikma a member prepared for another member (PLAN_AI_SIGNUP_CONCIERGE §5.7).
 *
 * The recipient already has an account, so there is no signup: the link,
 * /assistant/receive/<token>, hands the pending session to whoever opens it
 * signed in — if, and only if, their account's email is the one it was
 * prepared for. A link forwarded to the wrong person, or opened in the wrong
 * account, hands over nothing. Even then nothing is created: they land on the
 * review screen, where they tick and create it themselves, or let it be.
 */

import { landingFor } from '$lib/assistant/landing.js';
import { loadSession, saveSession, type StrapiLike } from './session.js';
import { openSignupToken } from './signupToken.js';
import { mailboxOf } from './signupRecipient.js';

export type ReceiveRefusal = 'expired' | 'taken' | 'otherAccount' | 'unverified';

export type ReceiveResult =
  | { ok: true; sessionId: string; landing: string }
  | { ok: false; reason: ReceiveRefusal; email?: string };

/** `dana@x.co` → `d***@x.co`: enough to recognise your own address, not to read someone else's. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  return `${email[0]}***${email.slice(at)}`;
}

export async function receivePreparedRikma(
  rawToken: unknown,
  userId: string,
  deps: { strapi: StrapiLike; fetch?: typeof fetch; now?: Date }
): Promise<ReceiveResult> {
  const now = deps.now ?? new Date();
  const token = openSignupToken(rawToken, now.getTime());
  if (!token) return { ok: false, reason: 'expired' };

  const row = await loadSession(deps.strapi, token.sid, deps.fetch).catch(() => null);
  if (!row || row.kind !== 'rikma') return { ok: false, reason: 'expired' };
  const landed = (id: string): ReceiveResult => ({
    ok: true,
    sessionId: id,
    landing: landingFor({ id, kind: 'rikma', itemCount: row.state.items.length })
  });

  // Opened again by the one who already received it.
  if (row.userId === String(userId)) return landed(row.id);
  if (row.status !== 'pending' || row.userId || row.chezinId) return { ok: false, reason: 'taken' };
  if (row.claimExpiresAt && new Date(row.claimExpiresAt).getTime() <= now.getTime()) return { ok: false, reason: 'expired' };

  let own: unknown;
  try {
    const res = await deps.strapi.execute('436accountEmail', { id: String(userId) }, undefined, deps.fetch);
    own = res?.data?.usersPermissionsUser?.data?.attributes?.email;
  } catch {
    return { ok: false, reason: 'unverified' };
  }
  if (typeof own !== 'string' || !own) return { ok: false, reason: 'unverified' };
  if (mailboxOf(own) !== mailboxOf(token.email)) return { ok: false, reason: 'otherAccount', email: maskEmail(token.email) };

  const saved = await saveSession(deps.strapi, row, { patch: { userId: String(userId), status: 'active' } }, deps.fetch);
  return landed('row' in saved ? saved.row.id : row.id);
}
