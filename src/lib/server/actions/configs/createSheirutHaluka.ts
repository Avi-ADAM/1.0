import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { loadDealDue } from '$lib/server/sheirut/dealDue.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const createSheirutHalukaHandler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const { sheirutId, projectId, receiverId } = params;
  let { amount } = params;
  const { userId } = context;
  const now = new Date().toISOString();

  if (String(userId) === String(receiverId)) {
    throw new Error('Cannot transfer money to yourself');
  }

  // A wish deal costs the hours its rikma approved, never above the price agreed per line
  // (QA_CONCIERGE_E2E C-14, $lib/sheirut/dealDue) — the same hours the partners' shares
  // follow, so the split hands each of them exactly what was approved on their work. The
  // amount is the server's, not the browser's, and it exists only once every part of the
  // deal is closed: before that nobody knows it.
  const owed = await loadDealDue((qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch), String(sheirutId));
  if (owed) {
    if (!owed.final) {
      throw new Error(
        'This deal is paid by the hours its rikma approves — the amount is known once every part of it is finished'
      );
    }
    if (!(owed.remaining > 0)) {
      throw new Error('Nothing is left to pay on this deal');
    }
    amount = owed.remaining;
  }

  const halukaData: Record<string, any> = {
    usersend: String(userId),
    userrecive: String(receiverId),
    ushar: true,
    // "Yes, transfer" is the customer saying she sent it — she is not asked again. The
    // transfer is settled by the receiver's word alone ($lib/server/deal/dealMoney).
    senderconf: true,
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
    projectId,
    amount: halukaData.amount ?? null,
    // Whose word settles the transfer — they are asked to confirm it.
    recipientIds: [String(receiverId)]
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
    amount: {
      type: 'number',
      required: false,
      description: 'Amount transferred — ignored for a wish deal, whose amount is the approved hours (C-14)'
    }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated' },
    {
      type: 'sheirutCustomer',
      config: { sheirutIdParam: 'sheirutId' },
      errorMessage: 'Must be a customer of this sheirut'
    }
  ],

  // The transfer is settled by the receiver's word alone ($lib/server/deal/dealMoney), so
  // the receiver has to hear that one is waiting for it.
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: {
        he: 'דווח על תשלום אליך',
        en: 'A payment to you was reported',
        ar: 'تم الإبلاغ عن دفعة لك'
      },
      body: {
        he: 'הלקוח/ה דיווח/ה שהעביר/ה לך תשלום על העסקה. אפשר לאשר בעמוד העסקה שהכסף הגיע.',
        en: 'The customer reported paying you for the deal. Confirm on the deal page that the money arrived.',
        ar: 'أبلغ العميل أنه دفع لك مقابل الصفقة. أكّد في صفحة الصفقة وصول المبلغ.'
      }
    },
    intent: 'consent',
    metadata: { priority: 'high', type: 'dealPaid', url: '/deals/{{sheirutId}}' }
  },

  updateStrategy: {
    type: 'none'
  },

  realtime: {
    scopes: (p, r) =>
      scopeList([scope('project', p.projectId), scope('deal', p.sheirutId), scope('split', r?.halukaId)]),
    partiesFrom: (p) => [p.receiverId],
  },
};
