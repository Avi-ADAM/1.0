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

import { verifyInviteToken } from './guestInvite.js';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';

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
    // Through /api/send as the service: the invite was verified above, and the
    // account this runs for has only just been created — there is no session
    // to act under yet. The proxy is still the only route to Strapi.
    const data: any = await sendViaProxy(
      fetchFn as any,
      '19CreatePendMeeting',
      { id: String(userId), pgishaId: String(meetingId) },
      { isSer: true }
    );

    if (!data?.createPgishauserpend?.data?.id) {
      console.error('[importInvitedMeeting] no participant created for', meetingId);
      return { imported: false, reason: 'error', meetingId };
    }

    return { imported: true, meetingId };
  } catch (e) {
    console.error('[importInvitedMeeting] failed:', e);
    return { imported: false, reason: 'error', meetingId };
  }
}
