/**
 * The few GitHub HTTP calls S2 needs. No SDK: four endpoints do not justify a
 * dependency, and every call here is a plain JSON request.
 *
 * The user's OAuth token is used only inside the callback that received it —
 * to learn who they are and whether they really can reach the installation
 * they came back with — and is never stored.
 */

import { createAppJwt } from './appJwt.js';
import type { GithubAppConfig } from './config.js';
import { toRepoRow, type RepoRowInput } from './repos.js';

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
 * Does this user really have access to `installationId`? The callback's
 * `installation_id` query parameter is not proof of anything on its own.
 */
export async function userCanAccessInstallation(
  token: string,
  installationId: string,
  fetchFn: Fetch
): Promise<boolean> {
  for (let page = 1; page <= 5; page++) {
    const body = await ghJson(
      await fetchFn(`${API}/user/installations?per_page=100&page=${page}`, { headers: ghHeaders(token) }),
      'installations lookup'
    );
    const list: any[] = body?.installations ?? [];
    if (list.some((i) => String(i?.id) === String(installationId))) return true;
    if (list.length < 100) return false;
  }
  return false;
}

async function installationToken(cfg: GithubAppConfig, installationId: string, fetchFn: Fetch): Promise<string> {
  const jwt = createAppJwt(cfg.appId, cfg.privateKey);
  const body = await ghJson(
    await fetchFn(`${API}/app/installations/${encodeURIComponent(installationId)}/access_tokens`, {
      method: 'POST',
      headers: ghHeaders(jwt)
    }),
    'installation token'
  );
  if (!body?.token) throw new Error('GitHub returned no installation token');
  return String(body.token);
}

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
