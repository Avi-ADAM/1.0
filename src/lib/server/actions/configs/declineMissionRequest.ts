import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const declineMissionRequestHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, declinedUserId } = params;

  await strapi.execute(
    '130updateOpenMissionDeclined',
    { id: openMissionId, declinedId: String(declinedUserId) },
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
