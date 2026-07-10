/**
 * Archive Personal Matanot — PLAN_USER_OFFERINGS M3.
 *
 * Owner-only soft-delete of a personal product (Matanot origin='personal').
 * Archives, never deletes — sales/sheiruts may reference it. A resource-backed
 * product (linked Sp) should be unpublished from the resource editor instead
 * (publishUserResourceAsProduct with offerScope='rikma'), but archiving here
 * is equivalent and safe.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, util) => {
  const { strapi } = util;
  const uid = String(context.userId);
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const matanotId = String(params.matanotId ?? '');
  if (!matanotId) throw new Error('matanotId is required');

  const meta = await strapi.execute('266getMatanotSellerMeta', { id: matanotId }, jwt, f);
  const node = meta?.data?.matanot?.data;
  if (!node) throw new Error(`Matanot ${matanotId} not found`);
  const ownerId = node.attributes?.owner_user?.data?.id;
  if (node.attributes?.origin !== 'personal' || !ownerId || String(ownerId) !== uid) {
    throw new Error('Only the owner may archive a personal product');
  }

  await strapi.execute('255setMatanotArchived', { id: matanotId, archived: true }, jwt, f);

  return {
    data: { matanotId },
    updateStrategy: { type: 'none' as const }
  };
};

export const archivePersonalMatanotConfig: ActionConfig = {
  key: 'archivePersonalMatanot',
  description: 'Owner-only soft-delete (archive) of a personal product (Matanot origin=personal).',
  graphqlOperation: handler,
  paramSchema: {
    matanotId: { type: 'string', required: true }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' }
};
