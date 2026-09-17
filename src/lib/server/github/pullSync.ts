/**
 * Merged PRs and reviews → a message to the member who did the work
 * (PLAN_CODE_RIKMA S4). The I/O around pullEvents.ts; called only from the
 * signed webhook.
 *
 * Nothing is filed here. The member is told the work can be claimed, and the
 * claim — hours they state, on a mission they choose — is made from the code
 * tab through `claimGithubWork`, which re-checks everything against GitHub.
 * A contributor who is not a linked member is not messaged anywhere: their
 * contribution waits in the code tab until they link and join (S5).
 */

import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { githubRefLabel } from '$lib/github/refs.js';
import { adminToken, serviceContext } from './service.js';
import { isLiveConnection, toConnectedRepo } from './issues.js';
import type { ClaimableWork } from './pullEvents.js';

type Fetch = typeof globalThis.fetch;

export type ClaimableOutcome = 'notConnected' | 'notLinked' | 'notMember' | 'notified';

export async function notifyClaimableWork(
  work: ClaimableWork,
  fetchFn: Fetch
): Promise<{ outcome: ClaimableOutcome }> {
  const repoRes = await strapiClient.execute('githubRepoByRepoId', { repoId: work.repoId }, adminToken(), fetchFn);
  const repo = toConnectedRepo(repoRes);
  if (!isLiveConnection(repo, work.installationId)) return { outcome: 'notConnected' };

  const [usersRes, membersRes] = await Promise.all([
    strapiClient.execute('githubUsersByGithubIds', { githubIds: [work.workerGithubId] }, adminToken(), fetchFn),
    strapiClient.execute('githubProjectMembers', { pid: repo.projectId }, adminToken(), fetchFn)
  ]);
  const userId = usersRes?.data?.usersPermissionsUsers?.data?.[0]?.id;
  if (userId == null) return { outcome: 'notLinked' };
  const members: any[] = membersRes?.data?.project?.data?.attributes?.user_1s?.data ?? [];
  if (!members.some((m) => String(m.id) === String(userId))) return { outcome: 'notMember' };

  const res = await actionService.executeAction(
    'githubWorkClaimable',
    {
      projectId: repo.projectId,
      kind: work.kind,
      label: githubRefLabel({ owner: work.pull.owner, repo: work.pull.repo, kind: 'pull', number: work.pull.number }),
      title: work.pull.title || '',
      url: work.pull.url,
      notifyUserIds: [String(userId)]
    },
    serviceContext('0', fetchFn)
  );
  if (!res.success) {
    throw new Error(`githubWorkClaimable failed: ${res.error?.message ?? res.error?.code ?? 'unknown error'}`);
  }
  return { outcome: 'notified' };
}
