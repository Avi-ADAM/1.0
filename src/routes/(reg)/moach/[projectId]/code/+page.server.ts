import type { PageServerLoad } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { ssrApiBase } from '$lib/server/ssrApiBase.js';
import { repoUrl } from '$lib/server/github/repos.js';

/**
 * The rikma's code tab (PLAN_CODE_RIKMA §4.5; S2 = connected repositories).
 *
 * Everything goes through the API instance, never Strapi directly: the rows via
 * `/api/send` with the service flag (the qid is service-only), the "is GitHub
 * configured" flag via `/api/v1/github/status` — on Vercel `handleFetch`
 * re-points both at api.1lev1.com, where the secrets live.
 *
 * `await parent()` first: the moach layout is what refuses non-members, and a
 * page load that does not wait for it runs in parallel with that refusal.
 */
export const load: PageServerLoad = async ({ params, fetch, parent, url }) => {
  await parent();

  const notice = url.searchParams.get('github');
  // The connect flow must run on the API host (secrets, and the callback
  // registered with GitHub). '' = this instance is the API (VPS, dev).
  const connectBase = ssrApiBase();

  const [reposRes, statusRes] = await Promise.allSettled([
    sendViaProxy(fetch, 'githubProjectRepos', { pid: params.projectId }, { isSer: true }),
    fetch('/api/v1/github/status').then((r) => (r.ok ? r.json() : null))
  ]);

  const configured = statusRes.status === 'fulfilled' && statusRes.value?.configured === true;

  if (reposRes.status === 'rejected') {
    console.error('[moach/code] failed to load repositories', reposRes.reason);
    return { repos: [], configured, notice, connectBase, loadFailed: true };
  }

  const repos = ((reposRes.value as any)?.projectRepos?.data ?? []).map((r: any) => {
    const a = r.attributes ?? {};
    const owner = String(a.owner ?? '');
    const name = String(a.name ?? '');
    return {
      id: String(r.id),
      owner,
      name,
      url: repoUrl({ owner, name }),
      defaultBranch: a.defaultBranch ?? null,
      license: a.license ?? null,
      isPrivate: Boolean(a.isPrivate),
      status: a.status ?? 'active',
      connectedBy: a.connectedBy?.data?.attributes?.username ?? null
    };
  });

  return { repos, configured, notice, connectBase };
};
