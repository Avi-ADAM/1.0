/**
 * Issue deliveries → rikma tasks (PLAN_CODE_RIKMA S3). The I/O around the pure
 * rules in issues.ts; called only from the signed webhook.
 *
 * Every write goes through an action: the task itself through `createTask` —
 * the same choke point as the in-app flow and the External Tasks API, so the
 * assignee's consent and the notifications come with it — and the "issue was
 * closed" message through the service-only `githubIssueClosed`.
 */

import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { githubIssueExternalId } from '$lib/github/refs.js';
import { adminToken, serviceContext } from './service.js';
import {
  chooseIssueAssignee,
  chooseIssueCreator,
  isLiveConnection,
  issueTaskParams,
  toConnectedRepo,
  type ConnectedRepo,
  type IssueEvent
} from './issues.js';

type Fetch = typeof globalThis.fetch;

export type IssueSyncOutcome =
  | 'created'
  | 'exists'
  | 'notConnected'
  | 'noCreator'
  | 'noTask'
  | 'alreadyDone'
  | 'notified';

export interface IssueSyncResult {
  outcome: IssueSyncOutcome;
  taskId?: string;
}

async function liveRepo(issue: IssueEvent, fetchFn: Fetch): Promise<ConnectedRepo | null> {
  const res = await strapiClient.execute('githubRepoByRepoId', { repoId: issue.repoId }, adminToken(), fetchFn);
  const row = toConnectedRepo(res);
  return isLiveConnection(row, issue.installationId) ? row : null;
}

async function findTask(projectId: string, issue: IssueEvent, fetchFn: Fetch): Promise<any | null> {
  const res = await strapiClient.execute(
    'tasksApiActByExternalId',
    { pid: projectId, externalId: githubIssueExternalId(issue.repoId, issue.number) },
    adminToken(),
    fetchFn
  );
  return res?.data?.acts?.data?.[0] ?? null;
}

/**
 * GitHub sends `opened` and `labeled` together for an issue created with the
 * label already on it, and both arrive within milliseconds. The lookup-then-
 * create below is not atomic, so without this the rikma would get the same
 * task twice. The API runs as one instance, which is what makes an in-memory
 * lock enough.
 */
const inflight = new Map<string, Promise<IssueSyncResult>>();

export function syncIssueTask(issue: IssueEvent, fetchFn: Fetch): Promise<IssueSyncResult> {
  const key = githubIssueExternalId(issue.repoId, issue.number);
  const running = inflight.get(key);
  if (running) return running;
  const job = openIssueTask(issue, fetchFn).finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

async function openIssueTask(issue: IssueEvent, fetchFn: Fetch): Promise<IssueSyncResult> {
  const repo = await liveRepo(issue, fetchFn);
  if (!repo) return { outcome: 'notConnected' };

  const existing = await findTask(repo.projectId, issue, fetchFn);
  if (existing?.id) return { outcome: 'exists', taskId: String(existing.id) };

  const githubIds = [...new Set([issue.authorGithubId, ...issue.assigneeGithubIds].filter(Boolean) as string[])];
  const [membersRes, usersRes] = await Promise.all([
    strapiClient.execute('githubProjectMembers', { pid: repo.projectId }, adminToken(), fetchFn),
    githubIds.length
      ? strapiClient.execute('githubUsersByGithubIds', { githubIds }, adminToken(), fetchFn)
      : Promise.resolve(null)
  ]);
  const memberIds = new Set<string>(
    (membersRes?.data?.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id))
  );
  const userByGithubId = new Map<string, string>(
    (usersRes?.data?.usersPermissionsUsers?.data ?? []).map((u: any) => [String(u.attributes?.githubId), String(u.id)])
  );
  const linked = (githubId: string | null) => (githubId ? (userByGithubId.get(githubId) ?? null) : null);

  const creator = chooseIssueCreator({
    authorUserId: linked(issue.authorGithubId),
    connectedById: repo.connectedById,
    memberIds
  });
  // Nobody in the rikma to record it as coming from — the member who connected
  // the repository has left. Better no task than one attributed to a stranger.
  if (!creator) return { outcome: 'noCreator' };

  const assignedUserId = chooseIssueAssignee(issue.assigneeGithubIds.map(linked), memberIds);
  const res = await actionService.executeAction(
    'createTask',
    issueTaskParams(issue, { projectId: repo.projectId, assignedUserId }),
    serviceContext(creator, fetchFn)
  );
  if (!res.success) {
    throw new Error(`createTask failed: ${res.error?.message ?? res.error?.code ?? 'unknown error'}`);
  }
  const taskId = (res.data as any)?.id;
  return { outcome: 'created', taskId: taskId != null ? String(taskId) : undefined };
}

/**
 * The issue was closed on GitHub. The task is not closed for the rikma — the
 * assignee (or, with nobody assigned, the rikma) is told, and marking it done
 * stays a member's act in 1lev1.
 */
export async function notifyIssueClosed(issue: IssueEvent, fetchFn: Fetch): Promise<IssueSyncResult> {
  const repo = await liveRepo(issue, fetchFn);
  if (!repo) return { outcome: 'notConnected' };

  const task = await findTask(repo.projectId, issue, fetchFn);
  if (!task?.id) return { outcome: 'noTask' };
  const taskId = String(task.id);
  if (task.attributes?.naasa) return { outcome: 'alreadyDone', taskId };

  const res = await actionService.executeAction(
    'githubIssueClosed',
    {
      projectId: repo.projectId,
      taskId,
      taskName: String(task.attributes?.shem ?? issue.title),
      issueUrl: issue.url,
      // Empty ⇒ the notification falls back to the rikma's members.
      notifyUserIds: (task.attributes?.my?.data ?? []).map((u: any) => String(u.id))
    },
    serviceContext('0', fetchFn)
  );
  if (!res.success) {
    throw new Error(`githubIssueClosed failed: ${res.error?.message ?? res.error?.code ?? 'unknown error'}`);
  }
  return { outcome: 'notified', taskId };
}
