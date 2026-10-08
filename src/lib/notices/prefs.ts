/**
 * The viewer's notice settings, as qid 423 returns them (collections
 * notice-dismissal / notice-pref in 1.0b; PLAN_SMART_NOTICES §4.1). Pure, so
 * both a server load (`$lib/server/notices/prefs`) and the heart, which loads in
 * the browser, read them the same way.
 */

import type { NoticeDismissal } from './types';

export interface NoticePrefs {
  dismissals: NoticeDismissal[];
  /**
   * Kinds the viewer chose to mute, `ani-key → shown`. Written only by a
   * deliberate "mute this kind" — never by the heart's "show only X" filter,
   * which is a moment's view and would otherwise silently empty her heart and
   * her hub on every device afterwards.
   */
  milon: Record<string, boolean> | null;
  mutedProjects: string[];
  lastSeenAt: string | null;
}

export const EMPTY_PREFS: NoticePrefs = { dismissals: [], milon: null, mutedProjects: [], lastSeenAt: null };

/** qid 423's answer (through the proxy, or `{ data }`) into prefs. */
export function readNoticePrefs(res: any): NoticePrefs {
  const d = res?.data ?? res;
  const pref = d?.noticePrefs?.data?.[0]?.attributes ?? null;
  return {
    dismissals: (d?.noticeDismissals?.data ?? [])
      .map((r: any) => ({ noticeKey: String(r?.attributes?.noticeKey ?? ''), until: r?.attributes?.until ?? null }))
      .filter((r: NoticeDismissal) => r.noticeKey),
    milon: pref?.milon && typeof pref.milon === 'object' ? (pref.milon as Record<string, boolean>) : null,
    mutedProjects: Array.isArray(pref?.mutedProjects) ? pref.mutedProjects.map(String) : [],
    lastSeenAt: pref?.lastSeenAt ?? null
  };
}
