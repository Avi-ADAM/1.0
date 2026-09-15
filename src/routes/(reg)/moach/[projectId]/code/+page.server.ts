import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendViaProxy } from '$lib/server/sendViaProxy.js';
import { ssrApiBase } from '$lib/server/ssrApiBase.js';
import { repoUrl } from '$lib/server/github/repos.js';
import { ISSUE_TASK_LABEL } from '$lib/server/github/issues.js';

/**
 * The rikma's code tab (PLAN_CODE_RIKMA §4.5; S2 = connected repositories).
 *
 * Everything goes through the API instance, never Strapi directly: the rows via
 * `/api/send` with the service flag (the qid is service-only), the "is GitHub
 * configured" flag via `/api/v1/github/status`, and the repository picker via
 * `/api/v1/github/pick` — on Vercel `handleFetch` re-points all three at
 * api.1lev1.com, where the secrets live.
 *
 * `?github=pick&pick=<token>` is where the install callback lands: the member
 * chooses the one repository that joins the rikma before anything is attached.
 *
 * `await parent()` first: the moach layout is what refuses non-members, and a
 * page load that does not wait for it runs in parallel with that refusal.
 */
export const load: PageServerLoad = async ({ params, fetch, parent, url }) => {
  await parent();

  let notice = url.searchParams.get('github');
  // The connect flow must run on the API host (secrets, and the callback
  // registered with GitHub). '' = this instance is the API (VPS, dev).
  const connectBase = ssrApiBase();
  const pickToken = notice === 'pick' ? (url.searchParams.get('pick') ?? '') : null;

  const [reposRes, statusRes, pickRes] = await Promise.allSettled([
    sendViaProxy(fetch, 'githubProjectRepos', { pid: params.projectId }, { isSer: true }),
    fetch('/api/v1/github/status').then((r) => (r.ok ? r.json() : null)),
    pickToken === null
      ? Promise.resolve(null)
      : fetch(`/api/v1/github/pick?token=${encodeURIComponent(pickToken)}`).then(async (r) => ({
          ok: r.ok,
          body: await r.json().catch(() => null)
        }))
  ]);

  const configured = statusRes.status === 'fulfilled' && statusRes.value?.configured === true;

  let pick: { token: string; repos: any[] } | null = null;
  if (pickToken !== null) {
    const res = pickRes.status === 'fulfilled' ? pickRes.value : null;
    if (res?.ok && Array.isArray(res.body?.repos) && String(res.body.projectId) === params.projectId) {
      pick = { token: pickToken, repos: res.body.repos };
    } else {
      notice = res?.ok ? 'invalid' : (res?.body?.error ?? 'failed');
    }
  }

  if (reposRes.status === 'rejected') {
    console.error('[moach/code] failed to load repositories', reposRes.reason);
    return { repos: [], configured, notice, connectBase, pick, issueLabel: ISSUE_TASK_LABEL, loadFailed: true };
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

  return { repos, configured, notice, connectBase, pick, issueLabel: ISSUE_TASK_LABEL };
};

export const actions: Actions = {
  /** Connect the one repository the member chose from the picker. */
  pick: async ({ request, fetch, params }) => {
    const form = await request.formData();
    const token = String(form.get('token') ?? '');
    const repoId = String(form.get('repoId') ?? '');
    if (!token || !/^\d+$/.test(repoId)) return fail(400, { pickError: 'invalid' });

    let outcome = 'failed';
    try {
      const res = await fetch('/api/v1/github/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, repoId })
      });
      const body = await res.json().catch(() => null);
      outcome = res.ok ? (body?.outcome ?? 'failed') : (body?.error ?? 'failed');
    } catch (e) {
      console.error('[moach/code] connecting the picked repository failed', e);
    }
    throw redirect(303, `/moach/${params.projectId}/code?github=${encodeURIComponent(outcome)}`);
  }
};
