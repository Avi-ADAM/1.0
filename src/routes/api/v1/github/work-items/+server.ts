import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { githubAppConfig } from '$lib/server/github/config.js';
import { listRecentWorkItems } from '$lib/server/github/client.js';
import { adminToken, isProjectMember } from '$lib/server/github/service.js';
import { rankWorkItems, type WorkItem } from '$lib/github/workItems.js';

/**
 * GET /api/v1/github/work-items?projectId=… — the recent issues and pull
 * requests of a rikma's connected repositories, for the timer's save dialog
 * (PLAN_CODE_RIKMA §4.2). The member picks the one they worked on and its URL
 * is saved with the hours.
 *
 * Runs on the API host, where the App's private key lives; the browser's
 * `/api/*` fetch is re-pointed here with the member's cookie. Members only —
 * a connected repository may be private. A rikma with no repositories, or a
 * server with no App configured, answers an empty list and the dialog shows
 * nothing.
 */

/** Enough for any real rikma, and a bound on the GitHub calls one dialog makes. */
const MAX_REPOS = 8;

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
  const cfg = githubAppConfig();
  if (!cfg) return json({ configured: false, items: [] });
  if (!locals.uid) return json({ error: 'unauthorized' }, { status: 401 });

  const projectId = url.searchParams.get('projectId') ?? '';
  if (!/^\d+$/.test(projectId)) return json({ error: 'invalid' }, { status: 400 });
  if (!(await isProjectMember(projectId, String(locals.uid), fetch))) {
    return json({ error: 'forbidden' }, { status: 403 });
  }

  let rows: any[];
  try {
    const res = await strapiClient.execute('githubProjectRepos', { pid: projectId }, adminToken(), fetch);
    rows = res?.data?.projectRepos?.data ?? [];
  } catch (e) {
    console.error('[github/work-items] repository lookup failed:', e);
    return json({ error: 'failed' }, { status: 502 });
  }

  const repos = rows
    .map((r) => r.attributes ?? {})
    .filter((a) => a.installationId && a.owner && a.name && (!a.status || a.status === 'active'))
    .slice(0, MAX_REPOS);

  const lists = await Promise.allSettled(
    repos.map((a) =>
      listRecentWorkItems(cfg, String(a.installationId), { owner: String(a.owner), name: String(a.name) }, fetch)
    )
  );

  // One unreachable repository (suspended on GitHub, renamed) must not hide
  // the others.
  const items: WorkItem[] = [];
  for (const list of lists) {
    if (list.status === 'fulfilled') items.push(...list.value);
    else console.warn('[github/work-items] a repository could not be listed:', list.reason);
  }

  return json(
    { configured: true, repos: repos.length, items: rankWorkItems(items) },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
};
