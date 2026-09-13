/**
 * The digest payload — PLAN_DAILY_DIGEST §4.6.
 *
 * One structure, two readers: the hub renders it through `$t()` for whoever
 * is looking, the delivery channels (mail/telegram/push, phase 4) render it in
 * the *recipient's* language on the server. So this carries numbers, items and
 * links only — no sentences. Wording belongs to the renderer; a payload with
 * Hebrew baked into it could not be both.
 *
 * Pure.
 */

import type { HubFeedItem, HubSummary } from './hubSummary.js';
import type { SuggestionItem, SuggestionSummary } from './suggestions.js';
import type { WhatsNewSummary } from './whatsNew.js';
import type { DormantSoonItem, TaskItem, WorkSummary } from './work.js';

/** How many vote lines the digest carries (the hub's topFive). */
export const MAX_VOTE_ITEMS = 5;

export type DigestLang = 'he' | 'en' | 'ar';

export interface DigestVoteItem {
  id: string;
  /** The lev card `ani` — also the `?focus=` value of the deep link. */
  kind: string;
  title: string;
  projectId: string;
  projectName: string;
  deadline: string | null;
  urgent: boolean;
  url: string;
}

export interface DigestPayload {
  userId: string;
  username: string;
  lang: DigestLang;
  generatedAt: string;
  /** Nothing at all to say — an empty digest is never sent (§5.1 rule 1). */
  isEmpty: boolean;
  sections: {
    votes: { count: number; urgent: number; items: DigestVoteItem[] };
    missions: WorkSummary['missions'] & { dormantSoon: (DormantSoonItem & { url: string })[] };
    tasks: Omit<WorkSummary['tasks'], 'items'> & { items: (TaskItem & { url: string })[] };
    whatsNew: WhatsNewSummary;
    suggestions: Omit<SuggestionSummary, 'top'> & { top: (SuggestionItem & { url: string })[] };
  };
}

/**
 * The flat snapshot stored as `user-digest.lastCounts` and compared the next
 * morning (§5.1 rule 4). `urgentKeys` is what lets "the same 3 votes, but one
 * of them turned urgent overnight" count as a change.
 */
export interface DigestCounts {
  votes: number;
  urgent: number;
  missions: number;
  dormantSoon: number;
  tasksOpen: number;
  overdue: number;
  dueSoon: number;
  suggestions: number;
  freshSuggestions: number;
  whatsNew: number;
  urgentKeys: string[];
}

export interface ComposeInput {
  userId: string;
  lang?: string | null;
  hub: HubSummary;
  work: WorkSummary;
  suggestions: SuggestionSummary;
  whatsNew: WhatsNewSummary;
  now?: number;
}

export function normalizeLang(lang: string | null | undefined): DigestLang {
  return lang === 'en' || lang === 'ar' ? lang : 'he';
}

const withProject = (path: string, projectId: string) =>
  projectId ? `${path}&project=${encodeURIComponent(projectId)}` : path;

/** Deep link for one vote-awaiting item — the same one the hub feed uses. */
export function voteUrl(item: Pick<HubFeedItem, 'type' | 'projectId'>): string {
  return withProject(`/lev?focus=${encodeURIComponent(item.type)}`, item.projectId);
}

export function composeDigest(input: ComposeInput): DigestPayload {
  const now = input.now ?? Date.now();
  const { hub, work, suggestions, whatsNew } = input;

  const votes = {
    count: hub.kpi.votes,
    urgent: hub.kpi.urgent,
    items: hub.feed.slice(0, MAX_VOTE_ITEMS).map((f) => ({
      id: f.id,
      kind: f.type,
      title: f.title,
      projectId: f.projectId,
      projectName: f.projectName,
      deadline: f.deadline,
      urgent: f.urgent,
      url: voteUrl(f)
    }))
  };

  const missions = {
    ...work.missions,
    dormantSoon: work.missions.dormantSoon.map((m) => ({
      ...m,
      url: withProject('/lev?focus=mtaha', m.projectId)
    }))
  };

  const tasks = {
    ...work.tasks,
    items: work.tasks.items.map((t) => ({ ...t, url: '/myacts' }))
  };

  const top = suggestions.top.map((s) => ({
    ...s,
    url: s.kind === 'mission' ? '/lev?focus=meData' : '/lev?focus=huca'
  }));

  const isEmpty =
    votes.count === 0 &&
    missions.active === 0 &&
    tasks.open === 0 &&
    whatsNew.total === 0 &&
    suggestions.count === 0;

  return {
    userId: String(input.userId),
    username: hub.username,
    lang: normalizeLang(input.lang),
    generatedAt: new Date(now).toISOString(),
    isEmpty,
    sections: {
      votes,
      missions,
      tasks,
      whatsNew,
      suggestions: { count: suggestions.count, fresh: suggestions.fresh, top }
    }
  };
}

/**
 * The snapshot for `lastCounts`. Urgent keys are taken from the full feed,
 * not only the items the digest shows — an urgent vote at position 6 is still
 * a vote that turned urgent.
 */
export function digestCounts(payload: DigestPayload, hub?: HubSummary): DigestCounts {
  const s = payload.sections;
  const feed = hub?.feed ?? s.votes.items.map((v) => ({ type: v.kind, id: v.id, urgent: v.urgent }));
  return {
    votes: s.votes.count,
    urgent: s.votes.urgent,
    missions: s.missions.active,
    dormantSoon: s.missions.dormantSoon.length,
    tasksOpen: s.tasks.open,
    overdue: s.tasks.overdue,
    dueSoon: s.tasks.dueSoon,
    suggestions: s.suggestions.count,
    freshSuggestions: s.suggestions.fresh,
    whatsNew: s.whatsNew.total,
    urgentKeys: feed
      .filter((f) => f.urgent)
      .map((f) => `${f.type}:${f.id}`)
      .sort()
  };
}
