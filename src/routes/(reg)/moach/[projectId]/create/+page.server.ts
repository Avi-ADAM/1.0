import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  const [projectMissionsRes, missionTemplatesRes] = await Promise.all([
    sendToSer({ pid: projectId }, 'getProjectMissions', 0, 0, false, fetch),
    sendToSer({}, 'getMissionTemplates', 0, 0, false, fetch)
  ]);

  // Store the full project attributes so the moachStore format is
  // compatible with what the progress page expects (mesimabetahaliches, open_missions, pendms)
  const projectMissionsData =
    projectMissionsRes?.data?.project?.data?.attributes ?? null;

  const missionTemplates = missionTemplatesRes?.data?.missions?.data ?? [];

  return {
    projectMissionsData,
    missionTemplates
  };
};
