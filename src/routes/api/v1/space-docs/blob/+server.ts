import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readBlobToken } from '$lib/server/storage/blobToken.js';
import { localDriver } from '$lib/server/storage/index.js';
import { readObject, saveObject, statObject } from '$lib/server/storage/local.js';
import { safeKeyName } from '$lib/server/storage/r2.js';

/**
 * The local storage driver's door (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * What a presigned R2 URL is for the bucket, this endpoint is for the folder
 * on our own disk:
 *
 *   PUT  ?token=<put ticket>  → stores exactly that object key, up to its cap
 *   GET  ?token=<get ticket>  → streams it back with the right name and type
 *   HEAD ?token=<get ticket>  → its size, which is how `createSpaceDoc` learns
 *                               the real size instead of trusting the browser
 *
 * The ticket is the whole authorization: it is minted only after the
 * membership checks in `/api/v1/space-docs/upload-url` and
 * `/api/v1/space-docs/[id]/file`, it names one key, one direction and one
 * expiry, and it carries no session. That is what lets a browser send bytes
 * straight to this host, and it is why this endpoint must never do anything a
 * ticket does not literally say.
 *
 * Runs only where the disk is. On an instance with no local driver (Vercel, or
 * an R2 deployment) it answers 404 — there is nothing here to talk to.
 */

const driverOr404 = () => {
  const driver = localDriver();
  if (!driver) throw error(404, 'Not found');
  return driver;
};

function claimsOr403(url: URL, secret: string, mode: 'put' | 'get') {
  const claims = readBlobToken(url.searchParams.get('token'), secret);
  if (!claims || claims.mode !== mode) throw error(403, 'Invalid or expired ticket');
  return claims;
}

export const PUT: RequestHandler = async ({ request, url }) => {
  const { cfg, secret } = driverOr404();
  const claims = claimsOr403(url, secret, 'put');

  // The ticket fixes the content type; a body that claims another one is a
  // different object than the one the record will describe.
  const sent = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (claims.mime && sent !== claims.mime.toLowerCase()) throw error(415, 'Content-Type does not match the ticket');

  // A declared length over the cap is refused before a byte is read; the
  // stream is capped again while writing, for a client that lies or omits it.
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > claims.maxBytes) throw error(413, 'File exceeds the limit');

  const result = await saveObject(cfg, claims.key, request.body, claims.maxBytes);
  // jsconfig has no strictNullChecks, so `ok` does not narrow the union.
  if ('reason' in result) {
    if (result.reason === 'too-large') throw error(413, 'File exceeds the limit');
    if (result.reason === 'empty') throw error(400, 'Empty body');
    throw error(500, 'Could not store the file');
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
};

export const GET: RequestHandler = async ({ url }) => {
  const { cfg, secret } = driverOr404();
  const claims = claimsOr403(url, secret, 'get');

  const stat = await statObject(cfg, claims.key);
  if (!stat) throw error(404, 'Not found');
  const stream = readObject(cfg, claims.key);
  if (!stream) throw error(404, 'Not found');

  return new Response(stream, { headers: downloadHeaders(claims, stat.size) });
};

export const HEAD: RequestHandler = async ({ url }) => {
  const { cfg, secret } = driverOr404();
  const claims = claimsOr403(url, secret, 'get');
  const stat = await statObject(cfg, claims.key);
  if (!stat) throw error(404, 'Not found');
  return new Response(null, { headers: downloadHeaders(claims, stat.size) });
};

/**
 * The same rule R2's signed GET uses: photos inline, everything else a
 * download under its real name — and SVG never inline, because rendered it is
 * a document that can run script.
 */
function downloadHeaders(claims: { mime: string; fileName: string }, size: number): Record<string, string> {
  const inline = /^image\/(jpeg|png|webp|gif)$/.test(claims.mime);
  const name = safeKeyName(claims.fileName || 'file');
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return {
    'content-type': inline ? claims.mime : 'application/octet-stream',
    'content-length': String(size),
    'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff'
  };
}
