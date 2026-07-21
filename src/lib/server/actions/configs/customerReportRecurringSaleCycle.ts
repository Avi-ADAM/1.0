/**
 * Action Configuration: Customer reports the monthly transfer on a
 * recurring-sale cycle (PLAN_RECURRING_SALES)
 *
 * A recurring engine may name a paying customer (a registered user — e.g. a
 * client on a monthly retainer or standing order). Each month, on the open
 * cycle, the customer reports how much they actually transferred
 * (customerAmount, 0 = "I paid nothing this month"). This is a claim about
 * the seller's incoming money, so it does NOT count anywhere by itself: the
 * cycle stays pending until the money-holder reports/confirms the received
 * amount ("התקבל"), which is the bilateral second half of the flow.
 *
 * The customer may re-report while the cycle is still pending (their latest
 * word stands, like a counter round). The holder is notified each time.
 *
 * Note: the customer is usually NOT a member of the selling rikma, so this
 * action deliberately has no projectMember rule — the entity-level check is
 * "the cycle's customer is the caller".
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { cycleSaleId, amount } = params as { cycleSaleId: string; amount: number };
  const userId = String(context.userId);
  const nowISO = new Date().toISOString();

  const transferred = Number(amount);
  if (Number.isNaN(transferred) || transferred < 0) {
    throw new Error('customerReportRecurringSaleCycle: a valid non-negative amount is required');
  }

  // 1. Fetch the cycle (server-authoritative state).
  const res: any = await strapi.execute(
    'mrsGetCycleForReport',
    { id: String(cycleSaleId) },
    context.jwt,
    context.fetch
  );
  const cycle = res?.data?.sale?.data;
  if (!cycle) throw new Error(`Recurring-sale cycle ${cycleSaleId} not found`);
  const attrs = cycle.attributes ?? {};

  if (!attrs.recurringSource?.data) {
    throw new Error('This sale is not a recurring-sale cycle');
  }
  if (attrs.pending !== true) {
    throw new Error('This cycle is already settled — nothing to report');
  }

  // Entity-level auth: only the named customer reports the transfer.
  const customerId = String(attrs.customer?.data?.id ?? '');
  if (!customerId || customerId !== userId) {
    throw new Error('Only the customer of this standing order can report a transfer');
  }

  // 2. Record the customer's word (latest report stands while pending).
  await strapi.execute(
    'mrsCustomerReportCycle',
    { id: String(cycleSaleId), customerAmount: transferred, customerReportedAt: nowISO },
    context.jwt,
    context.fetch
  );

  // 3. Nudge the holder to confirm "התקבל".
  const holderId = String(attrs.users_permissions_user?.data?.id ?? '');
  if (notifier && holderId) {
    try {
      const productName = attrs.matanot?.data?.attributes?.name ?? '';
      const projectName = attrs.project?.data?.attributes?.projectName ?? '';
      const customerName = attrs.customer?.data?.attributes?.username ?? '';
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: 'הלקוח דיווח על העברה חודשית',
              en: 'Customer reported a monthly transfer'
            },
            body: {
              he: `${customerName} דיווח שהעביר ${transferred}₪ החודש${productName ? ` עבור ${productName}` : ''}. היכנסו למרכז המכירות לאשר שהתקבל.`,
              en: `${customerName} reported transferring ${transferred}₪ this month${productName ? ` for ${productName}` : ''}. Confirm receipt in the sales center.`
            }
          },
          channels: ['socket', 'push', 'email'],
          metadata: {
            type: 'recurringSaleCustomerReport',
            url: 'deals/sales-center',
            projectName,
            priority: 'normal'
          }
        },
        { recipients: [holderId] },
        res,
        context
      );
    } catch (e) {
      console.warn('customerReportRecurringSaleCycle: holder notification failed', e);
    }
  }

  return {
    data: { cycleSaleId: String(cycleSaleId), customerAmount: transferred },
    updateStrategy: { type: 'none' }
  };
};

export const customerReportRecurringSaleCycleConfig: ActionConfig = {
  key: 'customerReportRecurringSaleCycle',
  description:
    'The paying customer of a recurring sale reports how much they transferred this month on the open cycle (0 allowed, re-reporting allowed while pending). Notifies the money-holder to confirm receipt; the cycle only counts once the holder reports.',
  graphqlOperation: handler,

  paramSchema: {
    cycleSaleId: { type: 'string', required: true, description: 'ID of the pending cycle Sale' },
    amount: { type: 'number', required: true, description: 'Amount the customer transferred this month' }
  },

  // The customer is typically not a rikma member — entity-level check in the
  // handler (the cycle's customer must be the caller).
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to report a transfer' }],

  updateStrategy: { type: 'none' }
};
