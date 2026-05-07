import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  try {
    const res = await sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch);
    const attributes = res?.data?.project?.data?.attributes ?? null;
    return { missions: attributes };
  } catch (e) {
    console.error('[progress] Failed to load missions', e);
    return { missions: null };
  }
};
