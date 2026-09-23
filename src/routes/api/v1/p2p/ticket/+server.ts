import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { iceServers, mintTicket, p2pTicketSecret } from '$lib/server/p2p/ticket.js';

/**
 * POST /api/v1/p2p/ticket — a seat in one rikma's P2P room
 * (docs/PLAN_P2P_PILOT.md §2).
 *
 * Body `{ projectId }`. Checks membership against the signed JWT
 * (`locals.uid`), then answers with a signed ticket the socket server accepts
 * for an hour, plus the ICE servers to use. 404 when the pilot is not
 * configured here — the page treats that as "pilot unavailable" and shows
 * nothing, which is also the state before the secret is deployed.
 *
 * JSON only: this reads the session cookie, and a cross-site form can send
 * `text/plain` without a preflight.
 */
export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const secret = p2pTicketSecret();
  if (!secret) throw error(404, 'P2P pilot is not configured');
  if (!locals.uid) throw error(401, 'Sign in first');

  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw error(415, 'Expected application/json');

  const body = await request.json().catch(() => null);
  const projectId = String(body?.projectId ?? '');
  if (!/^\d+$/.test(projectId)) throw error(400, 'Missing projectId');

  let members: Array<{ id: string | number }> = [];
  try {
    const data = await sendViaProxy(fetch, '274getProjectMembers', { pid: projectId }, { isSer: true });
    members = data?.project?.data?.attributes?.user_1s?.data ?? [];
  } catch (e) {
    console.error('[p2p/ticket] membership lookup failed', e);
    throw error(502, 'Could not verify membership');
  }
  if (!members.some((m) => String(m.id) === String(locals.uid))) {
    throw error(403, 'Only members of this rikma can join its P2P room');
  }

  const { ticket, expiresAt } = mintTicket(String(locals.uid), projectId, secret);
  return json({ ticket, expiresAt, iceServers: iceServers() }, { headers: { 'cache-control': 'no-store' } });
};
