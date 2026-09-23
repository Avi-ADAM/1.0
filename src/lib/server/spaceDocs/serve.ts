/**
 * Who may open a library entry, and where to send them
 * (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * Pure decision over qid 326's row and the verified caller id, so the rules —
 * the part that has to be right — are tested without an HTTP stack. The
 * endpoint (`/api/v1/space-docs/[id]/file`) only fetches, calls this, and
 * turns the answer into a status or a redirect.
 */

import { isProjectKey } from '$lib/server/storage/index.js';

export type ServeDecision =
  | { kind: 'deny'; status: 401 | 403 | 404 | 503; reason: string }
  /** Stage-2 object in private storage — mint a short-lived GET for it. */
  | { kind: 'signed'; key: string; fileName: string; mime: string }
  /** Stage-1 legacy row (Cloudinary media) or a link — its url is already public. */
  | { kind: 'redirect'; url: string };

const isHttp = (u: unknown): u is string => {
  if (typeof u !== 'string') return false;
  try {
    const p = new URL(u).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
};

/**
 * @param row       `spaceDoc.data` from qid 326 (null when there is no such row)
 * @param callerId  `locals.uid` — the signed JWT, never a cookie or a param
 * @param storageOn whether this instance has private storage configured
 */
export function decideServe(row: any, callerId: string | null | undefined, storageOn: boolean): ServeDecision {
  if (!callerId) return { kind: 'deny', status: 401, reason: 'Sign in to open this file' };

  // A missing row and someone else's row answer the same, so a probe cannot
  // map which ids exist.
  const a = row?.attributes;
  const members: Array<{ id: string | number }> = a?.project?.data?.attributes?.user_1s?.data ?? [];
  const projectId = a?.project?.data?.id;
  if (!a || projectId == null || !members.some((m) => String(m.id) === String(callerId))) {
    return { kind: 'deny', status: 404, reason: 'Not found' };
  }
  if (a.archived === true) return { kind: 'deny', status: 404, reason: 'Not found' };

  if (a.storageKey) {
    // The key must still be one this rikma minted. It always is when the row
    // was written through createSpaceDoc; this is the read side of that check,
    // for a row edited in the admin panel.
    if (!isProjectKey(a.storageKey, projectId)) {
      return { kind: 'deny', status: 403, reason: 'Stored object is outside this rikma' };
    }
    if (!storageOn) return { kind: 'deny', status: 503, reason: 'File storage is not configured here' };
    return {
      kind: 'signed',
      key: a.storageKey,
      fileName: String(a.fileName || 'file'),
      mime: String(a.mime || '')
    };
  }

  const legacy = a.kind === 'link' ? a.url : a.file?.data?.attributes?.url;
  if (isHttp(legacy)) return { kind: 'redirect', url: legacy };
  return { kind: 'deny', status: 404, reason: 'Nothing to open' };
}
