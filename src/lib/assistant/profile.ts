/**
 * The profile as a living list (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §6):
 * skills, roles, ways of working, values and the resources a member brings.
 *
 * Seeded from what is already on the profile (`applied`) and from a text or CV
 * analysis (`proposed`); edited by the person or their agent with ops; applied
 * straight from the chat (decision §0.1). Pure — the Strapi writes are in
 * $lib/server/assistant/profileApply.ts.
 */

import type { AssistantItem, AssistantState, ProfileGroup } from './types.js';

export interface Named {
  id: string;
  name: string;
}

export interface ProfileSnapshot {
  skills: Named[];
  roles: Named[];
  methods: Named[];
  vallues: Named[];
  resources: Named[];
}

/** The profile groups that are user relations, and the relation each writes. */
export const PROFILE_RELATIONS = {
  skills: 'skills',
  roles: 'tafkidims',
  methods: 'work_ways',
  vallues: 'vallues'
} as const;

export type RelationGroup = keyof typeof PROFILE_RELATIONS;
const RELATION_GROUPS = Object.keys(PROFILE_RELATIONS) as RelationGroup[];

const norm = (s: string) => s.trim().toLowerCase();

function nextKeyFactory(items: AssistantItem[], prefix: string) {
  let n = 0;
  for (const it of items) {
    const m = /^[a-z]+(\d+)$/.exec(it.key);
    if (m) n = Math.max(n, Number(m[1]));
  }
  return () => `${prefix}${++n}`;
}

/** What is on the profile now: every row `applied`, from the profile. */
export function profileItems(p: ProfileSnapshot): AssistantItem[] {
  const out: AssistantItem[] = [];
  let n = 0;
  const push = (group: ProfileGroup, list: Named[]) => {
    for (const x of list ?? []) {
      if (!x?.name?.trim()) continue;
      out.push({ key: `p${++n}`, group, label: x.name.trim(), existingId: String(x.id), status: 'applied', origin: 'profile' });
    }
  };
  push('skills', p.skills);
  push('roles', p.roles);
  push('methods', p.methods);
  push('vallues', p.vallues);
  push('resources', p.resources);
  return out;
}

/** The analyze-cv result shape this reads (CvWorkflowOutput). */
export interface CvLike {
  matched?: Partial<Record<string, { input: string; existingId?: string; existingLabel?: string }[]>>;
  suggestions?: Partial<Record<string, { input: string; existingId?: string; existingLabel?: string }[]>>;
  newItems?: Partial<Record<string, { input: string }[]>>;
  proposed_sps?: { name: string; descrip?: string }[];
}

/**
 * New proposals from a text / CV analysis, merged into a list: a row already
 * there (same vocabulary id, or the same words) is not proposed twice.
 */
export function mergeAnalysis(state: AssistantState, cv: CvLike, why?: string): AssistantState {
  const items = state.items.map((it) => ({ ...it }));
  const nextKey = nextKeyFactory(items, 'c');
  const has = (group: string, id: string | undefined, label: string) =>
    items.some((it) => it.group === group && ((id && it.existingId === id) || norm(it.label) === norm(label)));

  for (const group of RELATION_GROUPS) {
    const rows = [
      ...(cv.matched?.[group] ?? []).map((r) => ({ label: r.existingLabel || r.input, id: r.existingId })),
      ...(cv.suggestions?.[group] ?? []).map((r) => ({ label: r.existingLabel || r.input, id: r.existingId })),
      ...(cv.newItems?.[group] ?? []).map((r) => ({ label: r.input, id: undefined as string | undefined }))
    ];
    for (const r of rows) {
      const label = String(r.label ?? '').trim().slice(0, 200);
      if (!label || has(group, r.id, label)) continue;
      items.push({
        key: nextKey(),
        group,
        label,
        ...(r.id ? { existingId: String(r.id) } : {}),
        status: 'proposed',
        origin: 'extract',
        ...(why ? { why } : {})
      });
    }
  }
  for (const sp of cv.proposed_sps ?? []) {
    const label = String(sp?.name ?? '').trim().slice(0, 200);
    if (!label || has('resources', undefined, label)) continue;
    items.push({
      key: nextKey(),
      group: 'resources',
      label,
      status: 'proposed',
      origin: 'extract',
      ...(sp.descrip ? { spec: { descrip: String(sp.descrip).slice(0, 500) } } : {})
    });
  }
  return { ...state, items };
}

export interface ProfileApplyPlan {
  /** Per relation: the whole new list (a Strapi relation write replaces it). */
  relations: Partial<Record<RelationGroup, { ids: string[]; newNames: { key: string; name: string }[] }>>;
  /** Resources to add to the profile (an `sp` each). Nothing is ever deleted. */
  newResources: { key: string; name: string; descrip?: string }[];
  /** Rows that leave the profile ("not now" on something that was on it). */
  removed: string[];
  /** Rows that will be on the profile after this. */
  applying: string[];
}

/**
 * What "save" writes. Everything not set aside is kept or added; a row that
 * was on the profile and is now "not now" leaves it. Only relations that
 * actually change are written — an untouched group is not rewritten.
 */
export function planProfileApply(state: AssistantState): ProfileApplyPlan {
  const plan: ProfileApplyPlan = { relations: {}, newResources: [], removed: [], applying: [] };
  for (const group of RELATION_GROUPS) {
    const rows = state.items.filter((it) => it.group === group);
    const live = rows.filter((it) => it.status !== 'dropped');
    const leaving = rows.filter((it) => it.status === 'dropped' && it.droppedFrom === 'applied' && it.existingId);
    const adding = live.filter((it) => it.status !== 'applied');
    if (!adding.length && !leaving.length) continue;

    const ids: string[] = [];
    for (const it of live) if (it.existingId && !ids.includes(it.existingId)) ids.push(it.existingId);
    plan.relations[group] = {
      ids,
      newNames: live.filter((it) => !it.existingId).map((it) => ({ key: it.key, name: it.label }))
    };
    plan.removed.push(...leaving.map((it) => it.key));
    plan.applying.push(...adding.map((it) => it.key));
  }
  for (const it of state.items) {
    if (it.group !== 'resources' || it.status === 'dropped' || it.status === 'applied') continue;
    const descrip = typeof it.spec?.descrip === 'string' ? it.spec.descrip : undefined;
    plan.newResources.push({ key: it.key, name: it.label, ...(descrip ? { descrip } : {}) });
    plan.applying.push(it.key);
  }
  return plan;
}

/**
 * After a successful save: the rows that are on the profile become `applied`
 * (with the ids the save gave them), the ones that left stay "not now" but no
 * longer remember having been applied — restoring them is adding them again.
 */
export function markProfileApplied(
  state: AssistantState,
  plan: ProfileApplyPlan,
  newIds: Record<string, string>
): AssistantState {
  const applying = new Set(plan.applying);
  const removed = new Set(plan.removed);
  return {
    ...state,
    items: state.items.map((it) => {
      if (applying.has(it.key)) {
        const id = newIds[it.key] ?? it.existingId;
        return { ...it, status: 'applied' as const, ...(id ? { existingId: id } : {}) };
      }
      if (removed.has(it.key)) return { ...it, droppedFrom: 'proposed' as const };
      return it;
    })
  };
}
