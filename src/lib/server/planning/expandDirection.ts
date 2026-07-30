/**
 * Tier 2 — the big expansion run (PLAN_PROJECT_PLANNING_BOARDS §1).
 *
 * Takes ONE direction (or a free-text brief) and breaks it into concrete
 * proposed rows, each resolved against the platform's vocabulary so the row can
 * prefill the real creation form.
 *
 * Three things make this project-aware rather than a generic wish breakdown:
 *
 *  1. **The rikma is in the prompt.** The breakdown runs on `expandAgent`,
 *     which is given the planning snapshot and taught the domain by
 *     `domain.ts`. Previously the snapshot was fetched and then used *only* for
 *     deduplication — the model itself was handed the direction text alone, by
 *     an agent written for personal wishes. That is why rows came back generic
 *     and always as missions.
 *  2. **Deduplication against the live rikma.** A direction that says "market
 *     the product" must not propose "design a logo" when that mission is
 *     already open, nor propose a resource the rikma already published. Such
 *     rows are kept but flagged with `existingRef`, so the board can show
 *     "already exists" instead of quietly creating a duplicate.
 *  3. **Vocabulary resolution.** Skills/roles are matched to real platform
 *     entries via `resolveMissionSpec`, so the prefilled form opens with
 *     canonical chips rather than invented strings.
 *
 * Only runs on explicit request, for one direction at a time.
 */

import { extractWish } from '../ai/extractWish.js';
import { resolveMissionSpec } from '../mission/resolveMissionSpec.js';
import { fuzzyMissionMatch } from '../../utils/fuzzyMatch.js';
import type { ProjectContext } from '../ai/projectContext.js';
import { planRows, type PlanRowKind, type PlannedRow } from './expandAgent.js';
import {
  buildPlanningSnapshot,
  renderPlanningSnapshot,
  EMPTY_EXTRAS,
  type PlanningExtras,
  type PlanningSnapshot
} from './planningContext.js';

export type PlanItemKind = PlanRowKind;

export type ExistingRefType =
  | 'openMission'
  | 'missionInProgress'
  | 'product'
  | 'openResource'
  | 'resourceInProgress';

export interface ExistingRef {
  type: ExistingRefType;
  id: string;
  name: string;
  similarity: number;
}

export interface ExpandedItem {
  kind: PlanItemKind;
  name: string;
  descrip: string;
  imp: 'must' | 'nice';
  /** Prefill for the real creation form (skills, roles, ids…). */
  spec: Record<string, unknown>;
  /** Set when this row duplicates something already live in the project. */
  existingRef: ExistingRef | null;
  order: number;
}

export interface ExpansionResult {
  items: ExpandedItem[];
  /** Model-suggested clarifying questions, surfaced above the rows. */
  hints: { kind: 'question' | 'suggestion'; text: string }[];
  titleSuggestion: string;
  /** True when the planning agent produced nothing and the concierge stood in. */
  usedFallback: boolean;
  /** The website was read for this run (see `siteContext.ts`). */
  siteUsed: string | null;
}

/**
 * Anything at or above this fuzzy score is treated as "the project already has
 * this". `fuzzyMissionMatch` returns 1.0 for a substring hit and 0.9 for a
 * reverse substring hit, so 0.7 keeps genuine near-duplicates while letting
 * merely related names through as new rows.
 */
export const DUPLICATE_THRESHOLD = 0.7;

interface Candidate {
  type: ExistingRefType;
  id: string;
  name: string;
}

/**
 * Which live entities a row of a given kind could possibly duplicate.
 *
 * Kind-aware on purpose: a *resource* named "Camera" is not a duplicate of a
 * *mission* named "Camera work", and flagging it as one told the member their
 * need was already covered when it was not. `act` rows are compared against
 * missions because a chore that restates an open mission is the same mistake.
 */
const COMPARABLE: Record<PlanItemKind, ExistingRefType[]> = {
  mission: ['openMission', 'missionInProgress'],
  act: ['openMission', 'missionInProgress'],
  resource: ['openResource', 'resourceInProgress'],
  product: ['product'],
  note: []
};

