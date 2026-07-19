/**
 * Action Configuration: Monthly report on a recurring-sale cycle
 * (PLAN_RECURRING_SALES)
 *
 * Each month the monther opens a pending cycle Sale (pending:true,
 * holderStatus:'open') under a recurring engine (a standing order /
 * subscription). The money-holder reports how much actually came in this
 * month — including 0 ("nothing came in" is amount 0, never a veto).
 *
 * Reporting turns the cycle into an effective self-reported sale
 * (holderStatus:'self', pending:false) so it flows into tosplits like any
 * other sale. If the paying customer already reported a transferred amount,
 * confirming their exact amount also stamps receivedConfirmedAt ("התקבל").
 *
 * Optionally the holder can close the standing order in the same gesture
 * (closeEngine:true) — e.g. the customer cancelled — which stops future
 * cycles (engine isMonterActive:false + finishDate:now).
 *
 * Server-authoritative: the client sends only cycleSaleId + amount (+ flags);
 * holder identity, pending state and the engine are resolved from the DB.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const { cycleSaleId, amount, note, closeEngine } = params as {
    cycleSaleId: string;
    amount: number;
    note?: string;
    closeEngine?: boolean;
  };
  const userId = String(context.userId);
  const nowISO = new Date().toISOString();

  const reported = Number(amount);
  if (Number.isNaN(reported) || reported < 0) {
    throw new Error('reportRecurringSaleCycle: a valid non-negative amount is required');
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

  const engine = attrs.recurringSource?.data;
  if (!engine) throw new Error('This sale is not a recurring-sale cycle');
  if (attrs.pending !== true) {
    throw new Error('This cycle was already reported');
  }

  // Entity-level auth: only the money-holder of the cycle reports it.
  const holderId = String(attrs.users_permissions_user?.data?.id ?? '');
  if (holderId !== userId) {
    throw new Error('Only the money-holder can report this monthly cycle');
  }

  // 2. Report: the cycle becomes an effective self-reported sale.
  const customerAmount =
    attrs.customerAmount != null ? Number(attrs.customerAmount) : null;
  const confirmsCustomer = customerAmount != null && customerAmount === reported;

  const data: Record<string, unknown> = {
    in: reported,
    pending: false,
    holderStatus: 'self',
    date: nowISO,
    reporter: userId,
    holderDecidedAt: nowISO
  };
  if ((note as string)?.trim()) data.note = (note as string).trim();
  if (confirmsCustomer) data.receivedConfirmedAt = nowISO;

  await strapi.execute(
    'mrsReportCycleSale',
    { id: String(cycleSaleId), data },
    context.jwt,
    context.fetch
  );

  // 3. Optionally close the standing order (no further monthly cycles).
  let engineClosed = false;
  if (closeEngine === true) {
    try {
      await strapi.execute(
        'mrsCloseRecurringSale',
        { id: String(engine.id), finishDate: nowISO },
        context.jwt,
        context.fetch
      );
      engineClosed = true;
    } catch (e) {
      console.error('reportRecurringSaleCycle: failed to close engine', e);
    }
  }

  // 4. Tell the customer their standing order was recorded (if there is one).
  const customer = attrs.customer?.data;
  if (notifier && customer?.id) {
    try {
      const productName = attrs.matanot?.data?.attributes?.name ?? '';
      const projectName = attrs.project?.data?.attributes?.projectName ?? '';
      await notifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: 'התשלום החודשי שלך נרשם',
              en: 'Your monthly payment was recorded'
            },
            body: {
              he: `${projectName}: נרשם שהתקבלו ${reported}₪ החודש${productName ? ` עבור ${productName}` : ''}.`,
              en: `${projectName}: ${reported}₪ received this month${productName ? ` for ${productName}` : ''} was recorded.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'recurringSaleCycle', url: 'deals', projectName, priority: 'normal' }
        },
        { recipients: [String(customer.id)] },
        res,
        context
      );
    } catch (e) {
      console.warn('reportRecurringSaleCycle: customer notification failed', e);
    }
  }

  return {
    data: {
      cycleSaleId: String(cycleSaleId),
      amount: reported,
      receivedConfirmed: confirmsCustomer,
      engineClosed
    },
    updateStrategy: { type: 'none' }
  };
};

export const reportRecurringSaleCycleConfig: ActionConfig = {
  key: 'reportRecurringSaleCycle',
  description:
    "Money-holder reports how much actually came in this month on a pending recurring-sale cycle (0 allowed). Makes the cycle an effective self-reported sale (holderStatus:self, pending:false); confirming the customer's exact reported amount stamps receivedConfirmedAt; closeEngine:true also stops future cycles.",
  graphqlOperation: handler,

  paramSchema: {
    cycleSaleId: { type: 'string', required: true, description: 'ID of the pending cycle Sale' },
    amount: { type: 'number', required: true, description: "This month's actual amount (0 = nothing came in)" },
    note: { type: 'string', required: false },
    closeEngine: { type: 'boolean', required: false, description: 'Also close the standing order (no more cycles)' }
  },

  // Holder identity is checked entity-level in the handler (the cycle's
  // users_permissions_user must be the caller).
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to report a monthly cycle' }],

  updateStrategy: { type: 'none' }
};
