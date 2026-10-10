// src/lib/server/reportConfirmation.ts
//
// Who gets the "we got your report" mail from /api/report, and with what.
//
// /api/report is public — a guest must be able to tell us something is broken —
// and the confirmation it sends goes out as notifications@1lev1.com. Mailing
// the reporter's own words to whatever address the body names made it a relay:
// anyone could put arbitrary text in front of an arbitrary inbox under our
// name, and Zoho answers that kind of volume by blocking the whole account
// (`550 5.4.6`, see $lib/server/mailer.js). So (PLAN_PROXY_SECURITY §14.5):
//
// - a signed-in reporter is answered at the address on their ACCOUNT, looked up
//   from locals.uid (the signed JWT). The body's `userEmail` only says "I'd like
//   an answer"; it never chooses the inbox. Their words are quoted back — they
//   are mailing themselves.
// - a guest is answered at the address they typed, since there is no other,
//   but with the fixed template only: no description, no name, nothing the
//   caller wrote. And at most once per address per day, a few per IP per hour —
//   the mailer queues at 20/min, so a flood of even fixed mail would delay every
//   real notification behind it.
//
// The report itself (Strapi row, rikma mirror, Telegram) never depends on any
// of this.

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

export interface ConfirmationTarget {
  to: string;
  isGuest: boolean;
  /** Quoted back in the mail. Empty for a guest. */
  description: string;
  /** Greeting name. Empty for a guest. */
  username: string;
}

const ACCOUNT_QUERY = `query ReportReplyTo($uid: ID!) {
  usersPermissionsUser(id: $uid) {
    data { attributes { email username blocked } }
  }
}`;

/** Loose, deliberately: it only has to reject what no mailbox could be. */
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

export function looksLikeEmail(s: unknown): s is string {
  return typeof s === 'string' && s.length <= 254 && EMAIL_RE.test(s);
}

/**
 * The account's own address, read with the service token. `null` when the
 * user is unknown, blocked or has no address — never throws.
 */
export async function loadAccountMailbox(
  uid: string,
  adminToken: string,
  fetchFn: typeof globalThis.fetch,
): Promise<{ email: string; username: string } | null> {
  try {
    const res = await fetchFn(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ query: ACCOUNT_QUERY, variables: { uid: String(uid) } }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const a = body?.data?.usersPermissionsUser?.data?.attributes;
    if (!a || a.blocked === true || !looksLikeEmail(a.email)) return null;
    return { email: a.email, username: typeof a.username === 'string' ? a.username : '' };
  } catch (e) {
    console.error('❌ Report confirmation: account lookup failed:', e);
    return null;
  }
}

// ── Guest cap — in memory, like /api/demo ──────────────────────────────────
const PER_ADDRESS_WINDOW_MS = 24 * 60 * 60 * 1000;
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

const addressSeen = new Map<string, number>(); // address → resetAt
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  if (addressSeen.size > 5000) for (const [k, t] of addressSeen) if (t <= now) addressSeen.delete(k);
  if (ipBuckets.size > 5000) for (const [k, v] of ipBuckets) if (v.resetAt <= now) ipBuckets.delete(k);
}

/** Takes a slot when it says yes, so call it only right before sending. */
export function takeGuestConfirmationSlot(address: string, ip: string, now = Date.now()): boolean {
  sweep(now);
  const key = address.toLowerCase();
  const seen = addressSeen.get(key);
  if (seen != null && seen > now) return false;

  const bucket = ipBuckets.get(ip);
  if (bucket && bucket.resetAt > now && bucket.count >= PER_IP_LIMIT) return false;

  addressSeen.set(key, now + PER_ADDRESS_WINDOW_MS);
  if (!bucket || bucket.resetAt <= now) ipBuckets.set(ip, { count: 1, resetAt: now + PER_IP_WINDOW_MS });
  else bucket.count++;
  return true;
}

/** Tests only. */
export function resetGuestConfirmationLimits() {
  addressSeen.clear();
  ipBuckets.clear();
}

/**
 * Decide the confirmation, or `null` for none. Nothing is sent unless the
 * reporter left an address (`requestedEmail`) — that is them asking for an
 * answer — but for a signed-in reporter that address is not where it goes.
 */
export async function resolveConfirmationTarget(
  args: {
    uid: string | false | null | undefined;
    requestedEmail: unknown;
    description: string;
    ip: string;
  },
  deps: { adminToken: string; fetch: typeof globalThis.fetch; now?: number },
): Promise<ConfirmationTarget | null> {
  const requested = typeof args.requestedEmail === 'string' ? args.requestedEmail.trim() : '';
  if (!requested) return null;

  if (args.uid) {
    const account = await loadAccountMailbox(String(args.uid), deps.adminToken, deps.fetch);
    if (!account) return null;
    return {
      to: account.email,
      isGuest: false,
      description: args.description,
      username: account.username,
    };
  }

  if (!looksLikeEmail(requested)) return null;
  if (!takeGuestConfirmationSlot(requested, args.ip, deps.now)) {
    console.warn('⚠️ Report confirmation to a guest skipped: rate limit');
    return null;
  }
  return { to: requested, isGuest: true, description: '', username: '' };
}
