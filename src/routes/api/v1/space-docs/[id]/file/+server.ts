import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { downloadUrl, storageKind } from '$lib/server/storage/index.js';
import { ssrApiBase } from '$lib/server/ssrApiBase.js';
import { decideServe } from '$lib/server/spaceDocs/serve.js';

/**
 * GET /api/v1/space-docs/:id/file — open one library entry
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * The only door to a file in the private bucket. Checks that the caller —
 * from the signed JWT, `locals.uid` — is a member of the rikma that owns the
 * entry, then answers with a 302 to a URL that stops working in five minutes.
 * The URL is minted per click and never stored, so a forwarded link is dead
 * by the time anyone else tries it, and a member who leaves loses access at
 * their next click, not at the next key rotation.
 *
 * Reached as a top-level navigation (an `<a href>`), so the `.1lev1.com` jwt
 * cookie rides along even when the page came from Vercel and this runs on
 * api.1lev1.com. `Cache-Control: no-store` so no proxy keeps the redirect.
 *
 * `?format=json` answers `{ url }` instead of redirecting — for the P2P pilot
 * (docs/PLAN_P2P_PILOT.md), which reads the bytes in JS so it can check their
 * sha256 and cache them. Same checks, same five-minute URL.
 */
export const GET: RequestHandler = async ({ params, url, locals, fetch, setHeaders }) => {
  const id = String(params.id ?? '');
  if (!/^\d+$/.test(id)) throw error(404, 'Not found');

  let row: any = null;
  try {
    const data = await sendViaProxy(fetch, '326spaceDocForServe', { id }, { isSer: true });
    row = data?.spaceDoc?.data ?? null;
  } catch (e) {
    console.error('[space-docs/file] lookup failed', e);
    throw error(502, 'Could not look the file up');
  }

  const decision = decideServe(row, locals.uid ? String(locals.uid) : null, storageKind() !== null);

  setHeaders({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });

  if (decision.kind === 'deny') throw error(decision.status, decision.reason);
  const target =
    decision.kind === 'redirect'
      ? decision.url
      : downloadUrl(decision.key, { fileName: decision.fileName, mime: decision.mime }, ssrApiBase());
  if (!target) throw error(503, 'File storage is not configured here');
  if (url.searchParams.get('format') === 'json') return json({ url: target });
  throw redirect(302, target);
};
