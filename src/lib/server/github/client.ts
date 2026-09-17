/**
 * The few GitHub HTTP calls the integration needs. No SDK: a handful of
 * endpoints do not justify a dependency, and every call here is a plain JSON
 * request.
 *
 * The user's OAuth token is used only inside the callback that received it —
 * to learn who they are and whether they really can reach the installation
 * they came back with — and is never stored. Everything else runs on an
 * installation token, scoped by GitHub to the repositories that installation
 * was granted.
 */

import { createAppJwt } from './appJwt.js';
import type { GithubAppConfig } from './config.js';
import { toRepoRow, type RepoRowInput } from './repos.js';
import { toWorkItem, type WorkItem } from '$lib/github/workItems.js';

const API = 'https://api.github.com';

type Fetch = typeof globalThis.fetch;

function ghHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': '1lev1',
    Authorization: `Bearer ${token}`
  };
}

async function ghJson(res: Response, what: string): Promise<any> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub ${what} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** OAuth `code` → user access token. */
export async function exchangeCode(
  cfg: GithubAppConfig,
  code: string,
  redirectUri: string,
  fetchFn: Fetch
): Promise<string> {
  const res = await fetchFn('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': '1lev1' },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });
  const body = await ghJson(res, 'code exchange');
  if (!body?.access_token) throw new Error(`GitHub code exchange refused: ${body?.error ?? 'no token'}`);
  return String(body.access_token);
}

/** The numeric id is the identity; the login can change and is kept for display. */
export async function getGithubUser(token: string, fetchFn: Fetch): Promise<{ id: string; login: string }> {
  const body = await ghJson(await fetchFn(`${API}/user`, { headers: ghHeaders(token) }), 'user lookup');
  if (body?.id == null || !body?.login) throw new Error('GitHub user lookup returned no id');
  return { id: String(body.id), login: String(body.login) };
}

/**
 * Every installation of *this* App the user can reach — the endpoint is scoped
 * to the App whose user token is presented.
 *
 * It answers two questions at once: whether the `installation_id` GitHub put in
 * the callback URL is really theirs (it is not proof of anything on its own),
 * and — when they arrive without one because the App is installed already —
 * which installations to offer repositories from.
 */
export async function listUserInstallationIds(token: string, fetchFn: Fetch): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= 5; page++) {
    const body = await ghJson(
      await fetchFn(`${API}/user/installations?per_page=100&page=${page}`, { headers: ghHeaders(token) }),
      'installations lookup'
    );
    const list: any[] = body?.installations ?? [];
    for (const i of list) if (i?.id != null) ids.push(String(i.id));
    if (list.length < 100) break;
  }
  return ids;
}

/**
 * Installation tokens live an hour. The timer dialog lists every connected
 * repository each time it opens, and several repositories usually share one
 * installation — so a token is reused until five minutes before it expires
 * rather than minted per request (GitHub rate-limits token creation too).
 */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const TOKEN_MARGIN_MS = 5 * 60 * 1000;

