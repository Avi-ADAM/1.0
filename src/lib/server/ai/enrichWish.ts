/**
 * enrichWish — ground the AI extraction in what already exists on 1Lev1.
 *
 * Pipeline (all stages best-effort — a failure degrades to an empty section
 * instead of breaking the live panel):
 *
 *   1. normalise skills via vector search (Gemini embed → Pinecone `skills`
 *      namespace, reusing src/lib/embed/*). Free-form LLM skills like "מצלמת
 *      אירועים" snap to the canonical platform skill ("צלם"). Falls back to the
 *      raw terms when Pinecone/embeddings aren't configured.
 *   2. people  — members who hold those skills (`201findUsersBySkill`).
 *   3. missions — existing library missions, via the vector `missions`
 *      namespace plus a `containsi` fallback (`200findMissionsBySkill`).
 *   4. resources — *available* resource instances. mashaabim is the template;
 *      Sp is the per-owner instance with `panui` (free) — so we look up free Sp
 *      rows and surface their owners (`202findAvailableSp`).
 *
 * Location (docs/PLAN_CONCIERGE_LOCAL_PROVIDERS.md): when the wish has a
 * place, providers whose area does not reach it are dropped and the rest are
 * ordered nearest first, each carrying `distanceKm`. Online / unlocated
 * providers are kept, after the located ones. With no place, nothing changes.
 *
 * DB calls go through the vetted `/api/send` proxy with the request-scoped
 * `fetch`, so auth cookies + the qids allow-list are reused.
 */

import { fuzzyMissionMatch } from '../../utils/fuzzyMatch';
import { matchCategory, type MatchResult } from '../../embed/matcher';
import {
  byDistance,
  personPlaces,
  productPlace,
  reachFor,
  reachForPerson,
  toNum,
  wishHasPlace,
  type Reach,
  type WishPlace
} from '../concierge/localMatch';
import type { WishExtraction } from './extractWish';

type FetchFn = typeof globalThis.fetch;

export interface NormalisedSkill {
  /** What the user/agent said. */
  term: string;
  /** Canonical platform skill it snapped to (if any). */
  canonical: string | null;
  status: 'matched' | 'suggestion' | 'new';
  similarity: number | null;
}

export interface MatchedMission {
  id: string;
  name: string;
  desc: string;
  skills: string[];
  score: number;
  matchedTerm: string;
  source: 'vector' | 'keyword';
}

export interface SuggestedPerson {
  id: string;
  username: string;
  avatar: string | null;
  skills: string[];
  matchedSkills: string[];
  projects: string[];
  /** km from the wish; null when unknown (no place on either side). */
  distanceKm?: number | null;
}

export interface AvailableResource {
  id: string;
  name: string;
  template: string | null;
  price: number | null;
  kindOf: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerAvatar: string | null;
  project: string | null;
  matchedTerm: string;
  distanceKm?: number | null;
}

export interface SuggestedProduct {
  id: string;
  name: string;
  desc: string | null;
  price: number | null;
  subCategory: string | null;
  projectId: string | null;
  projectName: string | null;
  projectLogo: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  matchedTerm: string;
  distanceKm?: number | null;
}

export interface WishEnrichment {
  skills: NormalisedSkill[];
  missions: MatchedMission[];
  people: SuggestedPerson[];
  resources: AvailableResource[];
  products: SuggestedProduct[];
  /**
   * The place these results were filtered for (`placeKey`), or null when the
   * wish had none — lets a reader tell whether a saved snapshot is stale.
   */
  place?: string | null;
}

/** Stable key of a wish place, for comparing a snapshot with the wish. */
export function placeKey(place: WishPlace | null | undefined): string | null {
  if (!wishHasPlace(place)) return null;
  const r = (n: unknown) => Math.round((toNum(n) ?? 0) * 1000) / 1000;
  return `${r(place.lat)},${r(place.lng)},${toNum(place.radius) ?? ''}`;
}

export interface EnrichOptions {
  /** Where the wish is — filters and orders providers by reach. */
  place?: WishPlace | null;
}

/** Wider pages when we will filter by place, so near providers are not cut. */
const LOCATED_LIMIT = 20;

