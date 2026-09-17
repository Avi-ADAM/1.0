import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { strapiClient } from '$lib/server/actions/index.js';
import { githubAppConfig } from '$lib/server/github/config.js';
import { getPull, listMergedPulls, listPullReviews } from '$lib/server/github/client.js';
import { adminToken, isProjectMember } from '$lib/server/github/service.js';
import { parseSaveLinks } from '$lib/timers/saveLinks.js';
import {
  claimOfTimer,
  countedReviews,
  suggestClaimHours,
  toMergedPull,
  type LoggedTimer,
  type MergedPull,
  type PullReview
} from '$lib/github/pulls.js';
import { buildContributions, claimKey } from '$lib/github/contributions.js';

/**
 * GET /api/v1/github/contributions?projectId=… — the code tab's recent GitHub
 * work: merged PRs and the reviews on them, whose each one is, the hours
 * already tagged with it, and — for the viewer's own rows — the missions a
 * claim can be filed on (PLAN_CODE_RIKMA S4/S5, §4.5).
 *
 * Runs on the API host, where the App's key lives. Members only: a connected
 * repository may be private. A few repositories and a few dozen PRs are read
 * per request; the page is opened by hand, not polled.
 */

const MAX_REPOS = 8;
const PULLS_PER_REPO = 20;
/** Reviews and sizes cost a call per PR — only the most recent ones get them. */
const DETAILED_PULLS = 15;

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
  const cfg = githubAppConfig();
  if (!cfg) return json({ configured: false, contributions: [], missions: [] });
  if (!locals.uid) return json({ error: 'unauthorized' }, { status: 401 });
  const viewerId = String(locals.uid);

  const projectId = url.searchParams.get('projectId') ?? '';
  if (!/^\d+$/.test(projectId)) return json({ error: 'invalid' }, { status: 400 });
  if (!(await isProjectMember(projectId, viewerId, fetch))) {
    return json({ error: 'forbidden' }, { status: 403 });
  }

  const token = adminToken();
  let reposRes: any, membersRes: any, timersRes: any, missionsRes: any, viewerRes: any;
  try {
    [reposRes, membersRes, timersRes, missionsRes, viewerRes] = await Promise.all([
      strapiClient.execute('githubProjectRepos', { pid: projectId }, token, fetch),
      strapiClient.execute('githubProjectMembers', { pid: projectId }, token, fetch),
      strapiClient.execute('githubProjectLinkedTimers', { pid: projectId }, token, fetch),
      strapiClient.execute('githubClaimMissions', { pid: projectId, uid: viewerId }, token, fetch),
      strapiClient.execute('githubUserById', { uid: viewerId }, token, fetch)
    ]);
  } catch (e) {
    console.error('[github/contributions] Strapi lookup failed:', e);
    return json({ error: 'failed' }, { status: 502 });
  }

  const repos = (reposRes?.data?.projectRepos?.data ?? [])
    .map((r: any) => r.attributes ?? {})
    .filter((a: any) => a.installationId && a.owner && a.name && (!a.status || a.status === 'active'))
    .slice(0, MAX_REPOS);

  // Merged PRs across the repositories, newest merge first.
  const listed = await Promise.allSettled(
    repos.map(async (a: any) => {
      const repo = { owner: String(a.owner), name: String(a.name) };
      const pulls = await listMergedPulls(cfg, String(a.installationId), repo, fetch, PULLS_PER_REPO);
      return pulls.map((p) => ({ installationId: String(a.installationId), repo, pull: toMergedPull(p, repo) }));
    })
  );
  const merged: { installationId: string; repo: { owner: string; name: string }; pull: MergedPull }[] = [];
  for (const l of listed) {
    if (l.status === 'fulfilled') {
      for (const m of l.value) if (m.pull) merged.push(m as any);
    } else {
      console.warn('[github/contributions] a repository could not be listed:', l.reason);
    }
  }
  merged.sort((a, b) => (b.pull.mergedAt > a.pull.mergedAt ? 1 : -1));
  const recent = merged.slice(0, DETAILED_PULLS);

  // Reviews and the size (for the suggestion) of the most recent ones.
  const detailed = await Promise.all(
    recent.map(async (m) => {
      const [full, reviews] = await Promise.allSettled([
        getPull(cfg, m.installationId, m.repo, m.pull.number, fetch),
        listPullReviews(cfg, m.installationId, m.repo, m.pull.number, fetch)
      ]);
      const sized = full.status === 'fulfilled' && full.value ? toMergedPull(full.value, m.repo) : null;
      const pull = sized ?? m.pull;
      const counted: PullReview[] = reviews.status === 'fulfilled' ? countedReviews(reviews.value, pull.authorId) : [];
      return { pull, reviews: counted };
    })
  );

  // GitHub accounts → 1lev1 users.
  const githubIds = new Set<string>();
  for (const d of detailed) {
    if (d.pull.authorId) githubIds.add(d.pull.authorId);
    for (const r of d.reviews) githubIds.add(r.reviewerId);
  }
  const usersByGithubId = new Map<string, { id: string; username: string | null }>();
  if (githubIds.size) {
    try {
      const res = await strapiClient.execute(
        'githubContributorsByGithubIds',
        { githubIds: [...githubIds] },
        token,
        fetch
      );
      for (const u of res?.data?.usersPermissionsUsers?.data ?? []) {
        const gid = u.attributes?.githubId;
        if (gid) usersByGithubId.set(String(gid), { id: String(u.id), username: u.attributes?.username ?? null });
      }
    } catch (e) {
      console.warn('[github/contributions] contributor lookup failed:', e);
    }
  }

  const memberIds = new Set<string>(
    (membersRes?.data?.project?.data?.attributes?.user_1s?.data ?? []).map((m: any) => String(m.id))
  );

  const timers: LoggedTimer[] = [];
  const claimedKeys = new Set<string>();
  for (const t of timersRes?.data?.timers?.data ?? []) {
    const a = t.attributes ?? {};
    const userId = a.users_permissions_user?.data?.id;
    if (userId == null) continue;
    const links = parseSaveLinks(a.saveLinks);
    timers.push({ userId: String(userId), hours: Number(a.totalHours ?? 0) || 0, links });
    const claim = claimOfTimer(a.saveText, links);
    if (claim) claimedKeys.add(claimKey(String(userId), claim.kind, claim.url));
  }

  const contributions = buildContributions({
    pulls: detailed,
    usersByGithubId,
    memberIds,
    viewerId,
    timers,
    claimedKeys,
    suggest: (kind, pull) => suggestClaimHours(kind, pull)
  });

  const missions = (missionsRes?.data?.mesimabetahaliches?.data ?? []).map((m: any) => ({
    id: String(m.id),
    name: String(m.attributes?.name ?? ''),
    perhour: m.attributes?.perhour ?? null
  }));

  return json(
    {
      configured: true,
      repos: repos.length,
      viewerLinked: !!viewerRes?.data?.usersPermissionsUser?.data?.attributes?.githubId,
      contributions,
      missions
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
};
