import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const declineOpenMissionHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, existingDeclinedIds = [] } = params;

  const newDeclinedIds = [...existingDeclinedIds.map(String), String(openMissionId)];
  await strapi.execute(
    '129updateUserDeclined',
    { userId: context.userId, declinedList: newDeclinedIds },
    context.jwt,
    context.fetch
  );

  return {
    data: { openMissionId },
    updateStrategy: { type: 'none' },
  };
};

export const declineOpenMissionConfig: ActionConfig = {
  key: 'declineOpenMission',
  description: 'Mark an open mission as declined for the current user (updates user.declined array).',
  graphqlOperation: declineOpenMissionHandler,

  paramSchema: {
    openMissionId: { type: 'string', required: true },
    existingDeclinedIds: { type: 'array', required: false },
  },

  authRules: [{ type: 'jwt' }],
  updateStrategy: { type: 'none' },
};
