import { redirect } from '@sveltejs/kit';
import { loadRikmaPage, readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';

export const load = async ({ locals, params, fetch, depends, cookies, url }) => {
  const projectId = params.id;
  const identity = await readRikmaIdentity(projectId);

  // A rikma with an address has one canonical page: /r/<slug>
  // (PLAN_RIKMA_SUBDOMAINS §4.5). Old links, shares and bookmarks still arrive.
  if (identity.slug) redirect(301, `/r/${identity.slug}${url.search}`);

  return loadRikmaPage({ projectId, identity, locals, fetch, cookies, url, depends });
};
