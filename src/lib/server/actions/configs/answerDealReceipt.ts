/**
 * The customer answers a fixed-price deal's delivery (PLAN_DEAL_PRICING_TRACKS P6).
 *
 * `accept` — she has it; once every customer of the deal said so, it is received
 * (`Sheirut.productExepted`). `defects` — what is still missing, in her words: a counter,
 * never a "no". It stops her clock until the rikma delivers again
 * (`$lib/server/deal/receipt`).
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { answerDealReceipt } from '$lib/server/deal/receipt.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const sheirutId = params.sheirutId != null ? String(params.sheirutId) : '';
  const answer = params.answer === 'accept' ? 'accept' : params.answer === 'defects' ? 'defects' : null;
  if (!sheirutId || !answer) throw new Error("answerDealReceipt: sheirutId and answer ('accept' | 'defects') are required");
  const me = String(context.userId);
  const run = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const why = typeof params.why === 'string' ? params.why.slice(0, 2000) : null;

  const { received, receipt } = await answerDealReceipt(run, { sheirutId, userId: me, answer, why });

  const recipients = receipt.memberIds.filter((m) => m !== me);
  if (notifier && recipients.length > 0 && (received || answer === 'defects')) {
    await notifier
      .notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
          templates:
            answer === 'defects'
              ? {
                  title: {
                    he: 'הלקוחה כתבה מה עוד חסר',
                    en: 'The customer wrote what is still missing',
                    ar: 'كتبت الزبونة ما زال ناقصًا',
                    ru: 'Клиентка написала, чего ещё не хватает',
                    es: 'La clienta escribió lo que aún falta'
                  },
                  body: {
                    he: 'אפשר לראות את הרשימה בעמוד העסקה. כשזה מתוקן, מסמנים שוב שהעבודה נמסרה.',
                    en: 'The list is on the deal page. Once it is fixed, mark the deal delivered again.',
                    ar: 'القائمة في صفحة الصفقة. حين يُصلَح ذلك، علّموا الصفقة كمسلّمة من جديد.',
                    ru: 'Список — на странице сделки. Когда всё исправлено, снова отметьте сделку переданной.',
                    es: 'La lista está en la página del trato. Cuando esté arreglado, marquen el trato como entregado otra vez.'
                  }
                }
              : {
                  title: {
                    he: 'הלקוחה אישרה שקיבלה',
                    en: 'The customer confirmed receiving it',
                    ar: 'أكدت الزبونة الاستلام',
                    ru: 'Клиентка подтвердила получение',
                    es: 'La clienta confirmó que lo recibió'
                  },
                  body: {
                    he: 'העסקה נמסרה והתקבלה.',
                    en: 'The deal was delivered and received.',
                    ar: 'سُلّمت الصفقة واستُلمت.',
                    ru: 'Сделка передана и получена.',
                    es: 'El trato se entregó y se recibió.'
                  }
                },
          intent: answer === 'defects' ? 'consent' : 'outcome',
          metadata: { type: 'dealReceiptAnswered', url: `/deals/${sheirutId}`, priority: answer === 'defects' ? 'high' : 'normal' }
        },
        { recipients, projectId: receipt.projectId },
        { data: { sheirutId, answer } },
        context
      )
      .catch((e: unknown) => console.warn('[answerDealReceipt] the rikma was not told:', e));
  }

  return {
    data: { sheirutId, answer, received, projectId: receipt.projectId },
    updateStrategy: { type: 'none' as const }
  };
};

export const answerDealReceiptConfig: ActionConfig = {
  key: 'answerDealReceipt',
  description:
    "The customer of a fixed-price deal answers its delivery: 'accept' (received once every customer did) or 'defects' with what is missing — a counter, never a no (PLAN_DEAL_PRICING_TRACKS P6).",
  graphqlOperation: handler,
  paramSchema: {
    sheirutId: { type: 'string', required: true, description: 'The deal (Sheirut) id' },
    answer: { type: 'string', required: true, description: "'accept' or 'defects'" },
    why: { type: 'string', required: false, description: "What is still missing (required with 'defects')" }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in' }],
  updateStrategy: { type: 'none' },
  realtime: {
    scopes: (p, r) => scopeList([scope('deal', p.sheirutId), scope('project', r?.data?.projectId)])
  }
};
