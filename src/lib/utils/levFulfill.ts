/**
 * The heart's fulfil cards (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.2):
 * store, processor and derived feed, in one module — the shape of levShifts.ts.
 *
 * The acts do not come through the main user query: `getFulfillmentWork` reads
 * them on the server (they carry the buyer's address, members only), so this
 * kind keeps its own store and joins the feed through `finalSwiperArray`
 * (docs/HOWTO_ADD_LEV_OBJECT.md, "a separate query").
 *
 *   fulfill — an automatic act of an order: mine, or open to a role I hold.
 */
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { FulfillWorkItem } from '$lib/fulfillment/rows';
import { createProjectInfo } from '$lib/utils/projectHelpers.js';
import { PRIORITY_BAND, type DisplayItem } from './levProcessors';
import { projectsStore } from '$lib/stores/levStores';

export const FULFILL_ANIS = ['fulfill'] as const;

export const fulfillWorkStore: Writable<FulfillWorkItem[]> = writable([]);

/** Drop one act from the deck once it was done or taken elsewhere. */
export function forgetFulfillAct(actId: string) {
  fulfillWorkStore.update((items) => items.filter((i) => i.actId !== actId));
}

/** Pure: FulfillWorkItem[] → DisplayItem[]. Never throws on missing data. */
export function processFulfillWork(items: FulfillWorkItem[] | null | undefined, now = Date.now()): DisplayItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((w, i) => {
    const info = createProjectInfo(w.projectId ?? '') as Record<string, any>;
    const due = w.dueAt ? Date.parse(w.dueAt) : NaN;
    // Overdue first, then by due time; an act with no due time after the timed ones.
    const late = Number.isFinite(due) && due < now;
    const pl =
      PRIORITY_BAND.VOTE_PENDING + (late ? 2 : Number.isFinite(due) ? 20 : 35) + (w.mine ? 0 : 5) + Math.min(i, 9) * 0.1;
    return {
      ...info,
      projectId: w.projectId ?? '',
      projectName: info?.projectName ?? '',
      src: info?.src2 || info?.src || '',
      ...w,
      ani: 'fulfill',
      azmi: 'fulfill',
      pl,
      coinlapach: `fulfill-${w.actId}`,
      late
    };
  });
}

export const processedFulfillWork: Readable<DisplayItem[]> = derived(
  [fulfillWorkStore, projectsStore],
  ([$items]) => processFulfillWork($items)
);
