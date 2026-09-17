/**
 * GitHub connection actions (PLAN_CODE_RIKMA S2 — §3.1, §3.2).
 *
 * Two kinds of door, on purpose:
 *
 * - **Service only** (`access: ['serviceAdmin']`): linking a GitHub identity
 *   and writing repository rows. Their inputs are facts that only GitHub can
 *   vouch for — which GitHub account this member owns, which repositories an
 *   installation holds — so they are reachable solely from the server routes
 *   that just verified them (`/api/v1/github/callback`, `/webhook`). A member
 *   who could call `linkGithubAccount` directly could claim somebody else's
 *   contributions in S5.
 * - **Member** (`user`): undoing what is theirs — unlinking their own account,
 *   and disconnecting a repository from a rikma they belong to. Disconnecting
 *   is treated like editing the rikma's GitHub link: a direct change, and it
 *   leaves the App installed on GitHub.
 *
 * Every `project-repo` read and write uses the service token — no Strapi role
 * other than the API token needs permissions on the collection.
 */

import { env } from '$env/dynamic/private';
import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { planRepoSync, toExistingRows, type RepoRowInput, type RepoStatus } from '$lib/server/github/repos.js';
import { claimGithubWork, ClaimError } from '$lib/server/github/claim.js';

const adminToken = () => (env.ADMINMONTHER ?? '').replace(/\s+/g, '').replace(/^ADMINMONTHER=/, '');

const STATUSES: RepoStatus[] = ['active', 'suspended', 'removed'];

/** Only well-formed rows reach Strapi, whatever the caller handed over. */
function cleanRepos(input: unknown): RepoRowInput[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((r: any) => r && /^\d+$/.test(String(r.repoId)) && r.owner && r.name)
    .map((r: any) => ({
      repoId: String(r.repoId),
      owner: String(r.owner),
      name: String(r.name),
      defaultBranch: r.defaultBranch ? String(r.defaultBranch) : null,
      license: r.license ? String(r.license) : null,
      isPrivate: Boolean(r.isPrivate)
    }));
}

// ─── linkGithubAccount ──────────────────────────────────────────────────────

const linkGithubAccountHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const userId = String(params.userId);
  const githubId = String(params.githubId);
  if (!/^\d+$/.test(githubId)) throw new Error('Invalid GitHub id');

  const holder = await strapi.execute('githubUserByGithubId', { githubId }, context.jwt, context.fetch);
  const holders: any[] = holder?.data?.usersPermissionsUsers?.data ?? [];
  if (holders.some((u) => String(u.id) !== userId)) {
    throw new Error('This GitHub account is already linked to another 1lev1 account');
  }

  await strapi.execute(
    'githubLinkUser',
    {
      uid: userId,
      githubId,
      githubLogin: String(params.githubLogin),
      githubLinkedAt: new Date().toISOString()
    },
    context.jwt,
    context.fetch
  );

  return { data: { githubLogin: String(params.githubLogin) }, updateStrategy: { type: 'none' } };
};

export const linkGithubAccountConfig: ActionConfig = {
  key: 'linkGithubAccount',
  description: 'Service only: record the GitHub account a member proved they own through OAuth.',
  graphqlOperation: linkGithubAccountHandler,
  paramSchema: {
    userId: { type: 'string', required: true },
    githubId: { type: 'string', required: true },
    githubLogin: { type: 'string', required: true }
  },
  access: ['serviceAdmin'],
  authRules: []
};

// ─── unlinkGithubAccount ────────────────────────────────────────────────────

const unlinkGithubAccountHandler: ActionExecutionHandler = async (_params, context, { strapi }) => {
  await strapi.execute(
    'githubLinkUser',
    { uid: String(context.userId), githubId: null, githubLogin: null, githubLinkedAt: null },
    adminToken(),
    context.fetch
  );
  return { data: { unlinked: true }, updateStrategy: { type: 'fullRefresh' } };
};

export const unlinkGithubAccountConfig: ActionConfig = {
  key: 'unlinkGithubAccount',
  description: "Remove the caller's own GitHub link. Takes no target — it can only ever be your own.",
  graphqlOperation: unlinkGithubAccountHandler,
  paramSchema: {},
  access: ['user', 'serviceAdmin'],
  authRules: [{ type: 'jwt', errorMessage: 'Must be authenticated' }]
};

// ─── syncProjectRepos ───────────────────────────────────────────────────────

const syncProjectReposHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const projectId = String(params.projectId);
  const installationId = String(params.installationId);
  const repos = cleanRepos(params.repos);
  if (repos.length === 0) {
    return { data: { created: 0, updated: 0, conflicts: [] }, updateStrategy: { type: 'none' } };
  }

  const res = await strapi.execute(
    'githubReposByRepoIds',
    { repoIds: repos.map((r) => r.repoId) },
    context.jwt,
    context.fetch
  );
  const plan = planRepoSync(projectId, repos, toExistingRows(res?.data?.projectRepos?.data ?? []));
  const connectedBy = params.connectedBy ? String(params.connectedBy) : undefined;

  for (const row of plan.create) {
    await strapi.execute(
      'githubCreateProjectRepo',
      { ...row, project: projectId, installationId, connectedBy },
      context.jwt,
      context.fetch
    );
  }
  for (const { rowId, row } of plan.update) {
    await strapi.execute(
      'githubUpdateProjectRepo',
      { id: rowId, ...row, project: projectId, installationId, status: 'active', connectedBy },
      context.jwt,
      context.fetch
    );
  }

  return {
    data: {
      created: plan.create.length,
      updated: plan.update.length,
      conflicts: plan.conflicts.map((r) => `${r.owner}/${r.name}`)
    },
    updateStrategy: { type: 'none' }
  };
};

export const syncProjectReposConfig: ActionConfig = {
  key: 'syncProjectRepos',
  description:
    'Service only: attach the repositories of a verified GitHub App installation to a rikma. Never moves a repository still connected to another rikma.',
  graphqlOperation: syncProjectReposHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    installationId: { type: 'string', required: true },
    repos: { type: 'array', required: true },
    connectedBy: { type: 'string', required: false }
  },
  access: ['serviceAdmin'],
  authRules: []
};

// ─── setGithubInstallationStatus ────────────────────────────────────────────

const setGithubInstallationStatusHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const status = params.status as RepoStatus;
  if (!STATUSES.includes(status)) throw new Error(`Unknown repo status: ${params.status}`);
  const only = Array.isArray(params.repoIds) ? new Set(params.repoIds.map(String)) : null;

  const res = await strapi.execute(
    'githubReposByInstallation',
    { installationId: String(params.installationId) },
    context.jwt,
    context.fetch
  );
  const rows = toExistingRows(res?.data?.projectRepos?.data ?? []).filter((r) => {
    if (only && !only.has(r.repoId)) return false;
    if (r.status === 'removed') return false; // a removed connection is not revived by GitHub
    return r.status !== status;
  });

  for (const r of rows) {
    await strapi.execute('githubUpdateProjectRepo', { id: r.id, status }, context.jwt, context.fetch);
  }
  return { data: { changed: rows.length }, updateStrategy: { type: 'none' } };
};

export const setGithubInstallationStatusConfig: ActionConfig = {
  key: 'setGithubInstallationStatus',
  description: "Service only: mirror GitHub's installation lifecycle (suspend, unsuspend, delete, repos removed).",
  graphqlOperation: setGithubInstallationStatusHandler,
  paramSchema: {
    installationId: { type: 'string', required: true },
    status: { type: 'string', required: true },
    repoIds: { type: 'array', required: false }
  },
  access: ['serviceAdmin'],
  authRules: []
};

// ─── disconnectProjectRepo ──────────────────────────────────────────────────

const disconnectProjectRepoHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const token = adminToken();
  const res = await strapi.execute('githubProjectRepoById', { id: String(params.repoRowId) }, token, context.fetch);
  const row = res?.data?.projectRepo?.data;
  // The row must belong to the rikma whose membership authRules just checked.
  if (!row || String(row.attributes?.project?.data?.id) !== String(params.projectId)) {
    throw new Error('Repository not found in this rikma');
  }
  await strapi.execute('githubUpdateProjectRepo', { id: String(row.id), status: 'removed' }, token, context.fetch);
  return { data: { id: String(row.id), status: 'removed' }, updateStrategy: { type: 'fullRefresh' } };
};

export const disconnectProjectRepoConfig: ActionConfig = {
  key: 'disconnectProjectRepo',
  description: 'Disconnect a repository from a rikma. The GitHub App installation itself is left in place.',
  graphqlOperation: disconnectProjectRepoHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    repoRowId: { type: 'string', required: true }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma'
    }
  ],
  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'מאגר קוד נותק', en: 'Code repository disconnected' },
      body: { he: 'חבר ברקמה ניתק מאגר קוד מהרקמה', en: 'A member disconnected a code repository from the rikma' }
    },
    channels: ['socket'],
    metadata: { type: 'base', url: 'moach' }
  }
};

// ─── githubIssueClosed (S3) ─────────────────────────────────────────────────

/**
 * Nothing is written: this action exists for its notification. Closing an
 * issue is a maintainer's decision on GitHub; whether the task counts as done
 * is the rikma's, so the task is left open and the people it concerns are
 * told. Called only from the signed webhook, after it found the task.
 */
const githubIssueClosedHandler: ActionExecutionHandler = async (params) => {
  return { data: { taskId: String(params.taskId) }, updateStrategy: { type: 'none' } };
};

