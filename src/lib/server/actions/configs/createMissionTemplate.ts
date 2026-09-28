/**
 * Action: createMissionTemplate
 *
 * Creates a standalone, reusable Mission catalog entry (the global `Mission`
 * collection — missionName + skills + tafkidims + descrip). This is NOT a
 * project mission; for project-scoped mission creation use `createMission`.
 *
 * Used by the "add new mission" form (addNewMission.svelte), same family as the
 * skill/role/value catalog additions — any logged-in user may add one.
 *
 * Client sends pre-resolved skill/role IDs.
 * Client sends: { missionName, descrip?, skillIds?, roleIds? }
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { findOrCreateMissionTemplate } from '$lib/server/missions/missionTemplate.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { missionName, descrip = null, skillIds = [], roleIds = [] } = params;

  // missionName is unique in the catalogue: an existing name hands back its
  // template (existed:true) instead of a Strapi "must be unique" error.
  const { id, created } = await findOrCreateMissionTemplate(
    strapi,
    { missionName, descrip, skills: skillIds, tafkidims: roleIds },
    context.jwt,
    context.fetch,
  );

  return {
    data: { id, missionName, existed: !created },
    updateStrategy: { type: 'none' },
  };
};

export const createMissionTemplateConfig: ActionConfig = {
  key: 'createMissionTemplate',
  description: 'Create a standalone Mission catalog entry (global mission template, no project).',
  graphqlOperation: handler,

  paramSchema: {
    missionName: { type: 'string', required: true,  description: 'Mission name' },
    descrip:     { type: 'string', required: false, description: 'Short description' },
    skillIds:    { type: 'array',  required: false, description: 'Skill entity IDs' },
    roleIds:     { type: 'array',  required: false, description: 'Role (tafkidim) entity IDs' },
  },

  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to create a mission' }],

  updateStrategy: { type: 'none' },
};
