/**
 * Tier 2 — the big expansion run (PLAN_PROJECT_PLANNING_BOARDS §1).
 *
 * Takes ONE direction (or a free-text brief) and breaks it into concrete
 * proposed rows: missions and resources, each resolved against the platform's
 * vocabulary so the row can prefill the real creation form.
 *
 * Two things make this project-aware rather than a generic wish breakdown:
 *
 *  1. **Deduplication against the live project.** A direction that says
 *     "market the product" must not propose "design a logo" when that mission
 *     is already open. Such rows are kept but flagged with `existingRef`, so
 *     the board can show "already exists" instead of quietly creating a
 *     duplicate.
 *  2. **Vocabulary resolution.** Skills/roles are matched to real platform
 *     entries via `resolveMissionSpec`, so the prefilled form opens with
 *     canonical chips rather than invented strings.
 *
 * Only runs on explicit request, for one direction at a time.
 */

import { extractWish, type WishExtraction } from '../ai/extractWish.js';
import { resolveMissionSpec } from '../mission/resolveMissionSpec.js';
import { fuzzyMissionMatch } from '../../utils/fuzzyMatch.js';
import { getProjectContext, type ProjectContext } from '../ai/projectContext.js';

export type PlanItemKind = 'mission' | 'act' | 'resource' | 'product' | 'note';

export interface ExistingRef {
  type: 'openMission' | 'missionInProgress' | 'product';
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
  extraction: WishExtraction;
  /** Model-suggested clarifying questions, surfaced above the rows. */
  hints: WishExtraction['hints'];
}

/**
 * Anything at or above this fuzzy score is treated as "the project already has
 * this". `fuzzyMissionMatch` returns 1.0 for a substring hit and 0.9 for a
 * reverse substring hit, so 0.7 keeps genuine near-duplicates while letting
 * merely related names through as new rows.
 */
export const DUPLICATE_THRESHOLD = 0.7;

interface Candidate {
  type: ExistingRef['type'];
  id: string;
  name: string;
}

/** Everything already live in the project that a proposed row could duplicate. */
export function collectExistingCandidates(ctx: ProjectContext): Candidate[] {
  const out: Candidate[] = [];
  for (const m of ctx.openMissions ?? []) {
    if (m?.name) out.push({ type: 'openMission', id: String(m.id), name: m.name });
  }
  for (const m of ctx.myMissions ?? []) {
    if (m?.name) out.push({ type: 'missionInProgress', id: String(m.id), name: m.name });
  }
  for (const p of ctx.products ?? []) {
    if (p?.name) out.push({ type: 'product', id: String(p.id), name: p.name });
  }
  return out;
}

/**
 * Find the live entity a proposed name duplicates, if any.
 * Pure — the whole dedup decision is testable without a network.
 */
export function findExisting(
  name: string,
  candidates: Candidate[],
  threshold: number = DUPLICATE_THRESHOLD
): ExistingRef | null {
  const clean = (name ?? '').trim();
  if (!clean) return null;

  let best: ExistingRef | null = null;
  for (const c of candidates) {
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
  threshold: number = DUPLICATE_THRESHOLD
): ExpandedItem[] {
  const candidates = collectExistingCandidates(ctx);
  const seen = new Set<string>();
  const out: ExpandedItem[] = [];

  for (const item of items) {
    const key = `${item.kind}:${item.name.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, existingRef: findExisting(item.name, candidates, threshold) });
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

/** Turn the raw extraction into rows, before dedup and vocabulary resolution. */
function toItems(extraction: WishExtraction): ExpandedItem[] {
  const skillNames = (extraction.skills ?? []).map((s) => s.name).filter(Boolean);

  const missions: ExpandedItem[] = (extraction.missions ?? []).map((m, i) => ({
    kind: 'mission' as const,
    name: m.name,
    descrip: '',
    imp: m.imp,
    // Skills are extracted for the wish as a whole; every mission row starts
    // with them and the user prunes per row in the form.
    spec: { skills: skillNames },
    existingRef: null,
    order: i
  }));

  const resources: ExpandedItem[] = (extraction.resources ?? []).map((r, i) => ({
    kind: 'resource' as const,
    name: r.name,
    descrip: '',
    imp: r.imp,
    spec: {},
    existingRef: null,
    order: missions.length + i
  }));

  return [...missions, ...resources];
}

/**
 * Resolve platform vocabulary for the mission rows so the prefilled form opens
 * with canonical skills/roles and can reuse an existing catalog template.
 *
 * Best-effort: Pinecone is optional infra, so a failure leaves the raw names in
 * place rather than failing the whole expansion.
 */
async function resolveVocabulary(
  items: ExpandedItem[],
  fetchInstance: typeof fetch,
  lang: 'he' | 'en' | 'ar'
): Promise<ExpandedItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.kind !== 'mission') return item;
      try {
        const resolved = await resolveMissionSpec(
          { name: item.name, skills: (item.spec.skills as string[]) ?? [], lang },
          fetchInstance
        );
        return {
          ...item,
          spec: {
            ...item.spec,
            skillIds: resolved.skills.ids,
            roleIds: resolved.roles.ids,
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
    /** Pre-built context, when the caller already has one. */
    context?: ProjectContext;
  } = {}
): Promise<ExpansionResult> {
  const lang = options.lang ?? 'he';

  const ctx =
    options.context ??
    (await getProjectContext(String(projectId), String(userId), fetchInstance, {
      isServerRequest: options.isServerRequest ?? false
    }));

  const extraction = await extractWish(brief, options.apiKey);

  const withVocab = await resolveVocabulary(toItems(extraction), fetchInstance, lang);
  const items = dedupeAgainstProject(withVocab, ctx);

  return { items, extraction, hints: extraction.hints ?? [] };
}
