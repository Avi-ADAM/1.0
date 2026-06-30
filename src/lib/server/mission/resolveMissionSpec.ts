/**
 * resolveMissionSpec — The core resolver for autonomous mission creation.
 *
 * Accepts a free-form mission spec (names only) and returns fully resolved
 * IDs ready for `createMission`. For each vocabulary category it:
 *   - `matched`    → uses the existing Strapi ID directly
 *   - `suggestion` → returns for display (never auto-creates)
 *   - `new`        → creates via /api/vocab/create + triggers translations
 *
 * Also checks the missions namespace to detect existing catalog entries,
 * returning `matchedMissionId` when found (avoids unique-constraint violations,
 * mirrors `hydrateFromMissionName` in mission.svelte).
 *
 * All stages are best-effort: a Pinecone/embed failure degrades to an empty
 * section rather than throwing (same pattern as `enrichWish.safeMatchCategory`).
 */

import { matchCategory } from '$lib/embed/matcher.js';
import type { MatchResult } from '$lib/embed/matcher.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MissionSpecInput {
  name: string;
  descrip?: string;
  skills?: string[];
  roles?: string[];
  workways?: string[];
  vallues?: string[];
  nhours?: number;
  valph?: number;
  iskvua?: boolean;
  dateStart?: string;
  dateEnd?: string;
  location?: {
    isOnline?: boolean;
    lat?: number | null;
    lng?: number | null;
    radius?: number;
    location_hint?: string;
  };
  checklist?: Array<{
    shem: string;
    des?: string;
    link?: string;
    dateS?: string;
    dateF?: string;
  }>;
  lang: 'he' | 'en' | 'ar';
}

export interface ResolvedCategory {
  ids: string[];                 // IDs ready to pass to createMission
  suggestions: MatchResult[];   // similarity 0.72–0.88 — show to user
  newlyCreated: string[];       // names that were created (got new IDs)
}

export interface ResolvedMissionSpec {
  skills: ResolvedCategory;
  roles: ResolvedCategory;
  workways: ResolvedCategory;
  vallues: ResolvedCategory;
  matchedMissionId?: string;    // existing Mission catalog entry ID
  matchedMissionName?: string;
}

// ── Best-effort vector match ───────────────────────────────────────────────────

async function safeMatchCategory(
  inputs: string[],
  namespace: 'skills' | 'roles' | 'work_ways' | 'missions' | 'vallues'
): Promise<MatchResult[] | null> {
  const terms = inputs.map((s) => s.trim()).filter(Boolean);
  if (terms.length === 0) return [];
  try {
    return await matchCategory(terms, namespace);
  } catch (err) {
    console.warn(`[resolveMissionSpec] vector match (${namespace}) unavailable:`, err);
    return null;
  }
}

// ── Vocab creation (mirrors VocabSelector.createNew) ─────────────────────────

interface CreatedVocab {
  id: string;
  name: string;
}

async function createVocabEntry(
  fetchFn: typeof fetch,
  namespace: 'skills' | 'roles' | 'work_ways' | 'vallues',
  name: string,
  lang: 'he' | 'en' | 'ar'
): Promise<CreatedVocab | null> {
  try {
    const res = await fetchFn('/api/vocab/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace, name, lang })
    });
    if (!res.ok) {
      console.warn(`[resolveMissionSpec] vocab create HTTP ${res.status} for "${name}"`);
      return null;
    }
    const data = await res.json();
    if (data?.id) return { id: String(data.id), name };
    return null;
  } catch (err) {
    console.warn(`[resolveMissionSpec] vocab create failed for "${name}":`, err);
    return null;
  }
}

// ── Resolve one category ───────────────────────────────────────────────────────

async function resolveCategory(
  inputs: string[],
  namespace: 'skills' | 'roles' | 'work_ways' | 'vallues',
  lang: 'he' | 'en' | 'ar',
  fetchFn: typeof fetch
): Promise<ResolvedCategory> {
  if (!inputs || inputs.length === 0) {
    return { ids: [], suggestions: [], newlyCreated: [] };
  }

  const results = await safeMatchCategory(inputs, namespace);
  const ids: string[] = [];
  const suggestions: MatchResult[] = [];
  const newlyCreated: string[] = [];

  const toProcess = results ?? inputs.map((input) => ({ input, status: 'new' as const }));

  for (const r of toProcess) {
    if (r.status === 'matched' && r.existingId) {
      ids.push(r.existingId);
    } else if (r.status === 'suggestion') {
      suggestions.push(r);
      // For autonomous mode: also collect the existing ID so we still have
      // something useful, but flag it as a suggestion for review
      if (r.existingId) ids.push(r.existingId);
    } else {
      // 'new' — create it
      const created = await createVocabEntry(fetchFn, namespace, r.input, lang);
      if (created) {
        ids.push(created.id);
        newlyCreated.push(r.input);
      }
      // If creation fails: silently skip (best-effort)
    }
  }

  return { ids, suggestions, newlyCreated };
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export async function resolveMissionSpec(
  spec: MissionSpecInput,
  fetchFn: typeof fetch
): Promise<ResolvedMissionSpec> {
  const { name, skills = [], roles = [], workways = [], vallues = [], lang } = spec;

  // Run all category resolutions + mission name check in parallel
  const [skillRes, roleRes, workwayRes, vallueRes, missionNameMatches] =
    await Promise.all([
      resolveCategory(skills,   'skills',    lang, fetchFn),
      resolveCategory(roles,    'roles',     lang, fetchFn),
      resolveCategory(workways, 'work_ways', lang, fetchFn),
      resolveCategory(vallues,  'vallues',   lang, fetchFn),
      safeMatchCategory([name], 'missions'),
    ]);

  // Check if the mission name matches an existing catalog entry (for reuse)
  let matchedMissionId: string | undefined;
  let matchedMissionName: string | undefined;
  if (missionNameMatches && missionNameMatches.length > 0) {
    const best = missionNameMatches[0];
    if (best.status === 'matched' && best.existingId) {
      matchedMissionId = best.existingId;
      matchedMissionName = best.existingLabel;
    }
  }

  return {
    skills: skillRes,
    roles: roleRes,
    workways: workwayRes,
    vallues: vallueRes,
    matchedMissionId,
    matchedMissionName,
  };
}
