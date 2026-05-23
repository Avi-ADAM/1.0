import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const declineAskmRequestHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { askmId, existingVotes = [] } = params;

  const existingVots = existingVotes.map((v: any) => ({
    what: v.what ?? true,
    users_permissions_user:
      v.users_permissions_user?.data?.id ?? v.users_permissions_user?.id ?? v.users_permissions_user,
  }));
  const allVots = [...existingVots, { what: false, users_permissions_user: context.userId }];

  await strapi.execute('132archiveAskmWithVotes', { id: askmId, vots: allVots }, context.jwt, context.fetch);

  return {
    data: { askmId },
    updateStrategy: { type: 'none' },
  };
};

export const declineAskmRequestConfig: ActionConfig = {
  key: 'declineAskmRequest',
  description: 'Decline a resource-share request (Askm): archives Askm with a false vote from the current user.',
  graphqlOperation: declineAskmRequestHandler,

  paramSchema: {
    askmId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    existingVotes: { type: 'array', required: false },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to decline a resource request'
    }
  ],

  updateStrategy: { type: 'none' },
};
