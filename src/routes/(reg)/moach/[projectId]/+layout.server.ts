import { sendToSer } from '$lib/send/sendToSer.js';
import { backendUnavailable, hasNoAnswer } from '$lib/server/sendReply.js';
import { error } from '@sveltejs/kit';
import { moachBaseKey } from '$lib/stores/moachRealtime.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, fetch, depends }) => {
  const { projectId } = params;
  // The layout's socket listener re-reads `base` through this (moachRealtime.js).
  depends(moachBaseKey(projectId));

  const res: any = await sendToSer({ pid: projectId }, 'getProjectBaseInfoWithAuth', 0, 0, false, fetch);

  // Every moach tab runs this on a direct load or a reload (client navigation
  // between tabs does not), so a Strapi timeout here used to read as "this
  // rikma does not exist" on exactly the page the member refreshed.
  if (hasNoAnswer(res)) backendUnavailable();

  const me = res.data.me;
  const projectData = res.data.project?.data;

  if (!me?.id) {
    throw error(401, { message: 'Unauthorized', code: 'auth' });
  }
  if (!projectData) {
    throw error(404, 'Project not found');
  }

  const members: { id: string }[] = projectData.attributes?.user_1s?.data ?? [];
  const isMember = members.some((u) => u.id === String(me.id));

  if (!isMember) {
    throw error(403, 'Access denied: you are not a member of this project');
  }

  return {
    projectId,
    projectBase: projectData.attributes,
    uid: String(me.id),
    memberCount: members.length,
    // Members only ever see this (the 403 above): the vault's key guard needs
    // the member set before it accepts any key event (PLAN_RIKMA_SHARED_INFO §3.2).
    memberIds: members.map((u) => String(u.id))
  };
};
