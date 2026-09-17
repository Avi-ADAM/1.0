/**
 * The code tab's list of GitHub work and who may claim it (PLAN_CODE_RIKMA
 * S4 + S5, §4.5). Pure — the endpoint does the fetching.
 *
 * One row per unit of claimable work: a merged PR for its author, and a
 * counted review for each reviewer. Each row says whose it is in 1lev1 terms:
 *  - a linked **member** — they can claim it (the viewer, from this row);
 *  - a linked account that is **not a member** — they are invited to join;
 *  - an **unlinked** GitHub login — the contribution "waits for them" (§3.2)
 *    until they link an account.
 * `loggedHours` is what that member already has on timers tagged with the PR
 * or an issue it closes, and `claimed` whether they already filed a claim for
 * this very row — both so the same work is not filed twice.
 */

import { loggedHoursFor, pullWorkRefs, type ContributionKind, type LoggedTimer, type MergedPull, type PullReview } from './pulls.js';

export type ContributorStatus = 'member' | 'linked' | 'unlinked';

export interface Contribution {
  kind: ContributionKind;
  url: string;
  owner: string;
  repo: string;
  number: number;
  title: string;
  at: string;
  githubLogin: string | null;
  status: ContributorStatus;
  userId: string | null;
  username: string | null;
  isMe: boolean;
  loggedHours: number;
  claimed: boolean;
  suggestedHours: number | null;
}

export interface ContributionInputs {
  pulls: { pull: MergedPull; reviews: PullReview[] }[];
  usersByGithubId: Map<string, { id: string; username: string | null }>;
  memberIds: Set<string>;
  viewerId: string;
  timers: LoggedTimer[];
  /** `${userId}|${kind}|${url}` for every claim already filed. */
  claimedKeys: Set<string>;
  suggest: (kind: ContributionKind, pull: MergedPull) => number | null;
}

export const claimKey = (userId: string, kind: ContributionKind, url: string) => `${userId}|${kind}|${url}`;

export function buildContributions(inp: ContributionInputs): Contribution[] {
  const rows: Contribution[] = [];
  const add = (kind: ContributionKind, pull: MergedPull, githubId: string | null, login: string | null, at: string) => {
    const user = githubId ? inp.usersByGithubId.get(githubId) : undefined;
    const userId = user?.id ?? null;
    const status: ContributorStatus = !userId ? 'unlinked' : inp.memberIds.has(userId) ? 'member' : 'linked';
    rows.push({
      kind,
      url: pull.url,
      owner: pull.owner,
      repo: pull.repo,
      number: pull.number,
      title: pull.title,
      at,
      githubLogin: login,
      status,
      userId,
      username: user?.username ?? null,
      isMe: !!userId && userId === inp.viewerId,
      loggedHours: userId ? loggedHoursFor(pullWorkRefs(pull), userId, inp.timers) : 0,
      claimed: !!userId && inp.claimedKeys.has(claimKey(userId, kind, pull.url)),
      suggestedHours: inp.suggest(kind, pull)
    });
  };

  for (const { pull, reviews } of inp.pulls) {
    if (!pull.authorIsBot) add('pull', pull, pull.authorId, pull.authorLogin, pull.mergedAt);
    for (const r of reviews) add('review', pull, r.reviewerId, r.reviewerLogin, r.submittedAt || pull.mergedAt);
  }

  return rows.sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));
}
