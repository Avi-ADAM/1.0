import { sendToSer } from '$lib/send/sendToSer.js';
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
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  try {
    const res: any = await sendToSer({ pid: projectId }, 'getProjectMissions', 0, 0, false, fetch);
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
      missions: missions.map((m: any) => ({
        id: String(m.id),
        name: m.attributes?.name ?? `#${m.id}`,
        holder: m.attributes?.users_permissions_user?.data?.attributes?.username ?? null
      })),
      roles: [...roleMap.values()]
    };
  } catch (e) {
    console.error('[moach/api] Failed to load rikma references', e);
    return { missions: [], roles: [] };
  }
};
