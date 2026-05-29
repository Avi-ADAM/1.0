/**
 * Action Configuration: Approve Haluka (Division)
 *
 * When all users approve a tosplit:
 * 1. Mark tosplit finished + record votes (79approveTosplit)
 * 2. Mark all related sales as splited (80updateSale)
 * 3. Mark all halukot as ushar/approved (81updateHaluka)
 * 4. Apply hervachti deltas to non-giver/non-receiver participants
 *    (server fetches each user's CURRENT balance and adds the delta — never
 *    trusts a client-supplied absolute amount).
 * Notifications are sent by the NotificationOrchestrator.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const approveHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId, userId, users = [], halukot = [], sales = [], hervachUpdates = [] } = params;

  // Build vots array: all existing votes + current user's vote
  const vots = (Array.isArray(users) ? users : []).map((u: any) => ({
    what: true,
    users_permissions_user: String(u.users_permissions_user?.data?.id || u.id || u)
  }));
  vots.push({ what: true, users_permissions_user: String(userId) });

  // Step 1: update tosplit — finished + votes
  const tosplitResult = await strapi.execute(
    '79approveTosplit',
    { tosplitId, vots },
    context.jwt,
    context.fetch
  );

  if (!tosplitResult?.updateTosplit?.data) {
    throw new Error('Failed to update tosplit');
  }

  const salesData: any[] =
    tosplitResult.updateTosplit.data.attributes?.sales?.data ||
    (Array.isArray(sales) ? sales.map((s: any) => ({ id: s.id ?? s })) : []);

  // Step 2: mark each sale as splited
  for (const sale of salesData) {
    try {
      await strapi.execute('80updateSale', { saleId: sale.id }, context.jwt, context.fetch);
    } catch (e) {
      console.error(`[approveHaluka] sale ${sale.id} update failed:`, e);
    }
  }

  // Step 3: mark each haluka as ushar
  for (const haluka of (Array.isArray(halukot) ? halukot : [])) {
    try {
      await strapi.execute('81updateHaluka', { halukaId: haluka.id ?? haluka }, context.jwt, context.fetch);
    } catch (e) {
      console.error(`[approveHaluka] haluka ${haluka.id ?? haluka} update failed:`, e);
    }
  }

  // Step 4: hervachti balance updates for participants (excluding giver/receiver).
  // Client passes [{ userId, amountDelta }]; server reads CURRENT hervachti
  // from DB and applies delta, so a malicious client cannot set arbitrary values.
  for (const upd of (Array.isArray(hervachUpdates) ? hervachUpdates : [])) {
    const uid = String(upd?.userId ?? '');
    const delta = Number(upd?.amountDelta ?? 0);
    if (!uid || !Number.isFinite(delta) || delta === 0) continue;
    try {
      const cur = await strapi.execute(
        '167getUserHervachti',
        { id: uid },
        context.jwt,
        context.fetch
      );
      const currentBalance = Number(
        cur?.usersPermissionsUser?.data?.attributes?.hervachti ?? 0
      );
      const next = currentBalance + delta;
      await strapi.execute(
        '158updateUserHervachti',
        { id: uid, hervachti: next },
        context.jwt,
        context.fetch
      );
    } catch (e) {
      console.error(`[approveHaluka] hervachti update for user ${uid} failed:`, e);
    }
  }

  return {
    data: tosplitResult,
    updateStrategy: {
      type: 'partialUpdate',
      config: { dataKeys: ['splits', 'tosplits', 'fils'] }
    }
  };
};

export const approveHalukaConfig: ActionConfig = {
  key: 'approveHaluka',

  description: 'Approve a haluka (division) when all users agree: marks tosplit finished, sales splited, halukot ushar',

  graphqlOperation: approveHalukaHandler,

  paramSchema: {
    tosplitId: {
      type: 'string',
      required: true,
      validate: (value) => !isNaN(Number(value))
    },
    userId: {
      type: 'string',
      required: true,
      validate: (value) => !isNaN(Number(value))
    },
    users: {
      type: 'array',
      required: false,
      description: 'Existing vots component array'
    },
    halukot: {
      type: 'array',
      required: true,
      validate: (value) => Array.isArray(value) && value.length > 0
    },
    sales: {
      type: 'array',
      required: false,
      description: 'Sales to mark splited (falls back to tosplit response)'
    },
    hervachUpdates: {
      type: 'array',
      required: false,
      description: 'Per-user hervachti deltas to apply: [{ userId, amountDelta }]. Server reads current balance and adds delta.'
    },
    projectId: {
      type: 'string',
      required: false
    }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to approve haluka'
    }
  ],

  notification: {
    recipients: {
      type: 'custom',
      config: { excludeSender: false }
    },
    templates: {
      title: { he: 'חלוקה אושרה!', en: 'Division Approved!', ar: 'تمت الموافقة على التقسيم!' },
      body: { he: 'החלוקה אושרה על ידי כל המשתתפים', en: 'The division has been approved by all participants', ar: 'تمت الموافقة على التقسيم من قبل جميع المشاركين' }
    },
    channels: ['socket', 'email', 'telegram', 'push'],
    emailTemplate: 'HalukaApproved',
    metadata: {
      icon: 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',
      url: 'lev',
      priority: 'high'
    }
  },

  updateStrategy: {
    type: 'partialUpdate',
    config: { dataKeys: ['splits', 'tosplits', 'fils'] }
  }
};
