import { sendToSer } from '$lib/send/sendToSer.js';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  const res = await sendToSer({ pid: projectId }, 'getProjectBaseInfoWithAuth', 0, 0, false, fetch);

  const me = res?.data?.me;
  const projectData = res?.data?.project?.data;

  if (!projectData || !me?.id) {
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
    memberCount: members.length
  };
};