async function installationToken(cfg: GithubAppConfig, installationId: string, fetchFn: Fetch): Promise<string> {
  const key = `${cfg.appId}:${installationId}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt - Date.now() > TOKEN_MARGIN_MS) return cached.token;

  const jwt = createAppJwt(cfg.appId, cfg.privateKey);
  const body = await ghJson(
    await fetchFn(`${API}/app/installations/${encodeURIComponent(installationId)}/access_tokens`, {
      method: 'POST',
      headers: ghHeaders(jwt)
    }),
    'installation token'
  );
  if (!body?.token) throw new Error('GitHub returned no installation token');
  const token = String(body.token);
  const expiresAt = Date.parse(String(body.expires_at ?? '')) || Date.now() + 50 * 60 * 1000;
  tokenCache.set(key, { token, expiresAt });
  return token;
}

const repoPath = (repo: { owner: string; name: string }) =>
  `${API}/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;

/** Every repository the installation was granted, as row fields. */
export async function listInstallationRepos(
  cfg: GithubAppConfig,
  installationId: string,
  fetchFn: Fetch
): Promise<RepoRowInput[]> {
  const token = await installationToken(cfg, installationId, fetchFn);
  const out: RepoRowInput[] = [];
  for (let page = 1; page <= 10; page++) {
    const body = await ghJson(
      await fetchFn(`${API}/installation/repositories?per_page=100&page=${page}`, { headers: ghHeaders(token) }),
      'repository listing'
    );
    const repos: any[] = body?.repositories ?? [];
    for (const r of repos) {
      const row = toRepoRow(r);
      if (row) out.push(row);
    }
    if (repos.length < 100) break;
  }
  return out;
}

/**
 * A repository's most recently updated issues and pull requests, open or
 * not — a PR merged an hour ago is exactly what someone saving a timer now
 * worked on. The issues listing includes pull requests.
 */
export async function listRecentWorkItems(
  cfg: GithubAppConfig,
  installationId: string,
  repo: { owner: string; name: string },
  fetchFn: Fetch,
  perPage = 30
): Promise<WorkItem[]> {
  const token = await installationToken(cfg, installationId, fetchFn);
  const body = await ghJson(
    await fetchFn(`${repoPath(repo)}/issues?state=all&sort=updated&direction=desc&per_page=${perPage}`, {
      headers: ghHeaders(token)
    }),
    'issue listing'
  );
  return (Array.isArray(body) ? body : [])
    .map((json) => toWorkItem(json, repo))
    .filter((item): item is WorkItem => item !== null);
}

/** Leave a comment on an issue (or pull request). Needs Issues: write. */
export async function commentOnIssue(
  cfg: GithubAppConfig,
  installationId: string,
  repo: { owner: string; name: string },
  number: number,
  body: string,
  fetchFn: Fetch
): Promise<void> {
  const token = await installationToken(cfg, installationId, fetchFn);
  await ghJson(
    await fetchFn(`${repoPath(repo)}/issues/${number}/comments`, {
      method: 'POST',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    }),
    'issue comment'
  );
}

// ── S4: merged pull requests and their reviews ────────────────────────────

/**
 * A repository's recently closed pull requests, merged ones only. The listing
 * carries no size (`additions` / `deletions`) — `getPull` does, for the few
 * rows a size suggestion is shown on.
 */
export async function listMergedPulls(
  cfg: GithubAppConfig,
  installationId: string,
  repo: { owner: string; name: string },
  fetchFn: Fetch,
  perPage = 30
): Promise<any[]> {
  const token = await installationToken(cfg, installationId, fetchFn);
  const body = await ghJson(
    await fetchFn(`${repoPath(repo)}/pulls?state=closed&sort=updated&direction=desc&per_page=${perPage}`, {
      headers: ghHeaders(token)
    }),
    'pull request listing'
  );
  return (Array.isArray(body) ? body : []).filter((p) => p?.merged_at);
}

/** One pull request, with its size. `null` when it does not exist. */
export async function getPull(
  cfg: GithubAppConfig,
  installationId: string,
  repo: { owner: string; name: string },
  number: number,
  fetchFn: Fetch
): Promise<any | null> {
  const token = await installationToken(cfg, installationId, fetchFn);
  const res = await fetchFn(`${repoPath(repo)}/pulls/${number}`, { headers: ghHeaders(token) });
  if (res.status === 404) return null;
  return ghJson(res, 'pull request lookup');
}

/** Every review on a pull request (GitHub pages at 100; a PR with more is not a real case). */
export async function listPullReviews(
  cfg: GithubAppConfig,
  installationId: string,
  repo: { owner: string; name: string },
  number: number,
  fetchFn: Fetch
): Promise<any[]> {
  const token = await installationToken(cfg, installationId, fetchFn);
  const body = await ghJson(
    await fetchFn(`${repoPath(repo)}/pulls/${number}/reviews?per_page=100`, { headers: ghHeaders(token) }),
    'review listing'
  );
  return Array.isArray(body) ? body : [];
}
