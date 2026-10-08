import { strapiClient } from '$lib/server/actions';
import { loadRikmaPage, readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's address & look editor (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §4.6, §5.5).
 * Members only — the moach layout's load refuses everyone else.
 */
export const load: PageServerLoad = async (event) => {
  await event.parent();
  const projectId = event.params.projectId;
  const identity = await readRikmaIdentity(projectId);

  // The same payload the public page renders, so the live preview is that page.
  const page = await loadRikmaPage({
    projectId,
    identity,
    locals: event.locals,
    fetch: event.fetch,
    cookies: event.cookies,
    url: new URL(event.url.origin),
    depends: event.depends
  });

  let open: Array<{ id: string; kind: string; newSlug: string | null; createdAt: string }> = [];
  if (identity.ready) {
    try {
      const res = await strapiClient.execute('rikmaOpenIdentityDecisions', { pid: projectId });
      open = (res?.data?.decisions?.data ?? []).map((d: any) => ({
        id: String(d.id),
        kind: d.attributes?.kind,
        newSlug: d.attributes?.newSlug ?? null,
        createdAt: d.attributes?.createdAt
      }));
    } catch {
      /* the list is a courtesy; the editor works without it */
    }
  }

  return {
    page,
    slug: identity.slug,
    look: identity.look,
    ready: identity.ready,
    open
  };
};
