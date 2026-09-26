/**
 * Gap detection for the concierge — which needs of a wish nothing inside the
 * platform answers yet (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §2).
 *
 * Pure, no I/O. The external search runs only on what this returns, so it is
 * the rule that keeps outside offers from ever competing with members:
 *
 *   covered   — a live proposal sits on the row, or a member / product / free
 *               resource answers it well (and, for a wish with a place, is
 *               proven to reach her). No outside search.
 *   weak      — something inside relates, but only loosely, or it is not
 *               known to reach her. Searched, shown after the members.
 *   uncovered — nothing inside relates at all. Searched.
 *
 * Relatedness is the same word-overlap `matchRatson` uses to put a product on
 * a row (`textRelevance`), deliberately — not the page's looser "show everyone
 * when nobody matches" fallback, which would make every row look answered.
 */

import type { WishEnrichment } from '../ai/enrichWish';
import { textRelevance, wishHasPlace, type WishPlace } from './localMatch';

export type Coverage = 'covered' | 'weak' | 'uncovered';
export type NeedKind = 'mission' | 'resource';

export interface CoverageNeed {
  kind: NeedKind;
  /** Position in extracted_missions / extracted_resources (per kind). */
  idx: number;
  name: string;
  importance: 'must' | 'nice';
  /** The extracted component's id, when saved — proposals may key on it. */
  componentId?: string | number | null;
}

export interface CoverageProposal {
  status: string | null;
  /** `covered_missions[].extracted_mission_idx` (an idx or a component id). */
  missionKeys: string[];
  resourceKeys: string[];
}

export interface NeedCoverage extends CoverageNeed {
  key: string;
  coverage: Coverage;
  /** Internal candidates that relate at all — for "יש גם אצלנו". */
  internalCount: number;
}

/** A provider this related counts as an answer, not a maybe. */
export const STRONG_RELEVANCE = 0.5;

/** Stable key of a plan row: `m:2`, `r:0`. */
export function needKey(kind: NeedKind, idx: number): string {
  return `${kind === 'mission' ? 'm' : 'r'}:${idx}`;
}

const DEAD = new Set(['rejected', 'expired', 'withdrawn', 'cancelled']);

function proposalCovers(p: CoverageProposal, need: CoverageNeed): boolean {
  if (DEAD.has(String(p.status ?? ''))) return false;
  const keys = need.kind === 'mission' ? p.missionKeys : p.resourceKeys;
  const mine = [String(need.idx)];
  if (need.componentId != null) mine.push(String(need.componentId));
  return keys.some((k) => mine.includes(String(k)));
}

interface Candidate {
  relevance: number;
  distanceKm?: number | null;
}

/** Everything inside the platform that might answer this need. */
function candidatesFor(need: CoverageNeed, enrichment: Partial<WishEnrichment>): Candidate[] {
  const out: Candidate[] = [];
  for (const m of enrichment.products ?? []) {
    out.push({ relevance: textRelevance(need.name, m.name ?? ''), distanceKm: m.distanceKm });
  }
  if (need.kind === 'mission') {
    for (const p of enrichment.people ?? []) {
      const terms = [...(p.matchedSkills ?? []), ...(p.skills ?? [])];
      const relevance = Math.max(0, ...terms.map((t) => textRelevance(need.name, t)));
      out.push({ relevance, distanceKm: p.distanceKm });
    }
  } else {
    for (const r of enrichment.resources ?? []) {
      const relevance = Math.max(
        textRelevance(need.name, r.name ?? ''),
        textRelevance(need.name, r.template ?? '')
      );
      out.push({ relevance, distanceKm: r.distanceKm });
    }
  }
  return out.filter((c) => c.relevance > 0);
}

/**
 * The coverage of every need of a wish. `place` is the wish's: with one, an
 * internal provider only counts as an answer when it is known to reach her
 * (enrichWish already dropped the ones that cannot; an unlocated one might).
 */
export function detectGaps(
  needs: CoverageNeed[],
  enrichment: Partial<WishEnrichment> | null | undefined,
  proposals: CoverageProposal[] = [],
  place: WishPlace | null = null
): NeedCoverage[] {
  const physical = wishHasPlace(place);
  return needs
    .filter((n) => n.name.trim().length > 0)
    .map((need) => {
      const key = needKey(need.kind, need.idx);
      if (proposals.some((p) => proposalCovers(p, need))) {
        return { ...need, key, coverage: 'covered' as const, internalCount: 1 };
      }
      const cands = candidatesFor(need, enrichment ?? {});
      const strong = cands.some(
        (c) => c.relevance >= STRONG_RELEVANCE && (!physical || c.distanceKm != null)
      );
      const coverage: Coverage = strong ? 'covered' : cands.length > 0 ? 'weak' : 'uncovered';
      return { ...need, key, coverage, internalCount: cands.length };
    });
}

/**
 * The needs worth an outside search, in the order the budget is spent:
 * musts before nice-to-haves, nothing-inside before something-loose, then the
 * plan's own order. Capped at `max`.
 */
export function selectGaps(coverages: NeedCoverage[], max: number): NeedCoverage[] {
  const rank = (c: NeedCoverage) =>
    (c.importance === 'must' ? 0 : 2) + (c.coverage === 'uncovered' ? 0 : 1);
  return coverages
    .map((c, order) => ({ c, order }))
    .filter(({ c }) => c.coverage !== 'covered')
    .sort((a, b) => rank(a.c) - rank(b.c) || a.order - b.order)
    .slice(0, Math.max(0, max))
    .map(({ c }) => c);
}
