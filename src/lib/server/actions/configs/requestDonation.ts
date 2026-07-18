import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * A supporter's donation intent → the rikma's members (PLAN_VOLUNTEER_RIKMA §2.2).
 *
 * Guest clearing (real online payment) is blocked on PLAN_MONEY_RAILS (P6), so
 * until a rail is live the honest primitive is *coordination*: an identified
 * site user tells the rikma "I want to give", and every member is notified so
 * one of them can arrange to receive the money and then record it with
 * `createDonationSale`. No Sale is created here — money has not arrived yet, and
 * coverage/splits only ever count effective income.
 *
 * This is the "communication between a person and the rikma" the plan calls
 * for; the actual donation is recorded (effective) at the receive step.
 */

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const {
    projectId,
    from = null,
    amount = null,
    msg = null,
    contact = null
  } = params as {
    projectId: string;
    from?: string | null;
    amount?: number | null;
    msg?: string | null;
    contact?: string | null;
  };

  const projInfo = await strapi.execute(
    'donationProjectInfo',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projAttrs = projInfo?.data?.project?.data?.attributes;
  const memberIds: string[] = (projAttrs?.user_1s?.data ?? []).map((m: any) => String(m.id));
  const projectName: string = projAttrs?.projectName ?? '';

  if (memberIds.length === 0) {
    throw new Error('This rikma has no members to receive a donation');
  }

  const donor = from?.trim() || (context.lang === 'en' ? 'A supporter' : 'תומך/ת');
  const amountPart =
    typeof amount === 'number' && amount > 0 ? ` (${amount}₪)` : '';

  if (notifier) {
    const details: string[] = [];
    if (msg?.trim()) details.push(msg.trim());
    if (contact?.trim())
      details.push((context.lang === 'en' ? 'Contact: ' : 'ליצירת קשר: ') + contact.trim());
    const tail = details.length ? ` — ${details.join(' · ')}` : '';

    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
        templates: {
          title: {
            he: '💗 מישהו רוצה לתרום',
            en: '💗 Someone wants to donate'
          },
          body: {
            he: `${donor} מעוניין/ת לתרום ל"${projectName}"${amountPart}${tail}. תיאמו קבלת הכסף ורשמו את התרומה כדי שתיכנס לחישוב הכיסוי.`,
            en: `${donor} wants to donate to "${projectName}"${amountPart}${tail}. Coordinate receiving the money and record the donation so it counts toward coverage.`
          }
        },
        channels: ['socket', 'push'],
        metadata: { type: 'donationRequest', url: `moach/${projectId}/sales`, projectName, priority: 'normal' }
      },
      { recipients: memberIds, projectId },
      null,
      context
    );
  }

  return {
    data: { success: true, notified: memberIds.length },
    updateStrategy: { type: 'none' }
  };
};

export const requestDonationConfig: ActionConfig = {
  key: 'requestDonation',
  description:
    "Notify a rikma's members that an identified supporter wants to donate, so a member can arrange receipt and record it. Creates no Sale.",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    from: { type: 'string', required: false },
    amount: { type: 'number', required: false },
    msg: { type: 'string', required: false },
    contact: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to request a donation' }],
  updateStrategy: { type: 'none' }
};
