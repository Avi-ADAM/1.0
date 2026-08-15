/**
 * Action: confirmStipendPayment (docs/PLAN_STIPEND.md §6).
 *
 * The recipient says the money arrived. This is the only event in the whole
 * feature that moves a percentage:
 *
 *   > **The invariant:** only `confirmed = true` writes equityCredit /
 *   > equityDebit. An unconfirmed payment does not move a single share.
 *
 * "I received nothing" is not a veto and not a dispute flow — it is a counter
 * of amount 0 (`amount: 0`), which closes the row at what actually arrived and
 * leaves the pledge running. A partial arrival is the same move with the real
 * number.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { dateField, fields, gqlStr, numField, run } from '$lib/server/archive/gql.js';
import { computeStipendEquity } from '$lib/stipend/computeStipendEquity.js';
import { fetchPayment, fetchPledge, fetchProgram } from '$lib/server/stipend/read.js';

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const paymentId = String(params.paymentId ?? '');
  if (!paymentId) throw new Error('paymentId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const payment = await fetchPayment(exec, paymentId);
  if (!payment) throw new Error(`Stipend payment ${paymentId} not found`);
  if (payment.recipientId !== userId) {
    throw new Error('Only the recipient can confirm a stipend payment arrived');
  }
  if (payment.status === 'confirmed') {
    throw new Error('This payment is already confirmed');
  }
  if (payment.status === 'cancelled') {
    throw new Error('This payment was already closed at zero');
  }

  // What actually arrived. Defaults to what was sent; a counter says otherwise.
  const received =
    params.receivedAmount != null ? Math.max(0, Number(params.receivedAmount)) : payment.amount;
  if (!Number.isFinite(received)) throw new Error('receivedAmount must be a number');
  if (received > payment.amount) {
    throw new Error('More cannot have arrived than was sent — settle the difference as its own cycle');
  }

  const pledge = payment.pledgeId ? await fetchPledge(exec, payment.pledgeId) : null;
  const lines = computeStipendEquity(received, pledge?.terms ?? { mode: payment.mode });
  const nowISO = new Date().toISOString();
  const nothingArrived = received <= 0;

  await run(
    exec,
    `mutation { updateStipendPayment(id: ${gqlStr(paymentId)}, data: { ${fields(
      numField('amount', received),
      numField('equityCredit', lines.equityCredit),
      numField('equityDebit', lines.equityDebit),
      nothingArrived ? 'status: cancelled' : 'status: confirmed',
      nothingArrived ? null : 'confirmedBy: recipient',
      dateField('confirmedAt', nowISO)
    )} }) { data { id } } }`,
    'confirmStipendPayment'
  );

  // The money leg follows the same answer.
  if (payment.halukaId) {
    await run(
      exec,
      `mutation { updateHaluka(id: ${gqlStr(payment.halukaId)}, data: { ${fields(
        numField('amount', received),
        nothingArrived ? 'confirmed: false' : 'confirmed: true'
      )} }) { data { id } } }`,
      'confirmStipendPayment:haluka'
    ).catch((e) => console.warn('[confirmStipendPayment] haluka update failed (non-fatal):', e));
  }

  // Stop the "no answer = confirmed" clock; it has its answer.
  if (payment.timegramaId) {
    await run(
      exec,
      `mutation { updateTimegrama(id: ${gqlStr(payment.timegramaId)}, data: { done: true }) { data { id } } }`,
      'confirmStipendPayment:timegrama'
    ).catch((e) => console.warn('[confirmStipendPayment] closing the clock failed (non-fatal):', e));
  }

  // Give back what never arrived: the pledge's and the program's spent counters
  // were moved at settlement time on the assumption of a full transfer.
  const shortfall = Math.round((payment.amount - received) * 100) / 100;
  if (shortfall > 0 && pledge) {
    await run(
      exec,
      `mutation { updateStipendPledge(id: ${gqlStr(pledge.id)}, data: { ${fields(
        numField('paidTotal', Math.max(0, Math.round((pledge.paidTotal - shortfall) * 100) / 100)),
        pledge.status === 'exhausted' ? 'status: active' : null
      )} }) { data { id } } }`,
      'confirmStipendPayment:refundPledge'
    ).catch((e) => console.warn('[confirmStipendPayment] pledge counter rollback failed:', e));

    if (payment.programId) {
      const program = await fetchProgram(exec, payment.programId);
      if (program) {
        await run(
          exec,
          `mutation { updateStipendProgram(id: ${gqlStr(program.id)}, data: { ${fields(
            numField('spent', Math.max(0, Math.round((program.spent - shortfall) * 100) / 100)),
            program.status === 'exhausted' ? 'status: active' : null
          )} }) { data { id } } }`,
          'confirmStipendPayment:refundProgram'
        ).catch((e) => console.warn('[confirmStipendPayment] program counter rollback failed:', e));
      }
    }
  }

  if (notifier && payment.funderId) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: nothingArrived
              ? { he: 'המלגה לא התקבלה', en: 'The stipend did not arrive' }
              : { he: 'המלגה התקבלה', en: 'The stipend arrived' },
            body: nothingArrived
              ? {
                  he: 'המקבל דיווח שלא הגיע כסף. ההתחייבות ממשיכה — אפשר לשלוח שוב ולסגור את המחזור מחדש.',
                  en: 'The recipient reported nothing arrived. The pledge is still running — send again and settle the cycle afresh.'
                }
              : {
                  he: `אושר קבלת ₪${received}. האחוזים עודכנו בהתאם לתנאי המלגה.`,
                  en: `Receipt of ${received} confirmed. The shares moved according to the pledge's terms.`
                }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'stipendPayment', url: 'lev', priority: 'normal' }
        },
        { recipients: [payment.funderId], projectId: payment.projectId },
        { projectId: payment.projectId },
        context
      )
      .catch((e: unknown) => console.warn('[confirmStipendPayment] notification failed:', e));
  }

  return {
    data: {
      paymentId,
      received,
      shortfall,
      status: nothingArrived ? 'cancelled' : 'confirmed',
      equityCredit: lines.equityCredit,
      equityDebit: lines.equityDebit
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const confirmStipendPaymentConfig: ActionConfig = {
  key: 'confirmStipendPayment',
  description:
    'Recipient confirms a stipend payment arrived (or counters with what actually did). This is the only write that moves equity: equityCredit/equityDebit count only once the row is confirmed.',
  graphqlOperation: handler,

  paramSchema: {
    paymentId: { type: 'string', required: true, description: 'The stipend-payment row' },
    receivedAmount: {
      type: 'number',
      required: false,
      description: 'What actually arrived — omit for "all of it", 0 for "nothing arrived"'
    }
  },

  // Ownership is checked against the payment row itself in the handler
  // (`payment.recipientId !== userId`) rather than through a `self` rule: the
  // recipient is a property of the record, not a client-supplied parameter.
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to confirm a stipend payment' }],

  updateStrategy: { type: 'fullRefresh' }
};