/** Everything already live in the rikma that a proposed row could duplicate. */
export function collectExistingCandidates(
  ctx: ProjectContext,
  extras: PlanningExtras = EMPTY_EXTRAS
): Candidate[] {
  const out: Candidate[] = [];
  for (const m of ctx.openMissions ?? []) {
    if (m?.name) out.push({ type: 'openMission', id: String(m.id), name: m.name });
  }
  for (const m of ctx.myMissions ?? []) {
    if (m?.name) out.push({ type: 'missionInProgress', id: String(m.id), name: m.name });
  }
  // Rikma-wide work in progress — `ctx.myMissions` only holds the caller's.
  for (const m of extras.missionsInProgress ?? []) {
    if (m?.name) out.push({ type: 'missionInProgress', id: String(m.id), name: m.name });
  }
  for (const p of ctx.products ?? []) {
    if (p?.name) out.push({ type: 'product', id: String(p.id), name: p.name });
  }
  for (const r of extras.openResources ?? []) {
    if (r?.name) out.push({ type: 'openResource', id: String(r.id), name: r.name });
  }
  for (const r of extras.resourcesInProgress ?? []) {
    if (r?.name) out.push({ type: 'resourceInProgress', id: String(r.id), name: r.name });
  }

  // The same mission can arrive from both `myMissions` and the rikma-wide list.
  const seen = new Set<string>();
  return out.filter((c) => {
    const key = `${c.type}:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Find the live entity a proposed name duplicates, if any.
 * Pure — the whole dedup decision is testable without a network.
 *
 * @param kind  restricts which entity types count as a duplicate; omit to
 *              compare against everything (the old behaviour).
 */
export function findExisting(
  name: string,
  candidates: Candidate[],
  threshold: number = DUPLICATE_THRESHOLD,
  kind?: PlanItemKind
): ExistingRef | null {
  const clean = (name ?? '').trim();
  if (!clean) return null;

  const allowed = kind ? COMPARABLE[kind] : null;
  if (allowed && allowed.length === 0) return null;

  let best: ExistingRef | null = null;
  for (const c of candidates) {
    if (allowed && !allowed.includes(c.type)) continue;
    const { score } = fuzzyMissionMatch(clean, c.name, 0.5);
    if (score >= threshold && (!best || score > best.similarity)) {
      best = { type: c.type, id: c.id, name: c.name, similarity: score };
    }
  }
  return best;
}

/**
 * Mark each proposed row against what already exists, and drop rows that
 * duplicate *each other* (models repeat themselves across missions/resources).
 */
export function dedupeAgainstProject(
  items: ExpandedItem[],
  ctx: ProjectContext,
  options: { extras?: PlanningExtras; threshold?: number } = {}
): ExpandedItem[] {
  const threshold = options.threshold ?? DUPLICATE_THRESHOLD;
  const candidates = collectExistingCandidates(ctx, options.extras ?? EMPTY_EXTRAS);
  const seen = new Set<string>();
  const out: ExpandedItem[] = [];

  for (const item of items) {
    const key = `${item.kind}:${item.name.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, existingRef: findExisting(item.name, candidates, threshold, item.kind) });
  }

  // Keep ordering stable but surface genuinely new "must" rows first — those
  // are the ones worth acting on.
  return out
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const rank = (x: ExpandedItem) =>
        (x.existingRef ? 2 : 0) + (x.imp === 'must' ? 0 : 1);
      return rank(a.item) - rank(b.item) || a.i - b.i;
    })
    .map(({ item }, idx) => ({ ...item, order: idx }));
}