export const EMPTY_ENRICHMENT: WishEnrichment = {
  skills: [],
  missions: [],
  people: [],
  resources: [],
  products: []
};

/** One call to the internal GraphQL proxy. Returns `data` or null on failure. */
async function sendQid(
  fetchFn: FetchFn,
  queId: string,
  arg: Record<string, unknown>
): Promise<any> {
  try {
    const res = await fetchFn('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSer: false, data: { arg, queId } })
    });
    if (!res.ok) {
      console.warn(`[enrichWish] ${queId} → HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json?.data ?? null;
  } catch (err) {
    console.warn(`[enrichWish] ${queId} failed:`, err);
    return null;
  }
}

/** Vector match, but never throw — Pinecone/embeddings are optional infra. */
async function safeMatchCategory(
  inputs: string[],
  namespace: 'skills' | 'missions'
): Promise<MatchResult[] | null> {
  const terms = inputs.map((s) => s.trim()).filter(Boolean);
  if (terms.length === 0) return [];
  try {
    return await matchCategory(terms, namespace);
  } catch (err) {
    console.warn(`[enrichWish] vector match (${namespace}) unavailable:`, err);
    return null;
  }
}

function skillNames(node: any): string[] {
  return (node?.attributes?.skills?.data ?? [])
    .map((s: any) => s?.attributes?.skillName)
    .filter((s: any): s is string => typeof s === 'string' && s.length > 0);
}

function dedupeCap(values: string[], cap: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const clean = v.trim();
    const key = clean.toLowerCase();
    if (clean.length >= 2 && !seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
    if (out.length >= cap) break;
  }
  return out;
}

export async function enrichWish(
  extraction: WishExtraction,
  fetchFn: FetchFn,
  opts: EnrichOptions = {}
): Promise<WishEnrichment> {
  const place = wishHasPlace(opts.place) ? opts.place : null;
  const limitArg = place ? { limit: LOCATED_LIMIT } : {};
  const skillTerms = extraction.skills.map((s) => s.name);
  const missionNames = extraction.missions.map((m) => m.name);
  const resourceNames = extraction.resources.map((r) => r.name);

  // ── 1. Normalise skills via vector (best-effort) ───────────────────────────
  const skillVec = await safeMatchCategory(skillTerms, 'skills');
  const normalisedSkills: NormalisedSkill[] = (skillVec ?? []).map((r) => ({
    term: r.input,
    canonical: r.existingLabel ?? null,
    status: r.status,
    similarity: r.similarity ?? null
  }));

  // Canonical search terms: prefer the snapped skill label, else the raw term.
  // Top up with must-have mission names so we still match when no skills typed.
  const peopleTerms = dedupeCap(
    [
      ...(skillVec
        ? skillVec.map((r) => r.existingLabel || r.input)
        : skillTerms),
      ...extraction.missions.filter((m) => m.imp === 'must').map((m) => m.name)
    ],
    5
  );

  // Products are packaged services a weave already offers — match on the named
  // needs themselves (missions + resources), capped to keep round-trips bounded.
  const productTerms = dedupeCap([...missionNames, ...resourceNames], 5);

  // ── 2, 4 & 5. People + available resources + existing products, in parallel ─
  const [peopleResults, resourceResults, productResults] = await Promise.all([
    Promise.all(
      peopleTerms.map((q) => sendQid(fetchFn, '201findUsersBySkill', { q, ...limitArg }))
    ),
    Promise.all(
      dedupeCap(resourceNames, 4).map((q) =>
        sendQid(fetchFn, '202findAvailableSp', { q, ...limitArg }).then((data) => ({ q, data }))
      )
    ),
    Promise.all(
      productTerms.map((q) =>
        sendQid(fetchFn, '203findMatanotByText', { q, ...limitArg }).then((data) => ({ q, data }))
      )
    )
  ]);

  // ── 3. Missions: vector first, keyword fallback ────────────────────────────
  const missions = await resolveMissions(extraction, missionNames, fetchFn);

  // People aggregation ───────────────────────────────────────────────────────
  const personById = new Map<string, SuggestedPerson & { _matched: Set<string> }>();
  peopleResults.forEach((data, i) => {
    const term = peopleTerms[i];
    for (const node of data?.usersPermissionsUsers?.data ?? []) {
      const id = String(node.id);
      const a = node?.attributes ?? {};
      const reach = reachForPerson(personPlaces(a), place);
      if (!reach.ok) continue;
      let person = personById.get(id);
      if (!person) {
        person = {
          id,
          username: a.username ?? '',
          avatar:
            a.profilePic?.data?.attributes?.url ??
            a.profilePic?.data?.attributes?.formats?.thumbnail?.url ??
            null,
          skills: skillNames(node),
          matchedSkills: [],
          projects: (a.projects_1s?.data ?? [])
            .map((p: any) => p?.attributes?.projectName)
            .filter((p: any): p is string => typeof p === 'string'),
          distanceKm: reach.distanceKm,
          _matched: new Set<string>()
        };
        personById.set(id, person);
      }
      person._matched.add(term);
    }
  });
  // Most matched skills first; among equals, nearest first.
  const byFit = (a: SuggestedPerson, b: SuggestedPerson) =>
    b.matchedSkills.length - a.matchedSkills.length || byDistance(a, b);
  let people = [...personById.values()]
    .map(({ _matched, ...rest }) => ({ ...rest, matchedSkills: [..._matched] }))
    .sort(byFit)
    .slice(0, 10);

  // Mission-offer providers (PLAN_USER_OFFERINGS §3.6 / M6): users holding an
  // active priced offer on one of the matched mission templates are prime
  // candidates — merge them into the people list (deduped by user id; the
  // mission name joins their matched terms).
  const matchedMissionIds = missions.map((m) => m.id);
  if (matchedMissionIds.length > 0) {
    const offerData = await sendQid(fetchFn, '270findMissionOffersByMission', {
      ids: matchedMissionIds
    });
    const merged = new Map(people.map((p) => [p.id, p]));
    for (const node of offerData?.missionOffers?.data ?? []) {
      const a = node?.attributes ?? {};
      const u = a.users_permissions_user?.data;
      if (!u?.id) continue;
      const id = String(u.id);
      const reach = reachForPerson(personPlaces(u.attributes), place);
      if (!reach.ok) continue;
      const missionName: string =
        a.mission?.data?.attributes?.missionName ?? a.name ?? '';
      const existing = merged.get(id);
      if (existing) {
        if (missionName && !existing.matchedSkills.includes(missionName)) {
          existing.matchedSkills.push(missionName);
        }
        continue;
      }
      const ua = u.attributes ?? {};
      merged.set(id, {
        id,
        username: ua.username ?? '',
        avatar:
          ua.profilePic?.data?.attributes?.url ??
          ua.profilePic?.data?.attributes?.formats?.thumbnail?.url ??
          null,
        skills: (ua.skills?.data ?? [])
          .map((s: any) => s?.attributes?.skillName)
          .filter((s: any): s is string => typeof s === 'string' && s.length > 0),
        matchedSkills: missionName ? [missionName] : [],
        projects: (ua.projects_1s?.data ?? [])
          .map((p: any) => p?.attributes?.projectName)
          .filter((p: any): p is string => typeof p === 'string'),
        distanceKm: reach.distanceKm
      });
    }
    people = [...merged.values()].sort(byFit).slice(0, 10);
  }

  // Resource (Sp) aggregation ────────────────────────────────────────────────
  const resourceById = new Map<string, AvailableResource>();
  for (const { q, data } of resourceResults) {
    for (const node of data?.sps?.data ?? []) {
      const id = String(node.id);
      if (resourceById.has(id)) continue;
      const a = node?.attributes ?? {};
      const owner = a.users_permissions_user?.data;
      const reach = resourceReach(a, place);
      if (!reach.ok) continue;
      resourceById.set(id, {
        id,
        name: a.name ?? a.mashaabim?.data?.attributes?.name ?? '',
        template: a.mashaabim?.data?.attributes?.name ?? null,
        price: typeof a.price === 'number' ? a.price : null,
        kindOf: a.kindOf ?? null,
        ownerId: owner?.id ? String(owner.id) : null,
        ownerName: owner?.attributes?.username ?? null,
        ownerAvatar: owner?.attributes?.profilePic?.data?.attributes?.url ?? null,
        project: a.project?.data?.attributes?.projectName ?? null,
        matchedTerm: q,
        distanceKm: reach.distanceKm
      });
    }
  }
  const resources = [...resourceById.values()].sort(byDistance).slice(0, 8);

  // Product (matanot) aggregation ────────────────────────────────────────────
  const productById = new Map<string, SuggestedProduct>();
  for (const { q, data } of productResults) {
    for (const node of data?.matanots?.data ?? []) {
      const id = String(node.id);
      if (productById.has(id)) continue;
      const a = node?.attributes ?? {};
      const reach = reachFor(productPlace(a), place);
      if (!reach.ok) continue;
      const proj = a.projectcreates?.data?.[0];
      const price =
        typeof a.estimatedPrice === 'number'
          ? a.estimatedPrice
          : typeof a.price === 'number'
            ? a.price
            : null;
      productById.set(id, {
        id,
        name: a.name ?? '',
        desc: a.desc ?? null,
        price,
        subCategory: null,
        projectId: proj?.id ? String(proj.id) : null,
        projectName: proj?.attributes?.projectName ?? null,
        projectLogo: proj?.attributes?.profilePic?.data?.attributes?.url ?? null,
        currencyName: a.currency?.data?.attributes?.name ?? null,
        currencySymbol: a.currency?.data?.attributes?.simbol ?? null,
        matchedTerm: q,
        distanceKm: reach.distanceKm
      });
    }
  }
  const products = [...productById.values()].sort(byDistance).slice(0, 8);

  return {
    skills: normalisedSkills,
    missions,
    people,
    resources,
    products,
    place: placeKey(place)
  };
}

/**
 * A free resource instance serves from its own location, else its rikma's,
 * else wherever its owner is.
 */
function resourceReach(a: any, place: WishPlace | null): Reach {
  const own = productPlace({ location: a?.location });
  if (own) return reachFor(own, place);
  const proj = productPlace({ location: a?.project?.data?.attributes?.location });
  if (proj) return reachFor(proj, place);
  return reachForPerson(personPlaces(a?.users_permissions_user?.data?.attributes), place);
}

/**
 * Existing missions for the wish, via a `containsi` keyword pass over the
 * mission library (name/desc/skill). The Strapi mission id is authoritative, so
 * results dedupe cleanly. (Skill normalisation already runs through the proven
 * Pinecone `skills` namespace upstream; the `missions` vector namespace isn't
 * reliably synced, so we don't depend on it here.)
 */
async function resolveMissions(
  extraction: WishExtraction,
  missionNames: string[],
  fetchFn: FetchFn
): Promise<MatchedMission[]> {
  const byId = new Map<string, MatchedMission>();

  // Keyword pass — skills + mission names, capped to keep round-trips bounded.
  const keywordTerms = dedupeCap(
    [...extraction.skills.map((s) => s.name), ...missionNames],
    5
  );
  const keywordResults = await Promise.all(
    keywordTerms.map((q) => sendQid(fetchFn, '200findMissionsBySkill', { q }))
  );
  keywordResults.forEach((data, i) => {
    const term = keywordTerms[i];
    for (const node of data?.missions?.data ?? []) {
      const id = String(node.id);
      const name = node?.attributes?.missionName ?? '';
      const desc = node?.attributes?.descrip ?? '';
      const score = Math.max(
        fuzzyMissionMatch(term, name).score,
        fuzzyMissionMatch(term, desc).score * 0.6
      );
      const existing = byId.get(id);
      if (existing) {
        // Enrich the vector hit with name/desc/skills if it lacked them.
        if (!existing.desc && desc) existing.desc = desc;
        if (existing.skills.length === 0) existing.skills = skillNamesFromMission(node);
        continue;
      }
      byId.set(id, {
        id,
        name,
        desc,
        skills: skillNamesFromMission(node),
        score,
        matchedTerm: term,
        source: 'keyword'
      });
    }
  });

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 8);
}

function skillNamesFromMission(node: any): string[] {
  return (node?.attributes?.skills?.data ?? [])
    .map((s: any) => s?.attributes?.skillName)
    .filter((s: any): s is string => typeof s === 'string' && s.length > 0);
}
