import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const declineMissionRequestHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, existingDeclinedIds = [], declinedUserId } = params;

  const declinedIds = [...existingDeclinedIds.map(String), String(declinedUserId)];
  await strapi.execute(
    '130updateOpenMissionDeclined',
    { id: openMissionId, declinedIds },
    context.jwt,
    context.fetch
  );

  return {
    data: { openMissionId, declinedUserId },
    updateStrategy: { type: 'none' },
  };
};

export const declineMissionRequestConfig: ActionConfig = {
  key: 'declineMissionRequest',
  description: 'Decline a mission join request: adds the applicant userId to OpenMission.declined.',
  graphqlOperation: declineMissionRequestHandler,

  paramSchema: {
    openMissionId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    declinedUserId: { type: 'string', required: true },
    existingDeclinedIds: { type: 'array', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to decline a request'
    }
  ],

  updateStrategy: { type: 'none' },
};