export const githubIssueClosedConfig: ActionConfig = {
  key: 'githubIssueClosed',
  description:
    'Service only: tell a rikma that the GitHub issue behind one of its tasks was closed. Suggests marking the task done; never closes it.',
  graphqlOperation: githubIssueClosedHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    taskId: { type: 'string', required: true },
    taskName: { type: 'string', required: true },
    issueUrl: { type: 'string', required: false },
    notifyUserIds: { type: 'array', required: false }
  },
  access: ['serviceAdmin'],
  authRules: [],
  notification: {
    // The task's assignee; with nobody assigned, the rule falls back to the
    // rikma's members.
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'notifyUserIds', projectIdParam: 'projectId', excludeSender: false }
    },
    templates: {
      title: { he: 'ה-issue נסגר ב-GitHub', en: 'Issue closed on GitHub' },
      body: {
        he: 'ה-issue של המטלה "{{taskName}}" נסגר. אם העבודה הושלמה, אפשר לסמן את המטלה כבוצעה.',
        en: 'The issue behind "{{taskName}}" was closed. If the work is finished, the task can be marked done.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', url: '/lev?project={{projectId}}' }
  }
};

// ─── githubWorkClaimable (S4) ───────────────────────────────────────────────

/**
 * Nothing is written: a merged PR or a review is the occasion for a claim, not
 * a claim. The member who did the work is told it can be claimed from the
 * rikma's code tab. Called only from the signed webhook, after it matched the
 * GitHub account to a linked member of the rikma.
 */
const githubWorkClaimableHandler: ActionExecutionHandler = async (params) => {
  return { data: { url: String(params.url ?? '') }, updateStrategy: { type: 'none' } };
};

export const githubWorkClaimableConfig: ActionConfig = {
  key: 'githubWorkClaimable',
  description:
    'Service only: tell a member that a PR they merged, or a review they gave, can be claimed as hours in the rikma. Files nothing.',
  graphqlOperation: githubWorkClaimableHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    kind: { type: 'string', required: true },
    label: { type: 'string', required: true },
    title: { type: 'string', required: false },
    url: { type: 'string', required: false },
    notifyUserIds: { type: 'array', required: true }
  },
  access: ['serviceAdmin'],
  authRules: [],
  notification: {
    recipients: {
      type: 'specificUsers',
      config: { userIdsParam: 'notifyUserIds', projectIdParam: 'projectId', excludeSender: false }
    },
    templates: {
      title: { he: 'עבודה ב-GitHub שאפשר לתבוע', en: 'GitHub work you can claim' },
      body: {
        he: 'העבודה שלך על {{label}} אפשר להגיש כשעות לאישור הרקמה, מלשונית הקוד.',
        en: 'Your work on {{label}} can be filed as hours for the rikma to approve, from the code tab.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', url: '/moach/{{projectId}}/code' }
  }
};

// ─── claimGithubWork (S4) ───────────────────────────────────────────────────

const claimGithubWorkHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  try {
    const result = await claimGithubWork(
      {
        projectId: String(params.projectId),
        missionId: String(params.missionId),
        url: String(params.url),
        kind: params.kind === 'review' ? 'review' : 'pull',
        hours: Number(params.hours),
        note: String(params.note ?? '')
      },
      { userId: String(context.userId), jwt: context.jwt, fetch: context.fetch as typeof fetch },
      strapi as any
    );
    return { data: result, updateStrategy: { type: 'none' } };
  } catch (e) {
    // The code is what the tab translates; the message is only for the log.
    if (e instanceof ClaimError) throw new Error(`claimGithubWork:${e.code}`);
    throw e;
  }
};

export const claimGithubWorkConfig: ActionConfig = {
  key: 'claimGithubWork',
  description:
    'Claim hours for a merged PR you wrote, or a review you gave, on one of your missions in the rikma. Verified against GitHub, filed through the same approval as timer hours.',
  graphqlOperation: claimGithubWorkHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    missionId: { type: 'string', required: true },
    url: { type: 'string', required: true, description: 'Canonical GitHub pull request URL' },
    kind: { type: 'string', required: true, description: "'pull' (author) or 'review' (reviewer)" },
    hours: { type: 'number', required: true },
    note: { type: 'string', required: false }
  },
  access: ['user', 'serviceAdmin'],
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the rikma'
    }
  ],
  notification: {
    recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
    templates: {
      title: { he: 'שעות על עבודת קוד ממתינות לאישור', en: 'Hours for code work await approval' },
      body: {
        he: 'חבר ברקמה הגיש שעות על PR או review ב-GitHub. אפשר לאשר, לשוחח או להציע נגדית.',
        en: 'A member filed hours for a GitHub PR or review. You can approve, discuss or counter.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { priority: 'normal', url: '/lev?project={{projectId}}' }
  }
};
