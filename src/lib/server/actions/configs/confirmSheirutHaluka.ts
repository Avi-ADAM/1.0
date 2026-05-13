import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const confirmSheirutHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { halukaId, role } = params;
  const { userId } = context;

  if (role !== 'sender' && role !== 'receiver') {
    throw new Error('Invalid role: must be "sender" or "receiver"');
  }

  const getRes = await strapi.execute(
    '71.5getHaluka',
    { id: halukaId },
    context.jwt,
    context.fetch
  );

  const haluka = getRes?.data?.haluka?.data?.attributes;
  if (!haluka) throw new Error('Haluka not found');

  const senderId = String(getRes.data.haluka.data.attributes.usersend?.data?.id);
  const receiverId = String(getRes.data.haluka.data.attributes.userrecive?.data?.id);

  if (role === 'sender') {
    if (String(userId) !== senderId) {
      throw new Error('Only the sender can confirm sending');
    }
    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, senderconf: true },
      context.jwt,
      context.fetch
    );
    if (updateRes?.errors) {
      throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);
    }
    return { confirmed: true, role: 'sender', halukaId };
  } else {
    if (String(userId) !== receiverId) {
      throw new Error('Only the receiver can confirm receiving');
    }
    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, confirmed: true },
      context.jwt,
      context.fetch
    );
    if (updateRes?.errors) {
      throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);
    }
    return { confirmed: true, role: 'receiver', halukaId };
  }
};

export const confirmSheirutHalukaConfig: ActionConfig = {
  key: 'confirmSheirutHaluka',
  description: 'Confirm sending or receiving money in a sheirut haluka transfer',
  graphqlOperation: confirmSheirutHalukaHandler,
  paramSchema: {
    halukaId: { type: 'string', required: true, description: 'Haluka ID' },
    role: { type: 'string', required: true, description: '"sender" or "receiver"' }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' }
  ],
  updateStrategy: { type: 'none' }
};
