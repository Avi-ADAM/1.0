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
import { applyTosplitApproval } from '$lib/server/haluka/applyTosplitApproval';

const approveHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { tosplitId, userId, users = [], halukot = [], sales = [], hervachUpdates = [] } = params;

  // Build vots array: all existing votes + current user's vote
  const vots = (Array.isArray(users) ? users : []).map((u: any) => ({
    what: true,
    users_permissions_user: String(u.users_permissions_user?.data?.id || u.id || u)
  }));
  vots.push({ what: true, users_permissions_user: String(userId) });

  // Steps 1-4 live in the shared helper so that this path and the restime
  // maturation in the timegrama finalizer cannot drift apart.
  const tosplitResult = await applyTosplitApproval(
    strapi,
    { jwt: context.jwt, fetch: context.fetch },
    { tosplitId, vots, halukot, sales, hervachUpdates }
  );

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
      // MAY be empty: a balanced proposal has nothing to transfer (always the
      // case in a one-member rikma). Steps 1/2/4 still have work to do.
      validate: (value) => Array.isArray(value)
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
      // Required so the projectMember rule below always has something to check.
      // Without it, `jwt` alone let any authenticated user finalize any tosplit
      // by guessing its id — this is a money path.
      required: true,
      validate: (value) => !isNaN(Number(value))
    }
  },

  authRules: [
    {
      type: 'jwt',
      errorMessage: 'Must be authenticated to approve haluka'
    },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Must be a member of the project to approve its haluka'
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
