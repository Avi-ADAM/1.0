/**
 * The signed-in user's notice settings, for a page load: what she hid and her
 * preferences (qid 423; collections in 1.0b, PLAN_SMART_NOTICES §4.1).
 *
 * Never rejects. Until the collections are deployed the read answers with an
 * error, and that must read as "nothing hidden, default preferences" — notices
 * keep working, hiding just has nowhere to come back from.
 */

import { userRead, type NoticeDoor } from './door';
import { EMPTY_PREFS, readNoticePrefs, type NoticePrefs } from '$lib/notices/prefs';

export { EMPTY_PREFS, readNoticePrefs, type NoticePrefs };

export async function loadNoticePrefs(
  uid: unknown,
  fetch: typeof globalThis.fetch,
  door: NoticeDoor = 'session'
): Promise<NoticePrefs> {
  if (!uid) return EMPTY_PREFS;
  try {
    const res: any = await userRead(door, uid, '423myNoticePrefs', fetch);
    if (res?.errors?.length) return EMPTY_PREFS;
    return readNoticePrefs(res);
  } catch {
    return EMPTY_PREFS;
  }
}
