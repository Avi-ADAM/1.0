import { error, redirect } from '@sveltejs/kit';
import { slugFromPath } from '$lib/rikmaAddress/slug.js';
import { findBySlug } from '$lib/server/rikmaIdentity/identity.js';
import { strapiClient } from '$lib/server/actions';
import { loadRikmaPage, readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';

/**
 * A rikma's short address (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md S0). The page is
 * the same one /project/<id> renders; this route only finds which rikma it is.
 */
export const load = async ({ locals, params, fetch, depends, cookies, url }) => {
  const slug = slugFromPath(params.slug);
  if (!slug) error(404, 'Not found');
  // One spelling per address: /r/Bees → /r/bees.
  if (slug !== params.slug) redirect(301, `/r/${slug}${url.search}`);

  const hit = await findBySlug((qid, vars) => strapiClient.execute(qid, vars), slug);
  if (!hit) error(404, 'Not found');

  // An address the rikma used to have keeps working — it just moves on.
  if (hit.former) {
    redirect(301, hit.currentSlug ? `/r/${hit.currentSlug}${url.search}` : `/project/${hit.projectId}${url.search}`);
  }

  const identity = await readRikmaIdentity(hit.projectId);
  return loadRikmaPage({ projectId: hit.projectId, identity, locals, fetch, cookies, url, depends });
};
