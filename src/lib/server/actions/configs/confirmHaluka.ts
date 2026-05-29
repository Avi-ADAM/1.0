/**
 * Action Configuration: Confirm Haluka (money transfer)
 *
 * Handles the agree() function in didiget.svelte for both transfer parties:
 *
 *  • SENDER mode  (kind === 'send'): sets senderconf: true on the Haluka.
 *    Server verifies the caller is the usersend of this Haluka.
 *
 *  • RECEIVER mode (kind === 'receive'): sets confirmed: true.
 *    Server also performs a spCheck — verifies all other Haluka entries in the
 *    same Tosplit are already confirmed. If they are, distributes hervachti
 *    (earnings) to each participant in the Tosplit.hervachti component array
 *    before confirming this Haluka.
 *
 * Client sends: { halukaId, projectId, kind }
 *   kind = 'send' | 'receive'
 *
 * Returns: { consensus: boolean } — true when the receiver confirmed and all
 *   sibling Halukas were already confirmed (hervachti was distributed).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const confirmHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { halukaId, projectId, kind } = params;
  const { userId } = context;

  if (kind === 'send') {
    // ── SENDER: verify + set senderconf ──────────────────────────────────────
    const getRes = await strapi.execute(
      '71.5getHaluka',
      { id: halukaId },
      context.jwt,
      context.fetch,
    );
    const halukaData = getRes?.data?.haluka?.data;
    if (!halukaData) throw new Error('Haluka not found');

    const senderId = String(halukaData.attributes.usersend?.data?.id);
    if (String(userId) !== senderId) {
      throw new Error('Only the sender can confirm sending');
    }

    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, senderconf: true },
      context.jwt,
      context.fetch,
    );
    if (updateRes?.errors) throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);

    return {
      data: { consensus: false, halukaId },
      updateStrategy: { type: 'none' },
    };
  } else if (kind === 'receive') {
    // ── RECEIVER: spCheck + optional hervachti distribution + confirmed ───────
    const getRes = await strapi.execute(
      '155getHalukaForReceive',
      { id: halukaId },
      context.jwt,
      context.fetch,
    );
    const halukaData = getRes?.data?.haluka?.data;
    if (!halukaData) throw new Error('Haluka not found');

    const receiverId = String(halukaData.attributes.userrecive?.data?.id);
    if (String(userId) !== receiverId) {
      throw new Error('Only the receiver can confirm receiving');
    }

    // Server-side spCheck: all OTHER Halukas in the same Tosplit must be confirmed
    const tosplit = halukaData.attributes.tosplit?.data;
    let allSP = true;
    if (tosplit) {
      const siblings: any[] = tosplit.attributes.halukas?.data ?? [];
      for (const sibling of siblings) {
        if (String(sibling.id) !== String(halukaId) && !sibling.attributes.confirmed) {
          allSP = false;
          break;
        }
      }
    }

    // If all siblings confirmed: distribute hervachti earnings to each participant
    if (allSP && tosplit) {
      const hervachtiEntries: any[] = tosplit.attributes.hervachti ?? [];
      for (const entry of hervachtiEntries) {
        if (entry.noten === true || entry.mekabel === true) {
          const userNode = entry.users_permissions_user?.data;
          if (!userNode) continue;
          const uid = String(userNode.id);
          const currentHervachti = Number(userNode.attributes.hervachti ?? 0);
          const newHervachti = currentHervachti + Number(entry.amount ?? 0);
          await strapi.execute(
            '158updateUserHervachti',
            { id: uid, hervachti: newHervachti },
            context.jwt,
            context.fetch,
          );
        }
      }
    }

    // Mark this Haluka as confirmed by the receiver
    const updateRes = await strapi.execute(
      '71.6confirmHaluka',
      { id: halukaId, confirmed: true },
      context.jwt,
      context.fetch,
    );
    if (updateRes?.errors) throw new Error(`Failed to confirm: ${JSON.stringify(updateRes.errors)}`);

    return {
      data: { consensus: allSP, halukaId },
      updateStrategy: { type: 'none' },
    };
  } else {
    throw new Error('Invalid kind: must be "send" or "receive"');
  }
};

export const confirmHalukaConfig: ActionConfig = {
  key: 'confirmHaluka',
  description:
    'Confirm a Haluka money transfer. Sender sets senderconf; receiver sets confirmed (with optional hervachti distribution when all siblings in the same Tosplit are confirmed).',
  graphqlOperation: confirmHalukaHandler,

  paramSchema: {
    halukaId: { type: 'string', required: true, description: 'Haluka record ID' },
    projectId: { type: 'string', required: true, description: 'Project ID (for auth)' },
    kind: {
      type: 'string',
      required: true,
      description: '"send" — sender confirms; "receive" — receiver confirms',
    },
  },

  authRules: [
    { type: 'jwt' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a project member to confirm a money transfer',
    },
  ],

  notification: {
    recipients: {
      type: 'projectMembers',
      config: { projectIdParam: 'projectId', excludeSender: true },
    },
    templates: {
      title: { he: 'אישור העברת כסף', en: 'Money transfer confirmed' },
      body: { he: 'העברת כסף אושרה', en: 'A money transfer was confirmed' },
    },
    channels: ['socket'],
    metadata: { type: 'halukaConfirm', url: 'lev' },
  },

  updateStrategy: { type: 'none' },
};
