import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { dismissSuggestion } from '$lib/server/matching/engine';

const declineOpenMissionHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { openMissionId, existingDeclinedIds = [] } = params;

  const newDeclinedIds = [...existingDeclinedIds.map(String), String(openMissionId)];
  await strapi.execute(
    '129updateUserDeclined',
    { userId: context.userId, declinedList: newDeclinedIds },
    context.jwt,
    context.fetch
  );

  // Keep the precomputed suggestion in sync with the decline.
  await dismissSuggestion(
    String(context.userId),
    { openMissionId: String(openMissionId) },
    { strapi, fetch: context.fetch, lang: context.lang }
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
