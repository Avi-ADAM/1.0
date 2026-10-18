import { error, redirect } from '@sveltejs/kit';
import { strapiClient } from '$lib/server/actions';
import { loadRikmaPage, readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';
import { resolveRikmaFromPath } from '$lib/server/apiPublic/rikmaPath.js';

/**
 * A rikma's short address (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md S0). The page is
 * the same one /project/<id> renders; this route only finds which rikma it is.
 *
 * *Which* rikma a path names is not decided here: that rule lives in
 * `$lib/server/apiPublic/rikmaPath.js`, the same function
 * `GET /api/v1/r/{rikma}` uses (PLAN_HEADLESS_PRODUCTS_API S0/S5.0). A second
 * copy of "spelling, former address, 404" here is how the page and the API
 * would start disagreeing about a slug — and the only thing this route may
 * decide for itself is the shape of its own URL, passed in as `address`.
 */
export const load = async ({ locals, params, fetch, depends, cookies, url }) => {
  const resolved = await resolveRikmaFromPath(
    params.slug,
    (qid, vars) => strapiClient.execute(qid, vars),
    {
      search: url.search,
      // The page's addresses: the short one, or /project/<id> for a rikma that
      // has no slug yet (and for an old address of such a rikma).
      address: ({ slug, projectId }) => (slug ? `/r/${slug}` : `/project/${projectId}`)
    }
  );

  if (resolved.kind === 'notFound') error(404, 'Not found');
  if (resolved.kind === 'redirect') redirect(301, resolved.location);

  const identity = await readRikmaIdentity(resolved.projectId);
  return loadRikmaPage({
    projectId: resolved.projectId,
    identity,
    locals,
    fetch,
    cookies,
    url,
    depends
  });
};
