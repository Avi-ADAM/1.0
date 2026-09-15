/**
 * A task that came from a GitHub issue was marked done in 1lev1 → say so on
 * the issue (PLAN_CODE_RIKMA S3, §4.1). Called from the mirrored-task hook
 * (webhooks/dispatch.ts), which already runs fire-and-forget after
 * `updateTask`; it must not import the action service, which imports that hook.
 *
 * The external id is only a string on a row, so the repository it names has
 * to be connected — and connected to the very rikma the task belongs to —
 * before the App writes anything to GitHub.
 */

import { parseGithubIssueExternalId } from '$lib/github/refs.js';
import { commentOnIssue } from './client.js';
import { githubAppConfig } from './config.js';
import { ISSUE_DONE_COMMENT, isLiveConnection, toConnectedRepo } from './issues.js';

interface StrapiLike {
  execute: (qid: string, vars: any, jwt: any, fetchFn: any) => Promise<any>;
}

export async function commentTaskDoneOnIssue(opts: {
  externalId: string;
  projectId: string;
  strapi: StrapiLike;
  fetch: typeof globalThis.fetch;
}): Promise<boolean> {
  const parsed = parseGithubIssueExternalId(opts.externalId);
  if (!parsed) return false;
  const cfg = githubAppConfig();
  if (!cfg) return false;

  // `undefined` jwt = the client's service-token fallback, as the hook's own reads use.
  const res = await opts.strapi.execute('githubRepoByRepoId', { repoId: parsed.repoId }, undefined, opts.fetch);
  const repo = toConnectedRepo(res);
  if (!isLiveConnection(repo) || repo.projectId !== String(opts.projectId)) return false;

  await commentOnIssue(cfg, repo.installationId!, repo, parsed.number, ISSUE_DONE_COMMENT, opts.fetch);
  return true;
}
