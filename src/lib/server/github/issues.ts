/**
 * GitHub issues → rikma tasks (PLAN_CODE_RIKMA S3, §4.1). Pure.
 *
 * **Opt-in by label, not every issue.** A connected repository can hold
 * hundreds of issues, and `createTask` notifies the whole rikma on every
 * channel for a task nobody is assigned to. So an issue becomes a task only
 * once someone puts the `1lev1` label on it — the same "a person chose this"
 * rule that makes a repository join a rikma only when a member picks it.
 *
 * What happens after that:
 *  - labelled (on open, reopen, or later) → an Act, once. The external id
 *    (`gh:<repoId>#<n>`) is the idempotency key.
 *  - closed on GitHub → the rikma is *told*, and the task is not closed for
 *    it. Closing an issue is a maintainer's call on GitHub; whether the work
 *    counts as done is the rikma's, in 1lev1.
 *  - marked done in 1lev1 → a comment on the issue (issueComment.ts).
 *
 * Who the task is from: the issue's author when they are a linked member of
 * the rikma, otherwise the member who connected the repository. A linked
 * member among the issue's assignees becomes the assignee — as an *offer*
 * (`myIshur:false`), exactly like a task from the External Tasks API.
 */

import { githubIssueExternalId } from '$lib/github/refs.js';

export const ISSUE_TASK_LABEL = '1lev1';

export interface IssueEvent {
  installationId: string;
  repoId: string;
  owner: string;
  name: string;
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  authorGithubId: string | null;
  assigneeGithubIds: string[];
}

const hasTaskLabel = (labels: string[]) => labels.some((l) => l.toLowerCase() === ISSUE_TASK_LABEL);

/** An `issues` webhook payload → the fields the rikma needs, or `null`. */
export function toIssueEvent(payload: any): IssueEvent | null {
  const issue = payload?.issue;
  const repo = payload?.repository;
  const installationId = payload?.installation?.id;
  // `issues` deliveries are never pull requests, but a PR is an issue in
  // GitHub's model — refuse one defensively rather than open a task for it.
  if (!issue || issue.pull_request || !repo || installationId == null) return null;

  const number = Number(issue.number);
  const repoId = repo.id != null ? String(repo.id) : '';
  const [fullOwner, fullName] = String(repo.full_name ?? '').split('/');
  const owner = repo.owner?.login ?? fullOwner;
  const name = repo.name ?? fullName;
  if (!Number.isSafeInteger(number) || number < 1 || !/^\d+$/.test(repoId) || !owner || !name) return null;

  const idOf = (u: any) => (u?.id != null ? String(u.id) : null);
  return {
    installationId: String(installationId),
    repoId,
    owner: String(owner),
    name: String(name),
    number,
    title: String(issue.title ?? '').trim(),
    body: String(issue.body ?? ''),
    url: `https://github.com/${owner}/${name}/issues/${number}`,
    labels: (issue.labels ?? []).map((l: any) => String(typeof l === 'string' ? l : (l?.name ?? ''))),
    authorGithubId: idOf(issue.user),
    assigneeGithubIds: (issue.assignees ?? []).map(idOf).filter(Boolean) as string[]
  };
}

export type IssueIntent =
  | { type: 'issueTask'; issue: IssueEvent }
  | { type: 'issueClosed'; issue: IssueEvent }
  | { type: 'ignored'; reason: string };

export function classifyIssueEvent(payload: any): IssueIntent {
  const issue = toIssueEvent(payload);
  if (!issue) return { type: 'ignored', reason: 'issues event without a usable issue' };
  const action = String(payload?.action ?? '');

  if (action === 'closed') return { type: 'issueClosed', issue };

  if (action === 'labeled') {
    // Only the label that opts in. Every other label on every issue would
    // otherwise cost a round of Strapi reads for nothing.
    const added = String(payload?.label?.name ?? '').toLowerCase();
    return added === ISSUE_TASK_LABEL
      ? { type: 'issueTask', issue }
      : { type: 'ignored', reason: `label ${added || '?'} is not ${ISSUE_TASK_LABEL}` };
  }

  if ((action === 'opened' || action === 'reopened') && hasTaskLabel(issue.labels)) {
    return { type: 'issueTask', issue };
  }

  return { type: 'ignored', reason: `issues.${action} — only issues labelled ${ISSUE_TASK_LABEL} become tasks` };
}

/** The member the task is recorded as coming from, or `null` when there is none. */
export function chooseIssueCreator(args: {
  authorUserId: string | null;
  connectedById: string | null;
  memberIds: Set<string>;
}): string | null {
  const { authorUserId, connectedById, memberIds } = args;
  if (authorUserId && memberIds.has(authorUserId)) return authorUserId;
  if (connectedById && memberIds.has(connectedById)) return connectedById;
  return null;
}

/** The first of the issue's assignees who is a linked member of this rikma. */
export function chooseIssueAssignee(assigneeUserIds: (string | null)[], memberIds: Set<string>): string | null {
  return assigneeUserIds.find((id): id is string => !!id && memberIds.has(id)) ?? null;
}

const NAME_MAX = 200;
const DESCRIPTION_MAX = 4000;

/** The `createTask` params for an issue. `projectId` comes from the repository row. */
export function issueTaskParams(
  issue: IssueEvent,
  args: { projectId: string; assignedUserId: string | null }
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    projectId: args.projectId,
    name: (issue.title || `${issue.name}#${issue.number}`).slice(0, NAME_MAX),
    description: issue.body.slice(0, DESCRIPTION_MAX),
    link: issue.url,
    externalId: githubIssueExternalId(issue.repoId, issue.number),
    // `Act.source` knows only ui/api; the `gh:` external id is what marks
    // this one as GitHub's.
    source: 'api',
    hashivut: 'white',
    isAssigned: !!args.assignedUserId,
    myIshur: false
  };
  if (args.assignedUserId) params.assignedUserId = args.assignedUserId;
  return params;
}

/** A `project-repo` row as the issue flow reads it (qid `githubRepoByRepoId`). */
export interface ConnectedRepo {
  projectId: string;
  owner: string;
  name: string;
  installationId: string | null;
  status: string | null;
  connectedById: string | null;
}

export function toConnectedRepo(res: any): ConnectedRepo | null {
  const a = res?.data?.projectRepos?.data?.[0]?.attributes;
  const projectId = a?.project?.data?.id;
  if (!a || projectId == null || !a.owner || !a.name) return null;
  return {
    projectId: String(projectId),
    owner: String(a.owner),
    name: String(a.name),
    installationId: a.installationId ? String(a.installationId) : null,
    status: a.status ?? null,
    connectedById: a.connectedBy?.data?.id != null ? String(a.connectedBy.data.id) : null
  };
}

/**
 * Is this connection one the rikma may act on? Active (null = the column's
 * default), and — when the event names one — reached through the installation
 * the row was connected with. A repository that moved to another installation
 * has to be picked again before its issues count.
 */
export function isLiveConnection(row: ConnectedRepo | null, installationId?: string): row is ConnectedRepo {
  if (!row || !row.installationId) return false;
  if (row.status && row.status !== 'active') return false;
  return installationId === undefined || row.installationId === installationId;
}

/** What is written on the issue when its task is marked done in 1lev1. */
export const ISSUE_DONE_COMMENT =
  'This task was marked done in its rikma on [1lev1](https://www.1lev1.com). ' +
  'Closing the issue is still up to the maintainers.';
