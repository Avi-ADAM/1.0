import { error } from '@sveltejs/kit';
import { sendToSer } from '$lib/send/sendToSer.js';
import { idPr } from '$lib/stores/idPr.js';

/** @type {import('./$types').LayoutLoad} */
export async function load({ params, fetch }) {
  const { projectId } = params;

  // Sync legacy store for backward compatibility
  idPr.set(projectId);

  let projectBase = null;
  try {
    const res = await sendToSer({ pid: projectId }, 'getProjectBaseInfo', null, null, false, fetch);
    if (res?.data?.project?.data?.attributes) {
      projectBase = res.data.project.data.attributes;
    }
  } catch (e) {
    console.error('Failed to load project base info', e);
  }

  return {
    projectId,
    projectBase
  };
}
