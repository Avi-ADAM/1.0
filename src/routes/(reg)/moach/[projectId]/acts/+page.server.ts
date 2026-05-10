import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  try {
    const res = await sendToSer({ pid: projectId }, 'getProjectMissions', 0, 0, false, fetch);
    const attributes = res?.data?.project?.data?.attributes ?? null;
    return {
      bmiData: attributes?.mesimabetahaliches?.data ?? []
    };
  } catch (e) {
    console.error('[acts] Failed to load missions for task creation', e);
    return { bmiData: [] };
  }
};
