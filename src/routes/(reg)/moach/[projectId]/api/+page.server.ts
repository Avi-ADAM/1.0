import { sendToSer } from '$lib/send/sendToSer.js';
import { readRikmaIdentity } from '$lib/server/rikmaPublic/loadRikmaPage.js';
import type { PageServerLoad } from './$types';

/**
 * The rikma's API page (PLAN_EXTERNAL_TASKS_API §2).
 *
 * Its whole job is to hand the member the real ids their external system has to
 * quote: which in-progress missions a task can hang on, which roles it can be
 * offered to, and who the members are. Without these the documentation is a
 * shape with no values in it.
 *
 * `getProjectMissions` already returns exactly that set for the acts tab, so
 * the page reuses it rather than adding a qid.
 *
 * Since PLAN_HEADLESS_PRODUCTS_API §5.0 the catalog is read from an address
 * that *carries the rikma*, so the page also loads the rikma's own slug: the
 * snippet must show `/api/v1/r/<slug>/products`, not a `{rikma}` placeholder
 * the member has to fill from memory. `readRikmaIdentity` is the same reader
 * the public page uses — a second implementation here could disagree with it.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  try {
    const [res, identity] = await Promise.all([
      sendToSer({ pid: projectId }, 'getProjectMissions', 0, 0, false, fetch) as Promise<any>,
      // A rikma with no address (or a backend older than the field) yields a
      // null slug; the panel then falls back to the numeric id, which is a
      // legal address too.
      readRikmaIdentity(projectId).catch(() => ({ slug: null, look: null, ready: false }))
    ]);

    const attributes = res?.data?.project?.data?.attributes ?? null;
    const missions: any[] = attributes?.mesimabetahaliches?.data ?? [];

    // Roles are attached per mission; the rikma's usable set is their union,
    // de-duplicated by id so a role used on three missions is offered once.
    const roleMap = new Map<string, { id: string; name: string }>();
    for (const m of missions) {
      for (const r of m.attributes?.tafkidims?.data ?? []) {
        const id = String(r.id);
        if (!roleMap.has(id)) {
          roleMap.set(id, { id, name: r.attributes?.roleDescription ?? `#${id}` });
        }
      }
    }

    return {
      rikmaSlug: identity?.slug ?? null,
      missions: missions.map((m: any) => ({
        id: String(m.id),
        name: m.attributes?.name ?? `#${m.id}`,
        holder: m.attributes?.users_permissions_user?.data?.attributes?.username ?? null
      })),
      roles: [...roleMap.values()]
    };
  } catch (e) {
    console.error('[moach/api] Failed to load rikma references', e);
    return { rikmaSlug: null, missions: [], roles: [] };
  }
};
