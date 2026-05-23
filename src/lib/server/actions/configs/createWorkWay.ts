/**
 * Action: createWorkWay
 *
 * Creates a new WorkWay entity when the user types a name not yet in the list.
 * Called on-the-fly from the mission form's workways MultiSelect.
 *
 * Returns the new entity's { id, workWayName } so the client can add it to
 * the $ww store and resolve its ID for future form submission.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { workWayName } = params;
  const now = new Date().toISOString();

  const res = await strapi.execute(
    '166createWorkWay',
    { name: workWayName.trim(), publishedAt: now },
    context.jwt,
    context.fetch,
  );

  const created = res?.data?.createWorkWay?.data;
  if (!created) throw new Error('Failed to create WorkWay');

  return {
    data: {
      id: created.id,
      workWayName: created.attributes.workWayName,
    },
    updateStrategy: { type: 'none' },
  };
};

export const createWorkWayConfig: ActionConfig = {
  key: 'createWorkWay',
  description: 'Create a new WorkWay entity. Returns { id, workWayName } for store update.',
  graphqlOperation: handler,

  paramSchema: {
    workWayName: { type: 'string', required: true, description: 'Name for the new work way' },
  },

  authRules: [{ type: 'jwt' }],

  updateStrategy: { type: 'none' },
};
