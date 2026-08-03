import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

/**
 * "Open for partners" board — every open mission and needed resource of the
 * rikma in one place.
 *
 * Reuses `getProjectMissions` (the same query the create/progress pages load)
 * so the board costs nothing new on the backend and always agrees with them.
 */
export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  const res = (await sendToSer(
    { pid: projectId },
    'getProjectMissions',
    0,
    0,
    false,
    fetch
  )) as any;
  const attrs = res?.data?.project?.data?.attributes ?? null;

  return {
    projectMissionsData: attrs
  };
};
