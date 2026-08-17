/**
 * "Come in whenever it suits you" — the drop-in half of the demo flow.
 *
 * Fixing a slot in advance is friction, and for someone still deciding whether
 * the model is for them it is the friction that kills the demo. The meetings
 * app (magik-meetings) already has exactly the missing piece: a guest mode
 * reached through a signed invitation link, no account, no login. So for a lead
 * who picks "I'd rather join at a convenient time" we open a `Pgisha` for them
 * up front and hand them a guest link to it. They walk in when they want; the
 * coordination task in the central rikma tells the team a room is waiting.
 *
 * The link is self-contained (see `guestInvite.ts`) — the meetings app verifies
 * the signature and needs no lookup here — but it *is* email-bound, so this
 * only applies to leads who left an email.
 *
 * Configuration:
 *   - `MEETINGS_URL` — origin of the meetings app (e.g. https://meetings.1lev1.com).
 *     Unset ⇒ no link is minted; the request falls back to a plain callback.
 *   - `GUEST_INVITE_SECRET` — must match the meetings app, or the link won't verify.
 *   - `DEMO_MEETING_TTL_DAYS` — link lifetime, default 14 days.
 *   - `DEMO_HOST_USER_ID` — the team member the room belongs to. Without it the
 *     meeting exists but appears in nobody's meeting list, so the guest could
 *     walk into an empty room with no one able to see it was opened.
 *
 * Best-effort: never throws — a demo request must be captured even if the
 * meeting can't be opened.
 */

import { env } from '$env/dynamic/private';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { createInviteToken } from '$lib/server/guestInvite.js';

const CREATE_PGISHA = `mutation DemoCreatePgisha($name: String, $desc: String, $publishedAt: DateTime) {
  createPgisha(data: { name: $name, desc: $desc, publishedAt: $publishedAt }) {
    data { id }
  }
}`;

const ADD_HOST = `mutation DemoAddHost($id: ID!, $pgishaId: [ID], $publishedAt: DateTime) {
  createPgishauser(data: { users_permissions_user: $id, pgishas: $pgishaId, publishedAt: $publishedAt }) {
    data { id }
  }
}`;

export interface DemoMeetingResult {
  ok: boolean;
  reason?: 'not_configured' | 'no_email' | 'error';
  meetingId?: string;
  /** Guest invitation link into the meetings app. */
  link?: string;
  expiresAt?: string;
}

function adminToken(): string {
  let t = String(env.ADMINMONTHER ?? '').replace(/\s+/g, '');
  if (t.startsWith('ADMINMONTHER=')) t = t.slice('ADMINMONTHER='.length);
  return t;
}

/** Origin of the meetings app, without a trailing slash, or '' when unset. */
export function meetingsOrigin(): string {
  return String(env.MEETINGS_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
}

function ttlMs(): number {
  const days = Number(env.DEMO_MEETING_TTL_DAYS);
  return (Number.isFinite(days) && days > 0 ? days : 14) * 24 * 60 * 60 * 1000;
}

/**
 * Open a drop-in demo meeting and mint the guest link for it.
 *
 * @param name     the lead's name — becomes the meeting title
 * @param email    the lead's email; the invitation is bound to it
 * @param fetchFn  request-scoped fetch
 */
export async function createDemoMeeting(
  name: string,
  email: string | null | undefined,
  fetchFn: typeof globalThis.fetch = fetch
): Promise<DemoMeetingResult> {
  const origin = meetingsOrigin();
  if (!origin) return { ok: false, reason: 'not_configured' };
  if (!email) return { ok: false, reason: 'no_email' };

  const meetingName = `דמו אישי · ${name}`;

  try {
    const res = await fetchFn(STRAPI_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken()}`
      },
      body: JSON.stringify({
        query: CREATE_PGISHA,
        variables: {
          name: meetingName,
          desc:
            'פגישת דמו אישית של כ‑20 דקות. אפשר להיכנס בזמן שנוח - ' +
            'הקישור פתוח, ואין צורך בהרשמה.',
          publishedAt: new Date().toISOString()
        }
      })
    });

    const data = await res.json();
    const meetingId = data?.data?.createPgisha?.data?.id;
    if (data?.errors || !meetingId) {
      console.error('[demo] createPgisha failed:', JSON.stringify(data?.errors)?.slice(0, 300));
      return { ok: false, reason: 'error' };
    }

    // Give the room an owner on our side, so it shows up in a team member's
    // meeting list rather than existing only behind the guest's link. Failing
    // this shouldn't cost the guest their link, so it's swallowed separately.
    const hostId = String(env.DEMO_HOST_USER_ID ?? '').trim();
    if (hostId) {
      try {
        await fetchFn(STRAPI_GRAPHQL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken()}`
          },
          body: JSON.stringify({
            query: ADD_HOST,
            variables: {
              id: hostId,
              pgishaId: [String(meetingId)],
              publishedAt: new Date().toISOString()
            }
          })
        });
      } catch (e) {
        console.error('[demo] attaching the demo host to the meeting failed:', e);
      }
    }

    const { token, expiresAt } = createInviteToken({
      meetingId: String(meetingId),
      email,
      meetingName,
      ttlMs: ttlMs()
    });

    return {
      ok: true,
      meetingId: String(meetingId),
      link: `${origin}/meeting/invite/${token}`,
      expiresAt
    };
  } catch (e) {
    console.error('[demo] createDemoMeeting failed:', e);
    return { ok: false, reason: 'error' };
  }
}
