/**
 * A wish's breakdown as a living list (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §7):
 * the missions and resources the concierge extracted, refined in words — in
 * the site's panel or through the person's agent.
 *
 * The one rule that shapes everything here: a proposal points at its row by
 * POSITION (`covered_missions.extracted_mission_idx`). So a row a supplier
 * already answered is locked (`committed` — changing it is a conversation with
 * them, on the site), and no row may be removed or reordered in a way that
 * moves a row someone answered. New rows go at the end.
 *
 * Pure; the writes are updateRatsonDraft / updateRatsonExtraction.
 */

import type { AssistantItem, AssistantState, WishGroup } from './types.js';

type Row = { name?: string; importance?: string; hoursEst?: number | null; quantityEst?: number | null; kindOf?: string | null; notes?: string };

/** Which rows (by list and position) a live proposal already covers. */
export function committedRows(proposals: any[]): { missions: Set<number>; resources: Set<number> } {
  const out = { missions: new Set<number>(), resources: new Set<number>() };
  for (const p of proposals ?? []) {
    const a = p?.attributes ?? p ?? {};
    const status = String(a.status_proposal ?? '');
    if (status === 'dismissed' || status === 'rejected') continue;
    for (const m of a.covered_missions ?? []) {
      const i = Number(m?.extracted_mission_idx);
      if (Number.isInteger(i)) out.missions.add(i);
    }
    for (const r of a.covered_resources ?? []) {
      const i = Number(r?.extracted_resource_idx);
      if (Number.isInteger(i)) out.resources.add(i);
    }
  }
  return out;
}

/** A saved wish → the list. Each row remembers its position (`spec.idx`). */
export function wishToState(ratson: any, proposals: any[] = []): AssistantState {
  const a = ratson?.attributes ?? ratson ?? {};
  const done = committedRows(proposals);
  const items: AssistantItem[] = [];
  let n = 0;
  const push = (group: WishGroup, rows: Row[], taken: Set<number>) => {
    (rows ?? []).forEach((r, idx) => {
      const label = String(r?.name ?? '').trim();
      if (!label) return;
      const spec: Record<string, unknown> = { idx, importance: r.importance === 'must' ? 'must' : 'nice' };
      if (typeof r.hoursEst === 'number') spec.hoursEst = r.hoursEst;
      if (typeof r.quantityEst === 'number') spec.quantityEst = r.quantityEst;
      if (r.kindOf) spec.kindOf = r.kindOf;
      if (r.notes) spec.notes = r.notes;
      items.push({
        key: `w${++n}`,
        group,
        label,
        status: 'applied',
        origin: 'extract',
        spec,
        ...(taken.has(idx) ? { committed: {} } : {})
      });
    });
  };
  push('wishMissions', a.extracted_missions, done.missions);
  push('wishResources', a.extracted_resources, done.resources);
  const fields: Record<string, unknown> = {};
  if (a.name) fields.title = a.name;
  if (a.startDate) fields.dateFrom = a.startDate;
  if (a.finnishDate) fields.dateTo = a.finnishDate;
  if (typeof a.totalbounti === 'number') fields.budget = a.totalbounti;
  if (a.location_hint) fields.place = a.location_hint;
  if (typeof a.isOnline === 'boolean') fields.online = a.isOnline;
  return { items, ...(Object.keys(fields).length ? { fields } : {}) };
}

export interface WishApplyPlan {
  extracted_missions: Row[];
  extracted_resources: Row[];
  /** "Not now" rows that must stay, because a row after them was answered. */
  kept: string[];
  changed: boolean;
}

function toRow(it: AssistantItem): Row {
  const s = it.spec ?? {};
  return {
    name: it.label,
    importance: s.importance === 'must' ? 'must' : 'nice',
    ...(typeof s.hoursEst === 'number' ? { hoursEst: s.hoursEst } : {}),
    ...(typeof s.quantityEst === 'number' ? { quantityEst: s.quantityEst } : {}),
    ...(typeof s.kindOf === 'string' ? { kindOf: s.kindOf } : {}),
    ...(typeof s.notes === 'string' ? { notes: s.notes } : {})
  };
}

/** A saved list of rows in the shape `toRow` produces, for comparing. */
export function normalizeRows(rows: Row[] | undefined): Row[] {
  return (rows ?? [])
    .filter((r) => String(r?.name ?? '').trim())
    .map((r) => ({
      name: String(r.name).trim(),
      importance: r.importance === 'must' ? 'must' : 'nice',
      ...(typeof r.hoursEst === 'number' ? { hoursEst: r.hoursEst } : {}),
      ...(typeof r.quantityEst === 'number' ? { quantityEst: r.quantityEst } : {}),
      ...(r.kindOf ? { kindOf: r.kindOf } : {}),
      ...(r.notes ? { notes: r.notes } : {})
    }));
}

/**
 * The new breakdown. Original rows keep their order; a "not now" row is left
 * out only when nothing answered sits at or after its position; new rows are
 * appended. With the saved wish passed in, `changed` says whether there is
 * anything to write at all.
 */
export function planWishApply(state: AssistantState, saved?: { extracted_missions?: Row[]; extracted_resources?: Row[] }): WishApplyPlan {
  const kept: string[] = [];
  let changed = false;
  const build = (group: WishGroup): Row[] => {
    const rows = state.items.filter((it) => it.group === group);
    const original = rows
      .filter((it) => typeof it.spec?.idx === 'number')
      .sort((a, b) => (a.spec!.idx as number) - (b.spec!.idx as number));
    const fresh = rows.filter((it) => typeof it.spec?.idx !== 'number' && it.status !== 'dropped');
    const lastAnswered = Math.max(-1, ...original.filter((it) => it.committed).map((it) => it.spec!.idx as number));
    const out: Row[] = [];
    for (const it of original) {
      if (it.status === 'dropped') {
        if ((it.spec!.idx as number) < lastAnswered) {
          kept.push(it.key);
          out.push(toRow(it));
        } else changed = true;
        continue;
      }
      if (it.status !== 'applied') changed = true;
      out.push(toRow(it));
    }
    if (fresh.length) changed = true;
    out.push(...fresh.map(toRow));
    return out;
  };
  const extracted_missions = build('wishMissions');
  const extracted_resources = build('wishResources');
  if (saved) {
    changed =
      JSON.stringify(normalizeRows(saved.extracted_missions)) !== JSON.stringify(extracted_missions) ||
      JSON.stringify(normalizeRows(saved.extracted_resources)) !== JSON.stringify(extracted_resources);
  }
  return { extracted_missions, extracted_resources, kept, changed };
}
