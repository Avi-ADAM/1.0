/**
 * What the recipe pickers offer: the rikma's running missions and resources, its
 * members and the catalog templates. The new-product form and the product
 * page read the same thing (PLAN_PRODUCT_FORM_UNIFIED).
 */
import { sendToSer } from '$lib/send/sendToSer.js';
import type {
  AvailableMission,
  AvailableResource,
  MissionTemplate,
  ProjectMember,
  ResourceTemplate
} from '$lib/components/products/types';

export interface BomPickers {
  availableMissions: AvailableMission[];
  availableResources: AvailableResource[];
  projectMembers: ProjectMember[];
  projectName: string;
  missionTemplates: MissionTemplate[];
  resourceTemplates: ResourceTemplate[];
}

export const NO_BOM_PICKERS: BomPickers = {
  availableMissions: [],
  availableResources: [],
  projectMembers: [],
  projectName: '',
  missionTemplates: [],
  resourceTemplates: []
};

export async function loadBomPickers(projectId: string, fetchFn: typeof fetch): Promise<BomPickers> {
  const [missionsRes, baseRes, missionTemplatesRes, resourceTemplatesRes]: any[] = await Promise.all([
    sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetchFn),
    sendToSer({ pid: projectId }, 'getProjectBaseInfo', null, null, false, fetchFn),
    sendToSer({}, 'getMissionTemplates', 0, 0, false, fetchFn),
    sendToSer({}, 'getMashaabims', 0, 0, false, fetchFn)
  ]);

  const missionsAttrs = missionsRes?.data?.project?.data?.attributes ?? null;
  const baseAttrs = baseRes?.data?.project?.data?.attributes ?? null;

  // getProjectMissions already returns open_mashaabims + pmashes for the project.
  // Tag each one with its source so the picker knows whether it's a pmash (multi-member
  // pending vote) or an open_mashaabim (single-member open request).
  const tagged = (rows: any[] | undefined, source: AvailableResource['source']): AvailableResource[] =>
    (rows ?? []).map((r) => ({ id: r.id, source, attributes: r.attributes }));

  return {
    availableMissions: missionsAttrs?.mesimabetahaliches?.data ?? [],
    availableResources: [...tagged(missionsAttrs?.pmashes?.data, 'pmash'), ...tagged(missionsAttrs?.open_mashaabims?.data, 'openMashaabim')],
    projectMembers: baseAttrs?.user_1s?.data ?? [],
    projectName: baseAttrs?.projectName ?? '',
    missionTemplates: missionTemplatesRes?.data?.missions?.data ?? [],
    resourceTemplates: resourceTemplatesRes?.data?.mashaabims?.data ?? []
  };
}
