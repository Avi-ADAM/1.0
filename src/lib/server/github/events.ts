/**
 * GitHub webhook deliveries → what the rikma should do about them. Pure.
 *
 * S2 acts only on the App's own lifecycle: repositories added to or removed
 * from an installation, and the installation being suspended or deleted.
 * Issues, pull requests and reviews are acknowledged and ignored until S3/S4
 * give them somewhere to go — GitHub retries failed deliveries, so "ignored"
 * must still answer 2xx.
 *
 * A new installation (`installation.created`) is deliberately not acted on
 * here: the webhook cannot tell which rikma it is for. That link is made in
 * the install callback, where a signed-in member started the flow.
 */

import { toRepoRow, type RepoRowInput, type RepoStatus } from './repos.js';

export type WebhookIntent =
  | { type: 'ping' }
  | { type: 'installationStatus'; installationId: string; status: RepoStatus }
  | { type: 'reposAdded'; installationId: string; repos: RepoRowInput[] }
  | { type: 'reposRemoved'; installationId: string; repoIds: string[] }
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

  return { type: 'ignored', reason: `${event ?? 'unknown'} is not handled yet (PLAN_CODE_RIKMA S3/S4)` };
}
