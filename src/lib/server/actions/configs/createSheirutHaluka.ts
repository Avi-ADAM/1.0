import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const createSheirutHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { sheirutId, projectId, receiverId, amount } = params;
  const { userId } = context;
  const now = new Date().toISOString();

  if (String(userId) === String(receiverId)) {
    throw new Error('Cannot transfer money to yourself');
  }

  const halukaData: Record<string, any> = {
    usersend: String(userId),
    userrecive: String(receiverId),
    ushar: true,
    sheirut: String(sheirutId),
    publishedAt: now
  };

  if (amount !== undefined && amount !== null && !isNaN(Number(amount))) {
    halukaData.amount = Number(amount);
  }

  const createRes = await strapi.execute(
    '69createHaluka',
    { data: halukaData },
    context.jwt,
    context.fetch
  );

  if (createRes?.errors) {
    throw new Error(`Failed to create haluka: ${JSON.stringify(createRes.errors)}`);
  }

  const halukaId = createRes?.data?.createHaluka?.data?.id;
  if (!halukaId) {
    throw new Error('Failed to create haluka: no ID returned');
  }

  return {
    halukaId,
    sheirutId,
    receiverId,
    projectId
  };
};

export const createSheirutHalukaConfig: ActionConfig = {
  key: 'createSheirutHaluka',
  description: 'Create a haluka for a sheirut money transfer (buyer confirms payment to a specific member)',
  graphqlOperation: createSheirutHalukaHandler,

  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'Sheirut ID' },
    projectId: { type: 'string', required: true, description: 'Project ID' },
    receiverId: { type: 'string', required: true, description: 'User ID of the money recipient' },
    amount: { type: 'number', required: false, description: 'Amount transferred' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'sheirutCustomer',
      config: { sheirutIdParam: 'sheirutId' },
      errorMessage: 'Must be a customer of this sheirut'
    }
  ],

  updateStrategy: {
    type: 'none'
  }
};
