import { sendToSer } from '$lib/send/sendToSer.js';
import type { PageServerLoad } from './$types';
import type { AvailableResource } from '$lib/components/products/types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { projectId } = params;

  try {
    const [missionsRes, baseRes, missionTemplatesRes, resourceTemplatesRes] =
      await Promise.all([
        sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch),
        sendToSer({ pid: projectId }, 'getProjectBaseInfo', null, null, false, fetch),
        sendToSer({}, 'getMissionTemplates', 0, 0, false, fetch),
        sendToSer({}, 'getMashaabims', 0, 0, false, fetch)
      ]);

    const missionsAttrs = missionsRes?.data?.project?.data?.attributes ?? null;
    const baseAttrs = baseRes?.data?.project?.data?.attributes ?? null;
    const missionTemplates = missionTemplatesRes?.data?.missions?.data ?? [];
    const resourceTemplates = resourceTemplatesRes?.data?.mashaabims?.data ?? [];

    // getProjectMissions already returns open_mashaabims + pmashes for the project.
    // Tag each one with its source so the picker knows whether it's a pmash (multi-member
    // pending vote) or an open_mashaabim (single-member open request).
    const openMash: AvailableResource[] = (
      missionsAttrs?.open_mashaabims?.data ?? []
    ).map((r: { id: string; attributes: AvailableResource['attributes'] }) => ({
      id: r.id,
      source: 'openMashaabim' as const,
      attributes: r.attributes
    }));

    const pmashes: AvailableResource[] = (
      missionsAttrs?.pmashes?.data ?? []
    ).map((r: { id: string; attributes: AvailableResource['attributes'] }) => ({
      id: r.id,
      source: 'pmash' as const,
      attributes: r.attributes
    }));

    return {
      projectId,
      availableMissions: missionsAttrs?.mesimabetahaliches?.data ?? [],
      availableResources: [...pmashes, ...openMash],
      projectMembers: baseAttrs?.user_1s?.data ?? [],
      projectName: baseAttrs?.projectName ?? '',
      missionTemplates,
      resourceTemplates
    };
  } catch (e) {
    console.error('[sales/new] load error', e);
    return {
      projectId,
      availableMissions: [],
      availableResources: [],
      projectMembers: [],
      projectName: '',
      missionTemplates: [],
      resourceTemplates: []
    };
  }
};
