/**
 * A session held in our own meetings app instead of Zoom
 * (docs/inprogress/PLAN_EVENTS_WEBINARS.md §5.1, `room: 'meetings'`).
 *
 * The room is a `Pgisha` opened when the session is saved, with the event's
 * hosts on it so it shows in their meeting list. A registrant walks in through
 * a guest link minted at the moment they press "join" (`guestInvite.ts`, the
 * same token the demo flow uses) — bound to their email, so the link they
 * might forward opens nothing for anyone else.
 *
 * Configuration: `MEETINGS_URL` (origin of the meetings app) and
 * `GUEST_INVITE_SECRET` (identical in both apps). Unset ⇒ a `meetings`
 * session has no way in, and the join page says the room is not ready.
 */

import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';
import { adminToken } from '$lib/server/adminToken.js';
import { createInviteToken } from '$lib/server/guestInvite.js';
import { meetingsOrigin } from '$lib/server/demo/demoMeeting.js';

const CREATE_PGISHA = `mutation EventCreatePgisha($name: String, $desc: String, $publishedAt: DateTime) {
  createPgisha(data: { name: $name, desc: $desc, publishedAt: $publishedAt }) { data { id } }
}`;

const ADD_HOST = `mutation EventAddHost($id: ID!, $pgishaId: [ID], $publishedAt: DateTime) {
  createPgishauser(data: { users_permissions_user: $id, pgishas: $pgishaId, publishedAt: $publishedAt }) { data { id } }
}`;

async function gql(fetchFn: typeof fetch, query: string, variables: Record<string, unknown>) {
  const res = await fetchFn(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

/** Open the room for one session. Returns its id, or null — never throws (the save must not fail on it). */
export async function openSessionRoom(
  name: string,
  hostIds: string[],
  fetchFn: typeof fetch
): Promise<string | null> {
  try {
    const now = new Date().toISOString();
    const data = await gql(fetchFn, CREATE_PGISHA, { name, desc: name, publishedAt: now });
    const id = data?.data?.createPgisha?.data?.id;
    if (!id) {
      console.error('[events] createPgisha failed:', JSON.stringify(data?.errors)?.slice(0, 300));
      return null;
    }
    for (const hostId of hostIds) {
      try {
        await gql(fetchFn, ADD_HOST, { id: hostId, pgishaId: [String(id)], publishedAt: now });
      } catch (e) {
        console.error('[events] adding a host to the room failed:', e);
      }
    }
    return String(id);
  } catch (e) {
    console.error('[events] opening the room failed:', e);
    return null;
  }
}

/** The registrant's way into the room, valid for the rest of the day. */
export function guestRoomLink(pgishaId: string, email: string, meetingName: string): string | null {
  const origin = meetingsOrigin();
  if (!origin) return null;
  try {
    const { token } = createInviteToken({ meetingId: pgishaId, email, meetingName, ttlMs: 12 * 3600_000 });
    return `${origin}/meeting/invite/${token}`;
  } catch (e) {
    console.error('[events] guest link failed:', e);
    return null;
  }
}
