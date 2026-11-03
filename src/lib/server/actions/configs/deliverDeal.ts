/**
 * A member of the rikma says a fixed-price deal was delivered (PLAN_DEAL_PRICING_TRACKS P6).
 *
 * It opens a round of the deal's `dealReceipt` Decision that asks every customer
 * (`$lib/server/deal/receipt`). She approves, or answers with what is still missing; her
 * silence for the rikma's restime is her receipt. Only a fixed-price deal has this step.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { deliverDeal } from '$lib/server/deal/receipt.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const sheirutId = params.sheirutId != null ? String(params.sheirutId) : '';
  if (!sheirutId) throw new Error('deliverDeal: sheirutId is required');
  const me = String(context.userId);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const why = typeof params.why === 'string' ? params.why.slice(0, 2000) : null;

  const { decisionId, deadline, receipt } = await deliverDeal(run, { sheirutId, userId: me, why });

  const recipients = receipt.customerIds.filter((c) => c !== me);
  if (notifier && recipients.length > 0) {
    await notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates: {
            title: {
              he: 'הרקמה מסרה את מה שהזמנת',
              en: 'The rikma delivered what you ordered',
              ar: 'سلّمت الريكما ما طلبته',
              ru: 'Рикма передала то, что вы заказали',
              es: 'La rikma entregó lo que pediste'
            },
            body: {
              he: 'אפשר לאשר שקיבלת, או לכתוב מה עוד חסר. אם לא תעני עד המועד שמופיע בעמוד העסקה, הקבלה תאושר.',
              en: 'Approve that you received it, or write what is still missing. If there is no answer by the time shown on the deal page, the receipt is approved.',
              ar: 'وافق على أنك استلمته، أو اكتب ما زال ناقصًا. إن لم يصل رد حتى الموعد المبيّن في صفحة الصفقة، يُعتمد الاستلام.',
              ru: 'Подтвердите получение или напишите, чего ещё не хватает. Если ответа не будет до срока на странице сделки, получение будет подтверждено.',
              es: 'Aprueba que lo recibiste o escribe qué falta todavía. Si no hay respuesta antes de la fecha que muestra la página del trato, la recepción queda aprobada.'
            }
          },
          // Her silence matures it, so this is a consent she is asked for.
          intent: 'consent',
          metadata: { type: 'dealReceiptToAnswer', url: `/deals/${sheirutId}`, priority: 'high' }
        },
        { recipients, projectId: receipt.projectId },
        { data: { sheirutId, decisionId } },
        context
      )
      .catch((e: unknown) => console.warn('[deliverDeal] the customer was not told:', e));
  }

  return {
    data: { sheirutId, decisionId, deadline, projectId: receipt.projectId },
    updateStrategy: { type: 'none' as const }
  };
};

export const deliverDealConfig: ActionConfig = {
  key: 'deliverDeal',
  description:
    'A member of the rikma says a fixed-price deal was delivered: the customer approves, or answers with what is missing; her silence for the restime is her receipt (PLAN_DEAL_PRICING_TRACKS P6).',
  graphqlOperation: handler,
  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'The deal (Sheirut) id' },
    why: { type: 'string', required: false, description: 'What was delivered, in the member’s words' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('deal', p.sheirutId), scope('project', r?.data?.projectId)])
  }
};
