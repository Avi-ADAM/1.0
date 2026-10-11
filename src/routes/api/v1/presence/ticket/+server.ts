import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isRikmaMember, hidesPresence } from '$lib/server/p2p/membership.js';
import { mintTicket, p2pTicketSecret } from '$lib/server/p2p/ticket.js';

/**
 * POST /api/v1/presence/ticket — a seat in one rikma's presence room
 * ("who is here", docs/inprogress/PLAN_REALTIME_MIGRATION.md separate stage).
 *
 * Body `{ projectId }`. Same ticket and secret as the P2P room — the claim is
 * the same, "this user may sit in this rikma's room until T" — after the same
 * membership check against the signed JWT (`locals.uid`).
 *
 * A member who switched presence off gets `{ hidden: true }` and no ticket:
 * without a seat they are not on the roster and never receive it, which is
 * the decided symmetry (whoever hides does not see either).
 *
 * 404 when no ticket secret is configured — the page shows nothing.
 * JSON only: this reads the session cookie, and a cross-site form can send
 * `text/plain` without a preflight.
 */
export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const secret = p2pTicketSecret();
  if (!secret) throw error(404, 'Presence is not configured');
  if (!locals.uid) throw error(401, 'Sign in first');

  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw error(415, 'Expected application/json');

  const body = await request.json().catch(() => null);
  const projectId = String(body?.projectId ?? '');
  if (!/^\d{1,12}$/.test(projectId)) throw error(400, 'Missing projectId');

  const uid = String(locals.uid);
  let member = false;
  try {
    member = await isRikmaMember(fetch, projectId, uid);
  } catch (e) {
    console.error('[presence/ticket] membership lookup failed', e);
    throw error(502, 'Could not verify membership');
  }
  if (!member) throw error(403, 'Only members of this rikma can see who is here');

  const headers = { 'cache-control': 'no-store' };
  if (await hidesPresence(fetch, uid)) return json({ hidden: true }, { headers });

  const { ticket, expiresAt } = mintTicket(uid, projectId, secret);
  return json({ hidden: false, ticket, expiresAt }, { headers });
};
