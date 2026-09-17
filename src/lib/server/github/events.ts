/**
 * GitHub webhook deliveries → what the rikma should do about them. Pure.
 *
 * S2 acts on the App's own lifecycle: repositories removed from an
 * installation, and the installation being suspended or deleted. S3 adds
 * issues — only the ones labelled for the rikma (issues.ts). S4 adds merged
 * pull requests and reviews, as work the member who did it may claim
 * (pullEvents.ts). Everything else is acknowledged and ignored — GitHub
 * retries failed deliveries, so "ignored" must still answer 2xx.
 *
 * A new installation (`installation.created`) is deliberately not acted on
 * here: the webhook cannot tell which rikma it is for. That link is made in
 * the install callback, where a signed-in member started the flow.
 */

import { toRepoRow, type RepoRowInput, type RepoStatus } from './repos.js';
import { classifyIssueEvent, type IssueEvent } from './issues.js';
import { classifyPullEvent, type ClaimableWork } from './pullEvents.js';

export type WebhookIntent =
  | { type: 'ping' }
  | { type: 'installationStatus'; installationId: string; status: RepoStatus }
  | { type: 'reposAdded'; installationId: string; repos: RepoRowInput[] }
  | { type: 'reposRemoved'; installationId: string; repoIds: string[] }
  | { type: 'issueTask'; issue: IssueEvent }
  | { type: 'issueClosed'; issue: IssueEvent }
  | { type: 'claimableWork'; work: ClaimableWork }
  | { type: 'ignored'; reason: string };

const INSTALLATION_STATUS: Record<string, RepoStatus> = {
  deleted: 'removed',
  suspend: 'suspended',
  unsuspend: 'active'
};

export function classifyWebhook(event: string | null | undefined, payload: any): WebhookIntent {
  if (event === 'ping') return { type: 'ping' };

  const installationId = payload?.installation?.id != null ? String(payload.installation.id) : null;
  const action = String(payload?.action ?? '');

  if (event === 'installation') {
    const status = INSTALLATION_STATUS[action];
    if (!installationId) return { type: 'ignored', reason: 'installation event without an id' };
    if (status) return { type: 'installationStatus', installationId, status };
    return { type: 'ignored', reason: `installation.${action} — rikmas connect through the install callback` };
  }

  if (event === 'installation_repositories') {
    if (!installationId) return { type: 'ignored', reason: 'installation_repositories without an id' };
    if (action === 'added') {
      const repos = (payload.repositories_added ?? [])
        .map(toRepoRow)
        .filter((r: RepoRowInput | null): r is RepoRowInput => r !== null);
      return { type: 'reposAdded', installationId, repos };
    }
    if (action === 'removed') {
      const repoIds = (payload.repositories_removed ?? [])
        .map((r: any) => (r?.id != null ? String(r.id) : null))
        .filter(Boolean) as string[];
      return { type: 'reposRemoved', installationId, repoIds };
    }
  }

  if (event === 'issues') return classifyIssueEvent(payload);
  if (event === 'pull_request' || event === 'pull_request_review') return classifyPullEvent(event, payload);

  return { type: 'ignored', reason: `${event ?? 'unknown'} is not handled` };
}
