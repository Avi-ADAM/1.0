/**
 * Who a signup prepared by a signed-in member is for (PLAN_AI_SIGNUP_CONCIERGE §5.7).
 *
 * A member's agent may prepare a signup for someone else — a marketer setting
 * up a new customer's business so the customer signs up and lands on an
 * almost-ready rikma. The one mistake to rule out is the member doing it for
 * themselves: their draft would sit behind a signup they can never complete
 * (they already have an account), and the rikma they meant to build would be
 * nowhere. Their own path is proposeRikmaBlueprint.
 *
 * So the recipient's email must not be the caller's own address, nor that of
 * the caller's account under another spelling. Someone else who already has an
 * account is fine — a member helping another member: there is no signup then,
 * only a link that hands the drafted rikma to that account (`hasAccount`).
 * A failed lookup refuses — this guard is worth nothing if it quietly lets the
 * call through.
 */

import type { StrapiLike } from './session.js';

export type RecipientRefusal = 'self' | 'unverified';

export type RecipientCheck = { ok: true; hasAccount: boolean } | { ok: false; reason: RecipientRefusal; message: string };

/** Lower-case, and `name+tag@x` reads as `name@x` — the same mailbox. */
export function mailboxOf(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  const local = e.slice(0, at).replace(/\+.*$/, '');
  return `${local}@${e.slice(at + 1)}`;
}

const SELF =
  'This is the email of the account you are signed in with, so the signup would be for the user themselves - ' +
  'and they already have an account. To build a rikma for them, use proposeRikmaBlueprint instead.';

const UNVERIFIED = 'Could not check who this signup is for right now - nothing was saved. Try again in a moment.';

export async function checkSignupRecipient(
  email: string,
  callerId: string,
  deps: { strapi: StrapiLike; fetch?: typeof fetch }
): Promise<RecipientCheck> {
  const target = mailboxOf(email);
  try {
    const mine = await deps.strapi.execute('436accountEmail', { id: callerId }, undefined, deps.fetch);
    const own = mine?.data?.usersPermissionsUser?.data?.attributes?.email;
    if (typeof own !== 'string' || !own) return { ok: false, reason: 'unverified', message: UNVERIFIED };
    if (mailboxOf(own) === target) return { ok: false, reason: 'self', message: SELF };

    const found = await deps.strapi.execute('171findUserByExact', { q: email.trim().toLowerCase() }, undefined, deps.fetch);
    const rows = found?.data?.usersPermissionsUsers?.data;
    if (!Array.isArray(rows)) return { ok: false, reason: 'unverified', message: UNVERIFIED };
    if (rows.length) {
      return String(rows[0]?.id) === String(callerId)
        ? { ok: false, reason: 'self', message: SELF }
        : { ok: true, hasAccount: true };
    }
    return { ok: true, hasAccount: false };
  } catch {
    return { ok: false, reason: 'unverified', message: UNVERIFIED };
  }
}
