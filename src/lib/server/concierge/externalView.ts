/**
 * The two readers of a wish's external offers — the `fetchExternalOffers`
 * action (raw Strapi attributes) and /concierge/[id]'s loader (its own shaped
 * wish) — agree here on what the needs, the proposals and the page payload
 * are (docs/inprogress/PLAN_CONCIERGE_EXTERNAL_SOURCES.md §4.3). Pure.
 */

import type { WishEnrichment } from '../ai/enrichWish';
import {
  detectGaps,
  needKey,
  type Coverage,
  type CoverageNeed,
  type CoverageProposal
} from './coverage';
import { ageHours, readCache, visibleOffers, type ExternalOffer } from './externalOffers';
import type { WishPlace } from './localMatch';

interface NeedLike {
  id?: string | number | null;
  name?: string | null;
  importance?: string | null;
}

/** The plan rows of a wish, as coverage needs. */
export function needsOf(missions: NeedLike[] = [], resources: NeedLike[] = []): CoverageNeed[] {
  const mk = (kind: 'mission' | 'resource') => (it: NeedLike, idx: number): CoverageNeed => ({
    kind,
    idx,
    name: String(it?.name ?? ''),
    importance: it?.importance === 'must' ? 'must' : 'nice',
    componentId: it?.id ?? null
  });
  return [...(missions ?? []).map(mk('mission')), ...(resources ?? []).map(mk('resource'))];
}

/** `ratsonProposals` nodes from qid 105. */
export function proposalsFromRaw(nodes: any[] = []): CoverageProposal[] {
  return (nodes ?? []).map((p) => {
    const a = p?.attributes ?? {};
    return {
      status: a.status_proposal ?? null,
      missionKeys: (a.covered_missions ?? []).map((c: any) => String(c?.extracted_mission_idx ?? '')),
      resourceKeys: (a.covered_resources ?? []).map((c: any) => String(c?.extracted_resource_idx ?? ''))
    };
  });
}

/** Proposals as /concierge/[id]'s loader shapes them. */
export function proposalsFromLoader(list: any[] = []): CoverageProposal[] {
  return (list ?? []).map((p) => ({
    status: p?.status ?? null,
    missionKeys: (p?.coveredMissions ?? []).map((c: any) => String(c?.extractedMissionIdx ?? '')),
    resourceKeys: (p?.coveredResources ?? []).map((c: any) => String(c?.extractedResourceIdx ?? ''))
  }));
}

/**
 * Names of everyone the wish was already offered from inside — an outside
 * card naming one of them is a duplicate, not a gap filler.
 */
export function internalNamesOf(enrichment: Partial<WishEnrichment> | null | undefined, extra: string[] = []): string[] {
  const e = enrichment ?? {};
  return [
    ...(e.products ?? []).flatMap((p) => [p.name, p.projectName ?? '']),
    ...(e.people ?? []).flatMap((p) => [p.username, ...(p.projects ?? [])]),
    ...(e.resources ?? []).flatMap((r) => [r.name, r.project ?? '']),
    ...extra
  ].filter((n): n is string => typeof n === 'string' && n.trim().length >= 3);
}

/** What /concierge/[id] renders for the "מהרשת" sections. */
export interface ExternalPanel {
  enabled: boolean;
  /** Coverage of every row that is not covered, by row key (`m:2`). */
  gaps: Record<string, Exclude<Coverage, 'covered'>>;
  /** Fresh, not dismissed, still on their row. */
  offers: ExternalOffer[];
  fetchedAt: string | null;
  /** A run exists but is older than the TTL — offers hidden, offer to search again. */
  stale: boolean;
  /** Never searched for this wish. */
  never: boolean;
}

export const DISABLED_PANEL: ExternalPanel = {
  enabled: false,
  gaps: {},
  offers: [],
  fetchedAt: null,
  stale: false,
  never: true
};

export function externalPanel(input: {
  enabled: boolean;
  ttlHours: number;
  needs: CoverageNeed[];
  enrichment: Partial<WishEnrichment> | null | undefined;
  proposals: CoverageProposal[];
  place: WishPlace | null;
  aiMetaExternal: unknown;
  now?: Date;
}): ExternalPanel {
  if (!input.enabled) return DISABLED_PANEL;
  const now = input.now ?? new Date();
  const gaps: ExternalPanel['gaps'] = {};
  for (const c of detectGaps(input.needs, input.enrichment, input.proposals, input.place)) {
    if (c.coverage !== 'covered') gaps[c.key] = c.coverage;
  }
  const cache = readCache(input.aiMetaExternal);
  const rows = input.needs.map((n) => ({ key: needKey(n.kind, n.idx), name: n.name }));
  const offers = visibleOffers(cache, rows, input.ttlHours, now).filter((o) => o.matchedNeed.key in gaps);
  return {
    enabled: true,
    gaps,
    offers,
    fetchedAt: cache?.fetchedAt ?? null,
    stale: !!cache && ageHours(cache, now) > input.ttlHours,
    never: !cache
  };
}
