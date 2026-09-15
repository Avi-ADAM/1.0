/**
 * A connected repository's recent issues and pull requests, as the timer's
 * save dialog offers them (PLAN_CODE_RIKMA §4.2). Pure.
 *
 * The member picks the item they worked on and its canonical URL is stored
 * with the timer's other links, so the hours and the code point at each other
 * without a new column. GitHub's `/repos/{o}/{r}/issues` listing returns pull
 * requests too — they carry a `pull_request` object — which is why one call
 * per repository is enough.
 */

import { githubRefUrl, type GithubRefKind } from '$lib/github/refs.js';

export type WorkItemState = 'open' | 'closed' | 'merged';

export interface WorkItem {
  kind: GithubRefKind;
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  state: WorkItemState;
  author: string | null;
  updatedAt: string;
}

const TITLE_MAX = 200;

/** One entry of GitHub's issues listing → a work item, or `null` when malformed. */
export function toWorkItem(json: any, repo: { owner: string; name: string }): WorkItem | null {
  const number = Number(json?.number);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const pr = json.pull_request;
  const kind: GithubRefKind = pr ? 'pull' : 'issue';
  const state: WorkItemState = pr?.merged_at ? 'merged' : json.state === 'closed' ? 'closed' : 'open';
  const title = String(json.title ?? '').trim().slice(0, TITLE_MAX);
  return {
    kind,
    owner: repo.owner,
    repo: repo.name,
    number,
    title,
    // Built, not copied from `html_url`: the stored link must be the one
    // canonical spelling `parseGithubRef` round-trips.
    url: githubRefUrl({ owner: repo.owner, repo: repo.name, kind, number }),
    state,
    author: json.user?.login ? String(json.user.login) : null,
    updatedAt: String(json.updated_at ?? '')
  };
}

/** Most recently touched first — what someone just worked on is near the top. */
export function rankWorkItems(items: WorkItem[], limit = 80): WorkItem[] {
  return [...items]
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0))
    .slice(0, limit);
}

/**
 * The dialog's search: a title fragment, `#12` / `12`, or `repo#12`.
 * Case-insensitive; an empty query keeps everything.
 */
export function matchesWorkItem(item: Pick<WorkItem, 'repo' | 'number' | 'title'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // A repository prefix needs its `#`: without it `42` would read as repo "4", number 2.
  const num = /^(?:([\w.-]+)#|#)?(\d+)$/.exec(q);
  if (num) {
    return String(item.number) === num[2] && (!num[1] || item.repo.toLowerCase() === num[1]);
  }
  return item.title.toLowerCase().includes(q) || item.repo.toLowerCase().includes(q);
}
