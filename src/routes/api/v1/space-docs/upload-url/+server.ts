import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { maxUploadBytes, storageKind, uploadTicket } from '$lib/server/storage/index.js';
import { ssrApiBase } from '$lib/server/ssrApiBase.js';
import { checkUpload } from '$lib/uploads/policy.js';

/**
 * POST /api/v1/space-docs/upload-url — a one-object upload ticket
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * Body: `{ projectId, fileName, mime, size }`. Answers with a key under the
 * rikma's own prefix and a PUT URL signed for exactly that key and that
 * content type, good for ten minutes. The browser uploads straight to R2 —
 * the bytes never pass through this server, which is also why the proxy's
 * 15 MB limit does not apply here.
 *
 * Nothing is recorded yet. The row is written afterwards by `createSpaceDoc`,
 * which checks the key's prefix against the rikma and asks the bucket whether
 * the object really arrived. An abandoned ticket leaves at most an orphan
 * object under the rikma's own prefix, never a row pointing at nothing.
 *
 * JSON only: a cross-site form can send `text/plain` without a preflight, and
 * this endpoint reads the session cookie.
 */
export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  if (!storageKind()) throw error(503, 'Direct upload is not configured here');
  if (!locals.uid) throw error(401, 'Sign in to upload');

  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw error(415, 'Expected application/json');

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON');
  }

  const projectId = String(body?.projectId ?? '');
  const fileName = String(body?.fileName ?? '').trim();
  const mime = String(body?.mime ?? '');
  const size = Number(body?.size);
  if (!/^\d+$/.test(projectId)) throw error(400, 'Missing projectId');
  if (!fileName) throw error(400, 'Missing fileName');

  const refusal = checkUpload({ name: fileName, type: mime, size }, maxUploadBytes());
  if (refusal) {
    throw error(refusal.code === 'size' ? 413 : refusal.code === 'type' ? 415 : 400, refusal.message);
  }

  // Membership from the rikma's own member list against the signed JWT.
  let members: Array<{ id: string | number }> = [];
  try {
    const data = await sendViaProxy(fetch, '274getProjectMembers', { pid: projectId }, { isSer: true });
    members = data?.project?.data?.attributes?.user_1s?.data ?? [];
  } catch (e) {
    console.error('[space-docs/upload-url] membership lookup failed', e);
    throw error(502, 'Could not verify membership');
  }
  if (!members.some((m) => String(m.id) === String(locals.uid))) {
    throw error(403, 'Only members of this rikma can upload to its library');
  }

  // Absolute on purpose: with the local driver the bytes must reach the host
  // that owns the disk, which is not the host that rendered the page.
  const ticket = await uploadTicket({ projectId, fileName, mime, apiBase: ssrApiBase() });
  // jsconfig has no strictNullChecks, so `ok` does not narrow the union.
  if ('reason' in ticket) {
    throw ticket.reason === 'disk-full'
      ? error(507, 'The server is out of space for new files')
      : error(503, 'Direct upload is not configured here');
  }
  // The PUT must carry exactly the headers in the ticket — they are signed.
  return json(ticket.ticket, { headers: { 'cache-control': 'no-store' } });
};
