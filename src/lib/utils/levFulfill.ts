/**
 * The heart's fulfil cards (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.2–2.3):
 * stores, processors and derived feed, in one module — the shape of levShifts.ts.
 *
 * The acts do not come through the main user query: `getFulfillmentWork` reads
 * them on the server (they carry the buyer's address, members only), so these
 * kinds keep their own stores and join the feed through `finalSwiperArray`
 * (docs/HOWTO_ADD_LEV_OBJECT.md, "a separate query").
 *
 *   fulfill     — an automatic act: an order's step, or a purchase when a
 *                 resource runs low (A3). Mine, open to a role I hold, or open
 *                 to everyone. A `wave` step's acts due at the same cut-off are
 *                 ONE card with "all done" (A2) — 30 orders, one card.
 *   fulfillRule — a rule that would land work on me, waiting for my answer;
 *                 silence by its deadline is my yes (A2).
 */
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { FulfillWorkItem, RuleProposal } from '$lib/fulfillment/rows';
import { createProjectInfo } from '$lib/utils/projectHelpers.js';
import { PRIORITY_BAND, type DisplayItem } from './levProcessors';
import { projectsStore } from '$lib/stores/levStores';

export const FULFILL_ANIS = ['fulfill', 'fulfillRule'] as const;

/** Changes after which the heart re-reads its fulfil cards (they are not a lev slice). */
export const FULFILL_REALTIME_KEYS: ReadonlySet<string> = new Set([
  'saveFulfillmentStep',
  'respondFulfillmentStep',
  'setFulfillmentStepPaused',
  'archiveFulfillmentStep',
  'takeFulfillmentAct',
  'completeFulfillmentAct',
  'completeFulfillmentWave',
  'handOffFulfillmentAct',
  'retryOrderFulfillment',
  'receiveStock',
  'cancelOrder',
  // Shipped elsewhere: the act it was waiting for closed itself.
  'markOrderShipped',
  'markOrderFulfilled',
  // The engine opens acts through createTask.
  'createTask'
]);

export const fulfillWorkStore: Writable<FulfillWorkItem[]> = writable([]);
export const fulfillRuleStore: Writable<RuleProposal[]> = writable([]);

/** Drop acts from the deck once they were done, taken elsewhere or passed on. */
export function forgetFulfillActs(actIds: string[]) {
  const gone = new Set(actIds.map(String));
  fulfillWorkStore.update((items) => items.filter((i) => !gone.has(String(i.actId))));
}

export function forgetFulfillAct(actId: string) {
  forgetFulfillActs([actId]);
}

/** Drop a rule card once I answered it (or changed the rule). */
export function forgetFulfillRule(stepId: string) {
  fulfillRuleStore.update((rules) => rules.filter((r) => String(r.stepId) !== String(stepId)));
}

/** One wave: every act of one step due at the same cut-off. */
export interface FulfillWave {
  key: string;
  actIds: string[];
  /** The orders of the wave, in the order they were opened. */
  orders: FulfillWorkItem[];
  /** Units across the wave's items ("2 × jar" lines). */
  itemCount: number;
}

export type FulfillCardItem = FulfillWorkItem & { wave: FulfillWave | null };

const unitsOf = (items: string[]) =>
  items.reduce((sum, line) => {
    const m = /^\s*(\d+(?:\.\d+)?)\s*[×x*]/.exec(line);
    return sum + (m ? Number(m[1]) : 1);
  }, 0);

/**
 * A `wave` step's order acts with the same due time are one card. Two or more —
 * a wave of one is just an order, with its buyer and its buttons.
 */
export function groupWaves(items: FulfillWorkItem[]): FulfillCardItem[] {
  const groups = new Map<string, FulfillWorkItem[]>();
  // Each wave keeps the place of its first act in the deck.
  const slots: ({ item: FulfillWorkItem } | { wave: string })[] = [];
  for (const w of items) {
    if (w.batching === 'wave' && w.kind === 'order' && w.stepId && w.dueAt) {
      const key = `${w.projectId}:${w.stepId}:${w.dueAt}`;
      const g = groups.get(key);
      if (g) g.push(w);
      else {
        groups.set(key, [w]);
        slots.push({ wave: key });
      }
    } else {
      slots.push({ item: w });
    }
  }
  return slots.map((slot): FulfillCardItem => {
    if ('item' in slot) return { ...slot.item, wave: null };
    const g = [...(groups.get(slot.wave) ?? [])].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
    if (g.length === 1) return { ...g[0], wave: null };
    const first = g[0];
    return {
      ...first,
      // The wave is mine when every act in it is; otherwise it is still open to my role.
      mine: g.every((w) => w.mine),
      openToAll: g.every((w) => w.openToAll),
      items: [],
      buyerName: null,
      buyerPhone: null,
      address: null,
      wave: {
        key: slot.wave,
        actIds: g.map((w) => w.actId),
        orders: g,
        itemCount: g.reduce((sum, w) => sum + unitsOf(w.items), 0)
      }
    };
  });
}

/** Pure: FulfillWorkItem[] → DisplayItem[]. Never throws on missing data. */
export function processFulfillWork(items: FulfillWorkItem[] | null | undefined, now = Date.now()): DisplayItem[] {
  if (!Array.isArray(items)) return [];
  return groupWaves(items.filter(Boolean)).map((w, i) => {
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
      coinlapach: w.wave ? `fulfill-wave-${w.wave.key}` : `fulfill-${w.actId}`,
      late
    };
  });
}

/** Pure: RuleProposal[] → DisplayItem[] — the closer the deadline, the higher. */
export function processFulfillRules(rules: RuleProposal[] | null | undefined, now = Date.now()): DisplayItem[] {
  if (!Array.isArray(rules)) return [];
  return rules.filter(Boolean).map(({ when: ruleWhen, ...r }, i) => {
    const info = createProjectInfo(r.projectId ?? '') as Record<string, any>;
    const deadline = r.deadline ? Date.parse(r.deadline) : NaN;
    const hoursLeft = Number.isFinite(deadline) ? (deadline - now) / 3_600_000 : null;
    const pl = PRIORITY_BAND.VOTE_PENDING + (hoursLeft == null ? 30 : hoursLeft < 12 ? 4 : 15) + Math.min(i, 9) * 0.1;
    return {
      ...info,
      projectId: r.projectId ?? '',
      projectName: r.projectName ?? info?.projectName ?? '',
      src: info?.src2 || info?.src || '',
      ...r,
      // `when` on a DisplayItem is when it reached me (PLAN_LEV_TIMESTAMPS);
      // the rule's own conditions travel under their own name.
      ruleWhen,
      ani: 'fulfillRule',
      azmi: 'fulfillRule',
      pl,
      coinlapach: `fulfillRule-${r.stepId}`,
      // The row and the coin count down to it, like any consent clock.
      timegramaDate: r.deadline ?? null
    };
  });
}

export const processedFulfillWork: Readable<DisplayItem[]> = derived(
  [fulfillWorkStore, fulfillRuleStore, projectsStore],
  ([$items, $rules]) => [...processFulfillWork($items), ...processFulfillRules($rules)]
);
