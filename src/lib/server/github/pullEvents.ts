/**
 * `pull_request` and `pull_request_review` deliveries → work a member may
 * claim (PLAN_CODE_RIKMA S4, §4.2). Pure.
 *
 * Nothing here files anything. A merge or a review is the *occasion* for a
 * claim, so the webhook only tells the member who did the work that it can be
 * claimed; the claim itself is theirs to make, with hours they state, and it
 * goes to the rikma for approval like any timer's hours.
 */

import { countedReviews, toMergedPull, toPull, type ContributionKind, type PullInfo } from '$lib/github/pulls.js';

export interface ClaimableWork {
  kind: ContributionKind;
  installationId: string;
  repoId: string;
  pull: PullInfo;
  /** When the work landed: the merge, or the review's submission. Claimed hours end here. */
  at: string;
  /** The GitHub account that did the work: the author for a PR, the reviewer for a review. */
  workerGithubId: string;
}

export type PullIntent = { type: 'claimableWork'; work: ClaimableWork } | { type: 'ignored'; reason: string };

function repoOf(payload: any): { repoId: string; owner: string; name: string } | null {
  const repo = payload?.repository;
  const repoId = repo?.id != null ? String(repo.id) : '';
  const [fullOwner, fullName] = String(repo?.full_name ?? '').split('/');
  const owner = repo?.owner?.login ?? fullOwner;
  const name = repo?.name ?? fullName;
  if (!/^\d+$/.test(repoId) || !owner || !name) return null;
  return { repoId, owner: String(owner), name: String(name) };
}

export function classifyPullEvent(event: string, payload: any): PullIntent {
  const installationId = payload?.installation?.id != null ? String(payload.installation.id) : null;
  const repo = repoOf(payload);
  const action = String(payload?.action ?? '');
  if (!installationId || !repo) return { type: 'ignored', reason: `${event} without a repository` };

  if (event === 'pull_request') {
    if (action !== 'closed') return { type: 'ignored', reason: `pull_request.${action}` };
    const pull = toMergedPull(payload.pull_request, repo);
    if (!pull) return { type: 'ignored', reason: 'closed without merging' };
    if (pull.authorIsBot || !pull.authorId) return { type: 'ignored', reason: 'merged by a bot' };
    return {
      type: 'claimableWork',
      work: { kind: 'pull', installationId, repoId: repo.repoId, pull, at: pull.mergedAt, workerGithubId: pull.authorId }
    };
  }

  if (event === 'pull_request_review') {
    if (action !== 'submitted') return { type: 'ignored', reason: `pull_request_review.${action}` };
    const pr = payload.pull_request;
    const [review] = countedReviews([payload.review], pr?.user?.id != null ? String(pr.user.id) : null);
    if (!review) return { type: 'ignored', reason: 'not an approval or a change request' };
    // A review of a PR that is still open — or is never merged — is work
    // too. The size of the PR is carried for the suggestion.
    const pull = toPull(pr, repo);
    if (!pull) return { type: 'ignored', reason: 'review without a pull request' };
    return {
      type: 'claimableWork',
      work: {
        kind: 'review',
        installationId,
        repoId: repo.repoId,
        pull,
        at: review.submittedAt || new Date().toISOString(),
        workerGithubId: review.reviewerId
      }
    };
  }

  return { type: 'ignored', reason: event };
}
