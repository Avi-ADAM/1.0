import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actionService, strapiClient } from '$lib/server/actions/index.js';
import { githubAppConfig, type GithubAppConfig } from '$lib/server/github/config.js';
import { pickKey, readPickToken, type PickToken } from '$lib/server/github/state.js';
import { listInstallationRepos } from '$lib/server/github/client.js';
import { markPickable, toExistingRows, type RepoRowInput } from '$lib/server/github/repos.js';
import { adminToken, isProjectMember, serviceContext } from '$lib/server/github/service.js';

/**
 * GET  /api/v1/github/pick?token=…         the installations' repositories, marked
 * POST /api/v1/github/pick {token, repoId}  connect that one repository
 *
 * The second half of the install flow (PLAN_CODE_RIKMA §3.3). The callback
 * verified the member's installations and signed a pick token; here the member
 * chooses which repository joins the rikma, one at a time. Nothing is attached
 * from an installation as a whole — "All repositories" on GitHub's install
 * screen would otherwise connect every repository on the account.
 *
 * The token may name more than one installation (a personal account and an
 * org), so the repositories of all of them are offered together and each one
 * remembers which installation it came through.
 *
 * Runs on the API host (the App's private key lives there); the code tab's
 * load and form action reach it through `handleFetch`, which carries the
 * member's cookie. The token names the member, and membership is checked again
 * on every call. The repository itself is re-read from GitHub on POST — the
 * client sends only an id.
 */

/** The verified token, or the refusal to send back. */
type Resolved = { cfg: GithubAppConfig; pick: PickToken } | Response;

/** A repository, and the installation it is reachable through. */
type Reachable = RepoRowInput & { installationId: string };

const refuse = (status: number, error: string) => json({ error }, { status });

async function resolve(token: unknown, uid: unknown, fetchFn: typeof fetch): Promise<Resolved> {
  const cfg = githubAppConfig();
  if (!cfg) return refuse(503, 'failed');
  if (!uid) return refuse(401, 'wrongUser');
  const pick = readPickToken(typeof token === 'string' ? token : null, pickKey(cfg.clientSecret));
  if (!pick) return refuse(410, 'expired');
  if (pick.uid !== String(uid)) return refuse(403, 'wrongUser');
  if (!(await isProjectMember(pick.projectId, pick.uid, fetchFn))) return refuse(403, 'wrongUser');
  return { cfg, pick };
}

/**
 * Every repository the member can offer this rikma. One unreachable
 * installation (suspended on GitHub since the token was signed) must not hide
 * the repositories of the others.
 */
async function reachableRepos(
  cfg: GithubAppConfig,
  pick: PickToken,
  fetchFn: typeof fetch
): Promise<Reachable[]> {
  const lists = await Promise.allSettled(
    pick.installationIds.map(async (installationId) =>
      (await listInstallationRepos(cfg, installationId, fetchFn)).map((repo) => ({ ...repo, installationId }))
    )
  );
  const out: Reachable[] = [];
  const seen = new Set<string>();
  lists.forEach((list, i) => {
    // An empty answer here is the one failure that looks like success — the
    // picker simply shows nothing — so say which installation gave what.
    console.log(
      `[github/pick] installation ${pick.installationIds[i]} → ` +
        (list.status === 'fulfilled' ? `${list.value.length} repositories` : 'failed')
    );
  });
  for (const list of lists) {
    if (list.status === 'rejected') {
      console.warn('[github/pick] an installation could not be listed:', list.reason);
      continue;
    }
    for (const repo of list.value) {
      if (seen.has(repo.repoId)) continue;
      seen.add(repo.repoId);
      out.push(repo);
    }
  }
  return out;
}

async function existingRows(repos: RepoRowInput[], fetchFn: typeof fetch) {
  if (repos.length === 0) return [];
  const res = await strapiClient.execute(
    'githubReposByRepoIds',
    { repoIds: repos.map((r) => r.repoId) },
    adminToken(),
    fetchFn
  );
  return toExistingRows(res?.data?.projectRepos?.data ?? []);
}

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
  const r = await resolve(url.searchParams.get('token'), locals.uid, fetch);
  if (r instanceof Response) return r;

  try {
    const repos = await reachableRepos(r.cfg, r.pick, fetch);
    const marked = markPickable(r.pick.projectId, repos, await existingRows(repos, fetch));
    return json({
      projectId: r.pick.projectId,
      repos: marked.map(({ repoId, owner, name, isPrivate, pick }) => ({ repoId, owner, name, isPrivate, pick }))
    });
  } catch (e) {
    console.error('[github/pick] listing failed:', e);
    return json({ error: 'failed' }, { status: 502 });
  }
};

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const body = await request.json().catch(() => null);
  const r = await resolve(body?.token, locals.uid, fetch);
  if (r instanceof Response) return r;

  const repoId = String(body?.repoId ?? '');
  if (!/^\d+$/.test(repoId)) return json({ error: 'invalid' }, { status: 400 });

  try {
    const repo = (await reachableRepos(r.cfg, r.pick, fetch)).find((x) => x.repoId === repoId);
    if (!repo) return json({ error: 'invalid' }, { status: 404 });

    const { installationId, ...row } = repo;
    const synced = await actionService.executeAction(
      'syncProjectRepos',
      {
        projectId: r.pick.projectId,
        installationId,
        repos: [row],
        connectedBy: r.pick.uid
      },
      serviceContext(r.pick.uid, fetch)
    );
    if (!synced.success) {
      console.error('[github/pick] connect failed:', synced.error);
      return json({ error: 'failed' }, { status: 500 });
    }
    return json({ outcome: synced.data?.conflicts?.length ? 'conflicts' : 'connected' });
  } catch (e) {
    console.error('[github/pick] connect failed:', e);
    return json({ error: 'failed' }, { status: 502 });
  }
};
