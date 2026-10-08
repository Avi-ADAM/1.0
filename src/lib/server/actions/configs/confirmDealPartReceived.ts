/**
 * A provider of a wish deal confirms: "I received my part in full" (QA_CONCIERGE_E2E C-19).
 *
 * The deal reads "paid" only once every provider has said so (`$lib/sheirut/partsReceived`).
 * The confirmation is the provider's own and only theirs — no one confirms it on their
 * behalf — and it only ever goes one way; a provider still waiting for money says nothing
 * here and talks it over in the deal's chat.
 *
 * When this confirmation is the last one, the customer and the other providers hear that
 * the deal is paid in full.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { receiveDealMoney } from '$lib/server/deal/dealMoney.js';
import { recordWishPaymentSale } from '$lib/server/sheirut/paymentSale.js';

const handler: ActionExecutionHandler = async (params, context, { strapi }) => {
  const sheirutId = params.sheirutId != null ? String(params.sheirutId) : '';
  if (!sheirutId) throw new Error('sheirutId is required');
  const me = String(context.userId);

  // The same write the transfer card makes (`$lib/server/deal/dealMoney`): if this provider
  // also received the customer's payment, that transfer is settled now, not asked again.
  const { part, transfers } = await receiveDealMoney(
    (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch),
    sheirutId,
    me,
    {
      expectAmount: params.expectAmount,
      requireProvider: true,
      recordSale: (t) =>
        recordWishPaymentSale(strapi, context, {
          sheirutId,
          halukaId: t.id,
          senderId: String(t.senderId ?? ''),
          receiverId: me,
          amount: t.amount
        })
    }
  );
  if (!part) throw new Error('Only a provider of this deal can confirm receiving their part');
  const { state, becamePaid } = part;

  return {
    data: {
      sheirutId,
      confirmed: state.confirmed,
      pending: state.pending,
      paid: state.allConfirmed,
      becamePaid,
      transfersSettled: transfers.map((t) => t.id)
    },
    // Only the moment the deal becomes paid is news to anyone else.
    recipientIds: becamePaid
      ? [...new Set([...state.customerIds, ...state.parts.map((p) => p.providerId)])].filter((u) => u !== me)
      : [],
    updateStrategy: { type: 'none' as const }
  };
};

export const confirmDealPartReceivedConfig: ActionConfig = {
  key: 'confirmDealPartReceived',
  description:
    'A provider of a wish deal confirms receiving their part in full. The deal reads paid (moneyTransfered) only when every provider has confirmed (QA C-19).',
  graphqlOperation: handler,
  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'Sheirut (deal) id' },
    expectAmount: { type: 'number', required: false, description: 'The amount a notice showed; AMOUNT_MOVED when the part changed since' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to confirm' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
    templates: {
      title: {
        he: 'העסקה שולמה במלואה ✓',
        en: 'The deal is paid in full ✓',
        ar: 'دُفعت الصفقة بالكامل ✓'
      },
      body: {
        he: 'כל הספקים אישרו שקיבלו את חלקם במלואו.',
        en: 'Every provider confirmed receiving their part in full.',
        ar: 'أكّد جميع المزوّدين أنهم استلموا حصتهم كاملة.'
      }
    },
    channels: ['socket', 'push'],
    metadata: { type: 'dealPaid', url: '/deals' }
  },
  updateStrategy: { type: 'none' }
};
