/**
 * Action: markStipendTransferSent (docs/PLAN_STIPEND.md §6).
 *
 * The second half of a cycle the funder closed before the money moved.
 * `settleStipendCycle({ transferred: false })` fixed the amount — derived from
 * approved hours, never typed — and opened a transfer both sides can see and
 * talk in. This is the funder saying the money has now gone out.
 *
 * It is the moment the recipient's clock may start, and not a moment earlier:
 * silence can confirm the arrival of money that was sent, never of money that
 * was not. Everything after this is the ordinary confirmation path.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { calcDeadlineMs } from './actionUtils.js';
import { dateField, fields, gqlStr, run, strField } from '$lib/server/archive/gql.js';
import { fetchPayment, fetchProjectContext } from '$lib/server/stipend/read.js';

const handler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const paymentId = String(params.paymentId ?? '');
  if (!paymentId) throw new Error('paymentId is required');

  const exec = execFromContext(context);
  const userId = String(context.userId);

  const payment = await fetchPayment(exec, paymentId);
  if (!payment) throw new Error(`Stipend payment ${paymentId} not found`);
  if (payment.funderId !== userId) {
    throw new Error('Only the funder can say the transfer went out');
  }
  if (payment.status === 'confirmed') {
    throw new Error('This payment is already confirmed — the recipient got there first');
  }
  if (payment.status === 'cancelled') {
    throw new Error('This payment was already closed at zero');
  }
  if (payment.status === 'sent') {
    return { data: { paymentId, status: 'sent', alreadySent: true }, updateStrategy: { type: 'none' as const } };
  }

  const nowISO = new Date().toISOString();
  await run(
    exec,
    `mutation { updateStipendPayment(id: ${gqlStr(paymentId)}, data: { status: sent }) { data { id } } }`,
    'markStipendTransferSent'
  );

  if (payment.halukaId) {
    await run(
      exec,
      `mutation { updateHaluka(id: ${gqlStr(payment.halukaId)}, data: { senderconf: true }) { data { id } } }`,
      'markStipendTransferSent:haluka'
    ).catch((e) => console.warn('[markStipendTransferSent] haluka update failed (non-fatal):', e));
  }

  // Now — and only now — silence starts meaning "it arrived".
  let timegramaId: string | null = payment.timegramaId;
  if (!timegramaId) {
    try {
      const project = payment.projectId ? await fetchProjectContext(exec, payment.projectId) : null;
      const deadline = new Date(Date.now() + calcDeadlineMs(project?.restime ?? 'feh'));
      const tg = await run(
        exec,
        `mutation { createTimegrama(data: { ${fields(
          dateField('date', deadline),
          strField('whatami', 'stipend_payment'),
          strField('stipend_payment', paymentId),
          'done: false'
        )} }) { data { id } } }`,
        'markStipendTransferSent:timegrama'
      );
      timegramaId = tg?.createTimegrama?.data?.id ? String(tg.createTimegrama.data.id) : null;
    } catch (e) {
      console.warn('[markStipendTransferSent] confirmation clock failed:', e);
    }
  }

  if (notifier && payment.recipientId) {
    notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: { he: 'מלגת הקיום נשלחה', en: 'Your stipend was sent' },
            body: {
              he: `₪${payment.amount} יצאו אליך. אישור הקבלה הוא מה שמעדכן את האחוזים — בלעדיו כלום לא זז.`,
              en: `${payment.amount} is on its way. Confirming it arrived is what updates the shares — until then nothing moves.`
            }
          },
          channels: ['socket', 'push'],
          metadata: { type: 'stipendPayment', url: 'lev', priority: 'high' }
        },
        { recipients: [payment.recipientId], projectId: payment.projectId },
        { projectId: payment.projectId },
        context
      )
      .catch((e: unknown) => console.warn('[markStipendTransferSent] notification failed:', e));
  }

  return {
    data: { paymentId, status: 'sent', timegramaId, sentAt: nowISO },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

export const markStipendTransferSentConfig: ActionConfig = {
  key: 'markStipendTransferSent',
  description:
    'The funder marks a pending stipend transfer as actually sent: the payment moves pending → sent, the Haluka gets senderconf, and the recipient’s confirmation clock starts.',
  graphqlOperation: handler,

  paramSchema: {
    paymentId: { type: 'string', required: true, description: 'The pending stipend-payment row' }
  },

  // Ownership is checked against the payment row itself (`payment.funderId`)
  // rather than a `self` rule: the funder is a property of the record, not a
  // client-supplied parameter.
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to mark a stipend transfer sent' }],

  updateStrategy: { type: 'fullRefresh' }
};
