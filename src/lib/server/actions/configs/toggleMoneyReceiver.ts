import type { ActionConfig, ActionExecutionHandler } from '../types';

const toggleMoneyReceiverHandler: ActionExecutionHandler = async (params, context, util) => {
  const { id, projectId, action } = params;
  const { userId } = context;
  const { strapi } = util;

  if (!id || !projectId || !['add', 'remove'].includes(action)) {
    throw new Error('Missing required params: id, projectId, action (add|remove)');
  }

  const current = await strapi.execute('2cGetMoneyReceivers', { id }, context.jwt, context.fetch);
  if (!current || current.errors) {
    throw new Error(`toggleMoneyReceiver: failed to fetch current receivers: ${JSON.stringify(current?.errors || 'Unknown')}`);
  }

  const existing: string[] = (current.data?.sheirut?.data?.attributes?.iCanGetMonay?.data ?? []).map((u: { id: string }) => u.id);

  let userIds: string[];
  if (action === 'add') {
    userIds = existing.includes(userId) ? existing : [...existing, userId];
  } else {
    userIds = existing.filter((uid) => uid !== userId);
  }

  const result = await strapi.execute('2aSetMoneyReceivers', { id, userIds }, context.jwt, context.fetch);

  if (!result || result.errors) {
    throw new Error(`toggleMoneyReceiver failed: ${JSON.stringify(result?.errors || 'Unknown')}`);
  }

  return {
    data: { id, userId, action },
    updateStrategy: { type: 'fullRefresh' }
  };
};

export const toggleMoneyReceiverConfig: ActionConfig = {
  key: 'toggleMoneyReceiver',
  description: 'Add or remove yourself from the iCanGetMonay list of a sheirut',
  graphqlOperation: toggleMoneyReceiverHandler,

  paramSchema: {
    id: { type: 'string', required: true, description: 'Sheirut ID' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    action: { type: 'string', required: true, description: '"add" or "remove"' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    { type: 'projectMember', config: { projectIdParam: 'projectId' }, errorMessage: 'Must be a project member' }
  ]
};
