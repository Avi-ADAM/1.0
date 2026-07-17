/**
 * Import an email-bound guest invitation into a freshly-registered account.
 *
 * Given the signed `invite` token that the meetings app put on the register
 * link, verify it and — if the registering email matches the invited email —
 * create a pending meeting participant (`pgishauserpend`) for the new user.
 * This mirrors how `createNewMeeting` invites registered users, so the meeting
 * shows up in the new user's pending-invitations list to approve.
 *
 * Best-effort: never throws. Registration must succeed even if import fails.
 */

import { env } from '$env/dynamic/private';
import { qids } from '../../routes/api/send/qids.js';
import { verifyInviteToken } from './guestInvite.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

function adminToken(): string {
  let t = String(env.ADMINMONTHER ?? '').replace(/\s+/g, '');
  if (t.startsWith('ADMINMONTHER=')) t = t.slice('ADMINMONTHER='.length);
  return t;
}

export interface ImportResult {
  imported: boolean;
  reason?: 'no_token' | 'invalid' | 'expired' | 'email_mismatch' | 'error';
  meetingId?: string;
}

/**
 * @param token       the signed invite token (from `?invite=`)
 * @param userId      the new user's id
 * @param email       the new user's (registered) email
 * @param fetchFn     the request-scoped fetch
 */
export async function importInvitedMeeting(
  token: string | undefined | null,
  userId: string,
  email: string,
  fetchFn: typeof globalThis.fetch
): Promise<ImportResult> {
  if (!token) return { imported: false, reason: 'no_token' };

  const res = verifyInviteToken(token);
  if (!res.valid || !res.payload) {
    return {
      imported: false,
      reason: res.error === 'expired' ? 'expired' : 'invalid'
    };
  }

  // The invite is bound to a specific email — only import if it matches the
  // account that was actually created.
  if (res.payload.email.toLowerCase() !== String(email).trim().toLowerCase()) {
    return { imported: false, reason: 'email_mismatch' };
  }

  const meetingId = res.payload.meetingId;

  try {
    const endpoint = STRAPI_GRAPHQL;
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken()}`
      },
      body: JSON.stringify({
        query: qids['19CreatePendMeeting'],
        variables: { id: String(userId), pgishaId: String(meetingId) }
      })
    });

    const data = await response.json();
    if (data?.errors || !data?.data?.createPgishauserpend?.data?.id) {
      console.error(
        '[importInvitedMeeting] Strapi error:',
        JSON.stringify(data?.errors)
      );
      return { imported: false, reason: 'error', meetingId };
    }

    return { imported: true, meetingId };
  } catch (e) {
    console.error('[importInvitedMeeting] failed:', e);
    return { imported: false, reason: 'error', meetingId };
  }
}
