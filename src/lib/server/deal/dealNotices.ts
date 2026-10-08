/**
 * The deals bell's notices (docs/inprogress/PLAN_SMART_NOTICES.md §6.2): across the
 * user's active deals, what waits for her — a candidate on an open part of her
 * deal, a request that raises her price, what she still owes, or (as a provider)
 * the confirmation that her part's money arrived.
 *
 * Each deal is read exactly as its own page reads it (`readDealPieces`). That is
 * a handful of reads per deal, so only the most recent few are read: the bell is
 * a pointer, and the full list is the deals page.
 *
 * Never rejects; `null` means "could not tell" (as in the concierge bell).
 */

import { objectRun, type NoticeDoor } from '$lib/server/notices/door';
import { fetchActiveDealRefs } from '$lib/server/deals/dealsQueries';
import { readDealPieces } from '$lib/server/deal/dealPieces';
import { loadNoticePrefs, type NoticePrefs } from '$lib/server/notices/prefs';
import { applyDismissals, compareNotices, dealNotices, type Notice } from '$lib/notices';

/** How many deals the bell reads, newest first. */
export const BELL_DEALS = 8;

export async function loadDealNotices(
  uid: unknown,
  fetch: typeof globalThis.fetch,
  /** Already started by a page that reads them for several lists (the hub) — read once. */
  prefsPending?: Promise<NoticePrefs>,
  /** `service` for an external MCP key (no session); see ../notices/door.ts. */
  door: NoticeDoor = 'session'
): Promise<Notice[] | null> {
  if (!uid) return [];
  const me = String(uid);
  try {
    const [refs, prefs] = await Promise.all([fetchActiveDealRefs(fetch, me, door), prefsPending ?? loadNoticePrefs(uid, fetch, door)]);
    // One deal can be both a purchase and a sale of hers (her own rikma sold to her).
    const byId = new Map(refs.map((r) => [r.sheirutId, r]));
    const recent = [...byId.values()].sort((a, b) => Number(b.sheirutId) - Number(a.sheirutId)).slice(0, BELL_DEALS);

    const run = objectRun(door, fetch);
    const lists = await Promise.all(
      recent.map(async (ref) => {
        const p = await readDealPieces(run, ref.sheirutId, me, 'deals bell');
        return dealNotices({
          viewerId: me,
          deal: { sheirutId: ref.sheirutId, name: ref.name, createdAt: ref.createdAt },
          offers: p.offers,
          edits: p.edits,
          due: p.due ? { remaining: p.due.remaining, customerIds: p.due.customerIds } : null,
          parts: p.parts
        });
      })
    );
    return applyDismissals(lists.flat(), prefs.dismissals).sort(compareNotices);
  } catch (e) {
    console.warn('[deals] bell notices failed (non-fatal):', e);
    return null;
  }
}
