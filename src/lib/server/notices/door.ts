/**
 * Which door a notice read goes through (as the daily digest's `DigestDoor`).
 *
 *   session — a page load, or the site's own chat: the request carries the
 *             member's session, and /api/send binds `$idL` to it.
 *   service — an external MCP key: no session behind the call, so `$idL` would
 *             be rebound to nobody. The service token reads the `$uid` twins
 *             (qids 428–431, serviceAdmin only) for the key's owner.
 *
 * Reads keyed on an object (a wish's pace, a deal's pieces) are the same qid on
 * either door; only the token changes.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';

export type NoticeDoor = 'session' | 'service';

/** Session qid → its `$uid` service twin. */
const TWINS: Record<string, string> = {
  '421myWishNotices': '428myWishNoticesFor',
  '394hiddenWishProposals': '429hiddenWishProposalsFor',
  '423myNoticePrefs': '430myNoticePrefsFor',
  '123dealsForUser': '431dealsForUserFor'
};

/** A read keyed on the user herself. */
export function userRead(
  door: NoticeDoor,
  uid: unknown,
  qid: keyof typeof TWINS | string,
  fetch: typeof globalThis.fetch,
  extra: Record<string, unknown> = {}
): Promise<any> {
  if (door === 'service') {
    const twin = TWINS[qid];
    if (!twin) return Promise.reject(new Error(`${qid} has no service twin`));
    return sendToSer({ uid: String(uid), ...extra }, twin, 0, 0, true, fetch);
  }
  return sendToSer({ idL: uid, ...extra }, qid, 0, 0, false, fetch);
}

/** A read keyed on an object, through `sendToSer` (raw `{ data }`). */
export function objectRead(door: NoticeDoor, fetch: typeof globalThis.fetch) {
  return (qid: string, vars: Record<string, unknown>) => sendToSer(vars, qid, 0, 0, door === 'service', fetch);
}

/** A read keyed on an object, through the proxy (what the deal page's readers take). */
export function objectRun(door: NoticeDoor, fetch: typeof globalThis.fetch) {
  return (qid: string, vars: Record<string, unknown>) =>
    sendViaProxy(fetch as any, qid, vars, { isSer: door === 'service' });
}