/** Drop nulls/empties so a row's `spec` carries only what it actually knows. */
function compact(spec: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(spec)) {
    if (v == null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Turn one planned row into a board row. The `spec` keys are exactly the ones
 * the creation forms read (`mission.svelte` via `initialSpec`,
 * `crtask.svelte`, `ResourceCreator`), so nothing the model suggested is lost
 * at the form's door.
 */
export function toExpandedItem(row: PlannedRow, order: number): ExpandedItem {
  const base = { rationale: row.rationale };

  const spec =
    row.kind === 'mission'
      ? { ...base, skills: row.skills, roles: row.roles, workways: row.workways, nhours: row.nhours, valph: row.valph }
      : row.kind === 'act'
        ? { ...base, assigneeKind: row.assigneeKind, assigneeName: row.assigneeName, missionName: row.missionName }
        : row.kind === 'resource' || row.kind === 'product'
          ? { ...base, kindOf: row.kindOf, price: row.price, quantity: row.quantity }
          : base;

  return {
    kind: row.kind,
    name: row.name,
    descrip: row.descrip,
    imp: row.imp,
    spec: compact(spec),
    existingRef: null,
    order
  };
}

/**
 * The concierge fallback: used only when the planning agent returns nothing at
 * all. It knows nothing about the rikma, so it produces bare mission/resource
 * names — better than an empty board, worse than a real plan, and the caller is
 * told which one it got.
 */
async function fallbackToConcierge(
  brief: string,
  apiKey?: string
): Promise<{ items: ExpandedItem[]; hints: ExpansionResult['hints']; titleSuggestion: string }> {
  const extraction = await extractWish(brief, apiKey);
  const skillNames = (extraction.skills ?? []).map((s) => s.name).filter(Boolean);

  const items: ExpandedItem[] = [
    ...(extraction.missions ?? []).map((m, i) => ({
      kind: 'mission' as const,
      name: m.name,
      descrip: '',
      imp: m.imp,
      spec: compact({ skills: skillNames }),
      existingRef: null,
      order: i
    })),
    ...(extraction.resources ?? []).map((r, i) => ({
      kind: 'resource' as const,
      name: r.name,
      descrip: '',
      imp: r.imp,
      spec: {},
      existingRef: null,
      order: (extraction.missions?.length ?? 0) + i
    }))
  ];

  return { items, hints: extraction.hints ?? [], titleSuggestion: extraction.titleSuggestion ?? '' };
}

/**
 * Resolve platform vocabulary for the mission rows.
 *
 * This is not cosmetic. The creation form does **not** accept free text for
 * skills, roles or work-ways: it renders chips by name and maps them back to
 * ids against the catalogue it loaded on mount, dropping anything it cannot
 * find. So a skill the model invented — or spelled its own way — was shown to
 * the member as a chip and then silently vanished on submit, and the mission
 * was created with less than the member approved.
 *
 * `resolveMissionSpec` is the existing pipeline for exactly this: match against
 * the real vocabulary, and create the entry when nothing matches. Here we keep
 * both halves of its answer — the canonical NAME for the chip, and the ID the
 * form must submit — so nothing depends on the client's catalogue being fresh.
 *
 * Best-effort: Pinecone is optional infra, so a failure leaves the raw names in
 * place rather than failing the whole expansion.
 */
export async function resolveRowVocabulary(
  items: ExpandedItem[],
  fetchInstance: typeof fetch,
  lang: 'he' | 'en' | 'ar'
): Promise<ExpandedItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.kind !== 'mission') return item;

      const skills = (item.spec.skills as string[]) ?? [];
      const roles = (item.spec.roles as string[]) ?? [];
      const workways = (item.spec.workways as string[]) ?? [];
      if (skills.length === 0 && roles.length === 0 && workways.length === 0) return item;

      try {
        const resolved = await resolveMissionSpec(
          {
            name: item.name,
            descrip: item.descrip || undefined,
            skills,
            roles,
            workways,
            nhours: (item.spec.nhours as number) ?? undefined,
            valph: (item.spec.valph as number) ?? undefined,
            lang
          },
          fetchInstance
        );

        return {
          ...item,
          spec: {
            ...item.spec,
            // Names become the CANONICAL ones — what the member sees is what
            // the platform actually has.
            ...(resolved.skills.resolved.length
              ? { skills: resolved.skills.resolved.map((t) => t.name) }
              : {}),
            ...(resolved.roles.resolved.length
              ? { roles: resolved.roles.resolved.map((t) => t.name) }
              : {}),
            ...(resolved.workways.resolved.length
              ? { workways: resolved.workways.resolved.map((t) => t.name) }
              : {}),
            // The authoritative half: id + name pairs the form submits directly.
            vocab: {
              skills: resolved.skills.resolved,
              roles: resolved.roles.resolved,
              workways: resolved.workways.resolved
            },
            matchedMissionId: resolved.matchedMissionId ?? null,
            matchedMissionName: resolved.matchedMissionName ?? null
          }
        };
      } catch (err) {
        console.warn(`[expandDirection] vocabulary resolution failed for "${item.name}":`, err);
        return item;
      }
    })
  );
}

/**
 * Expand a direction into concrete proposed rows.
 *
 * @param brief  the direction's text (title + description, or the user's free text)
 * @param options.siteMode  whether the rikma's website may be read for extra
 *   context — `'auto'` (only when the description is too thin), `'always'`,
 *   `'never'`. See `siteContext.ts`.
 */
export async function expandDirection(
  projectId: string,
  userId: string,
  brief: string,
  fetchInstance: typeof fetch,
  options: {
    apiKey?: string;
    lang?: 'he' | 'en' | 'ar';
    isServerRequest?: boolean;
    siteMode?: 'auto' | 'always' | 'never';
    /** Pre-built snapshot, when the caller already has one. */
    snapshot?: PlanningSnapshot;
  } = {}
): Promise<ExpansionResult> {
  const lang = options.lang ?? 'he';

  const snapshot =
    options.snapshot ??
    (await buildPlanningSnapshot(String(projectId), String(userId), fetchInstance, {
      isServerRequest: options.isServerRequest ?? false,
      siteMode: options.siteMode ?? 'auto'
    }));

  const planned = await planRows(
    brief,
    renderPlanningSnapshot(snapshot, lang),
    snapshot.signals.stage,
    { apiKey: options.apiKey }
  );

  let items = planned.items.map(toExpandedItem);
  let hints = planned.hints;
  let titleSuggestion = planned.titleSuggestion;
  let usedFallback = false;

  if (items.length === 0) {
    console.warn('[expandDirection] planning agent produced no rows — falling back to concierge');
    const fb = await fallbackToConcierge(brief, options.apiKey);
    items = fb.items;
    hints = fb.hints;
    titleSuggestion = fb.titleSuggestion;
    usedFallback = true;
  }

  const withVocab = await resolveRowVocabulary(items, fetchInstance, lang);

  return {
    items: dedupeAgainstProject(withVocab, snapshot.ctx, { extras: snapshot.extras }),
    hints,
    titleSuggestion,
    usedFallback,
    siteUsed: snapshot.site?.ok ? snapshot.site.url : null
  };
}
