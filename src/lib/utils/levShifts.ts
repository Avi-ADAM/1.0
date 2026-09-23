/**
 * The heart's shift cards (docs/PLAN_SHIFTS.md §9.4): store, processor and
 * derived feed, in one module.
 *
 * The data does not come through the main user query — the shift collections
 * are read by `getShiftWork` on the server, gated on SHIFTS — so this kind
 * keeps its own store and joins the feed through `finalSwiperArray` like every
 * other kind (see docs/HOWTO_ADD_LEV_OBJECT.md, "a separate query").
 *
 *   shiftDeclare — a cycle is waiting for my availability
 *   shiftDraft   — a published draft I am in, while objections are open
 *   shiftHole    — a coming shift nobody covers
 */

import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { ShiftWork } from '$lib/shifts/work';
import { createProjectInfo } from '$lib/utils/projectHelpers.js';
import { PRIORITY_BAND, type DisplayItem } from './levProcessors';
import { projectsStore } from '$lib/stores/levStores';

export const SHIFT_ANIS = ['shiftDeclare', 'shiftDraft', 'shiftHole'] as const;

export const shiftWorkStore: Writable<ShiftWork> = writable({ declare: [], drafts: [], holes: [] });

/** Pure: ShiftWork → DisplayItem[]. Never throws on missing data. */
export function processShiftWork(work: ShiftWork | null | undefined): DisplayItem[] {
  if (!work) return [];
  const items: DisplayItem[] = [];
  const base = (projectId: string | null) => {
    const info = createProjectInfo(projectId ?? '') as Record<string, any>;
    return { ...info, projectId: projectId ?? '', projectName: info?.projectName ?? '', src: info?.src2 || info?.src || '' };
  };

  for (const d of work.declare ?? []) {
    items.push({
      ...base(d.projectId),
      ani: 'shiftDeclare',
      azmi: 'shiftDeclare',
      // An open question addressed to me, with a deadline: the vote band.
      pl: PRIORITY_BAND.VOTE_PENDING + 30,
      coinlapach: `shiftDeclare-${d.planId}-${d.periodKey}`,
      ...d
    });
  }
  for (const d of work.drafts ?? []) {
    items.push({
      ...base(d.projectId),
      ani: 'shiftDraft',
      azmi: 'shiftDraft',
      pl: PRIORITY_BAND.VOTE_PENDING + 25,
      coinlapach: `shiftDraft-${d.periodId}`,
      ...d
    });
  }
  (work.holes ?? []).forEach((h, i) => {
    items.push({
      ...base(h.projectId),
      ani: 'shiftHole',
      azmi: 'shiftHole',
      // Next in line first, then whoever has room, in the order the server sorted.
      pl: PRIORITY_BAND.VOTE_PENDING + (h.nextInLine ? 5 : 15) + Math.min(i, 9) * 0.1,
      coinlapach: `shiftHole-${h.shiftId}`,
      ...h
    });
  });
  return items;
}

export const processedShiftWork: Readable<DisplayItem[]> = derived(
  [shiftWorkStore, projectsStore],
  ([$work]) => processShiftWork($work)
);
