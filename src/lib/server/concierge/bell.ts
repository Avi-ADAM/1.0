import { sendToSer } from '$lib/send/sendToSer.js';
import { notificationItems } from '$lib/concierge/summary.js';

export type BellItems = ReturnType<typeof notificationItems>;

/**
 * The concierge header bell for a page whose own load does not already hold the
 * customer's wishes: the wishes with offers still waiting for their answer.
 *
 * Start it first and `await` it last, so it runs beside the page's own work.
 * It never rejects — a bell that fails to load is an empty bell, not a broken
 * page.
 */
export function loadBell(uid: unknown, fetch: typeof globalThis.fetch): Promise<BellItems> {
  if (!uid) return Promise.resolve([]);
  return sendToSer({ uid }, '106listMyRatsons', 0, 0, false, fetch)
    .then((res: any) => notificationItems(res?.data?.ratsons?.data ?? []))
    .catch((e: unknown) => {
      console.warn('[concierge] bell 106listMyRatsons failed (non-fatal):', e);
      return [];
    });
}
