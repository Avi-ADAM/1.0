// The picture upload link an agent hands out (MCP createUploadSession,
// $lib/server/media/uploadSession). The user opens it — usually on their
// phone, often not signed in there — and drops product pictures in.
//
// The signed token is the whole capability: it names the user, the rikma, how
// many files and until when. Before every file the server re-checks the
// signature, the clock, the count, and that the user is still a member; then
// checks the bytes are a real JPG/PNG/WebP and stores them in Strapi's media
// library with the session's caption, which is how getUploadSession finds them.
// Nothing here attaches a picture to a product or shows rikma data.

import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import { fetchProjectMemberIds } from '$lib/server/mcp/guard.js';
import { sessionCaption, verifyUploadSession, type UploadSession } from '$lib/server/media/uploadSession.js';
import { MediaRefused, storeCheckedImage, storedOf, type StoredMedia } from '$lib/server/media/mediaStore.js';
import { PAGE_MAX_BYTES } from '$lib/media/imagePolicy.js';

async function sessionFiles(session: UploadSession, fetchFn: typeof fetch): Promise<StoredMedia[]> {
  const res: any = await sendToSer({ caption: sessionCaption(session.nonce) }, 'mediaUploadsByCaption', 0, 0, true, fetchFn);
  if (res?.errors?.length) throw new Error('media lookup failed');
  return (res?.data?.uploadFiles?.data ?? []).map(storedOf).filter(Boolean) as StoredMedia[];
}

export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  setHeaders({ 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
  const check = verifyUploadSession(params.token);
  if ('reason' in check) {
    return { state: check.reason === 'expired' ? 'expired' : 'invalid', files: [], maxFiles: 0, expiresAt: null, maxBytes: PAGE_MAX_BYTES };
  }
  const s = check.session;
  let files: StoredMedia[] = [];
  try {
    files = await sessionFiles(s, fetch);
  } catch (e) {
    console.error('[upload page] could not list the session files:', e);
  }
  return {
    state: 'open' as const,
    files: files.map((f) => ({ uploadId: f.uploadId, url: f.url, fileName: f.fileName })),
    maxFiles: s.maxFiles,
    expiresAt: new Date(s.expiresAt).toISOString(),
    maxBytes: PAGE_MAX_BYTES
  };
};

export const actions: Actions = {
  // One file per request: the page sends them one by one, so each stays under
  // the serverless request-body limit and a failure is about that file only.
  upload: async ({ params, request, fetch }) => {
    const check = verifyUploadSession(params.token);
    if ('reason' in check) return fail(check.reason === 'expired' ? 410 : 403, { code: check.reason });
    const s = check.session;

    const members = await fetchProjectMemberIds(s.projectId, fetch).catch(() => null);
    if (!members?.has(s.userId)) return fail(403, { code: 'notMember' });

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) return fail(400, { code: 'empty' });
    if (file.size > PAGE_MAX_BYTES) return fail(413, { code: 'size' });

    let count = 0;
    try {
      count = (await sessionFiles(s, fetch)).length;
    } catch {
      throw error(503, 'Try again shortly');
    }
    if (count >= s.maxFiles) return fail(409, { code: 'limit' });

    try {
      const stored = await storeCheckedImage({
        bytes: new Uint8Array(await file.arrayBuffer()),
        declaredMime: file.type || null,
        fileName: file.name,
        maxBytes: PAGE_MAX_BYTES,
        caption: sessionCaption(s.nonce),
        fetch
      });
      return { ok: true, file: { uploadId: stored.uploadId, url: stored.url, fileName: stored.fileName } };
    } catch (e) {
      if (e instanceof MediaRefused) return fail(e.code === 'size' ? 413 : e.code === 'store' ? 502 : 415, { code: e.code });
      console.error('[upload page] upload failed:', e);
      return fail(502, { code: 'store' });
    }
  }
};
