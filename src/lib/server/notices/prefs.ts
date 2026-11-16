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
  return (await loadNoticePrefsChecked(uid, fetch, door)).prefs;
}

/**
 * The same read, saying whether it worked. `ok: false` still carries the
 * defaults, so nothing breaks — but a caller that reports what it could not read
 * (getMyUpdates' `unavailable`) can say that hidden notices were not applied,
 * instead of quietly showing what she hid. A token without the
 * notice-dismissal / notice-pref grants answers `Forbidden` here.
 */
export async function loadNoticePrefsChecked(
  uid: unknown,
  fetch: typeof globalThis.fetch,
  door: NoticeDoor = 'session'
): Promise<{ prefs: NoticePrefs; ok: boolean }> {
  if (!uid) return { prefs: EMPTY_PREFS, ok: true };
  try {
    const res: any = await userRead(door, uid, '423myNoticePrefs', fetch);
    if (res?.errors?.length) return { prefs: EMPTY_PREFS, ok: false };
    return { prefs: readNoticePrefs(res), ok: true };
  } catch {
    return { prefs: EMPTY_PREFS, ok: false };
  }
}
