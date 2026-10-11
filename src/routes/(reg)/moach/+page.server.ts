import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';
import { rtKey } from '$lib/realtime/scopes.js';

export const load: PageServerLoad = async ({ locals, fetch, depends }) => {
  depends(rtKey('project:*'));
  const uid = locals.uid;

  let projects: { id: string; projectName: string; profilePic: string | null }[] = [];

  if (uid) {
    try {
      const res = await sendToSer({ uid }, '64getUserProjectList', null, null, false, fetch);
      const raw = res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? [];
      projects = raw.map((p: any) => ({
        id: p.id,
        projectName: p.attributes.projectName,
        profilePic:
          p.attributes.profilePic?.data?.attributes?.formats?.thumbnail?.url ??
          p.attributes.profilePic?.data?.attributes?.url ??
          null
      }));
    } catch (e) {
      console.error('Failed to load user projects', e);
    }
  }

  return { projects };
};
