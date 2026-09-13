/**
 * "N suggestions for missions or resources" — PLAN_DAILY_DIGEST §4.5.
 *
 * The matching engine already precomputes `match-suggestion` rows server-side
 * (PLAN_MATCH_SUGGESTIONS); this only counts them. qid `318digestSuggestions`
 * returns four aliased reads: the top 3 of each kind by score, and a
 * count-only read of the ones the user has not opened yet (`new`/`notified`).
 *
 * Pure.
 */

export const MAX_SUGGESTION_ITEMS = 3;

export interface SuggestionItem {
  id: string;
  kind: 'mission' | 'resource';
  title: string;
  projectId: string;
  projectName: string;
  score: number;
}

export interface SuggestionSummary {
  /** Live suggestions: not dismissed, not date-blocked, not already applied to. */
  count: number;
  /** Of those, the ones the user has not opened yet. */
  fresh: number;
  top: SuggestionItem[];
}

export function emptySuggestionSummary(): SuggestionSummary {
  return { count: 0, fresh: 0, top: [] };
}

function total(node: any): number {
  const n = node?.meta?.pagination?.total;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function items(node: any, kind: SuggestionItem['kind']): SuggestionItem[] {
  const rel = kind === 'mission' ? 'open_mission' : 'open_mashaabim';
  return (node?.data ?? []).flatMap((row: any) => {
    const target = row?.attributes?.[rel]?.data;
    if (!target) return [];
    const project = target.attributes?.project?.data;
    return [
      {
        id: String(row.id),
        kind,
        title: target.attributes?.name ?? '',
        projectId: project?.id != null ? String(project.id) : '',
        projectName: project?.attributes?.projectName ?? '',
        score: Number(row.attributes?.score ?? 0) || 0
      }
    ];
  });
}

export function processSuggestions(raw: any): SuggestionSummary {
  const d = raw?.data;
  if (!d) return emptySuggestionSummary();
  const top = [...items(d.missionSuggestions, 'mission'), ...items(d.resourceSuggestions, 'resource')]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTION_ITEMS);
  return {
    count: total(d.missionSuggestions) + total(d.resourceSuggestions),
    fresh: total(d.freshMissionSuggestions) + total(d.freshResourceSuggestions),
    top
  };
}
