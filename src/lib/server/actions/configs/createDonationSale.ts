import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { buildDonationNote, type DonationVia } from '$lib/revenue/parseDonationNote';

/**
 * Record a donation (PLAN_VOLUNTEER_RIKMA §2.1).
 *
 * A donation is a Sale with **no linked product**, `isDonation: true` and a
 * structured note (buildDonationNote). It rides the exact same holder-consent
 * machinery as an ordinary sale (PLAN_sale_holder_consent), so the two cases
 * are split by comparing the money-holder (`params.userId`) to the reporter:
 *
 *  1. holder === reporter → sovereign self-report. A rikma member logging a
 *     donation that arrived to them: `holderStatus:'self'`, effective at once.
 *  2. holder ≠ reporter → a claim about that member's financial state (e.g. a
 *     supporter reporting "I transferred 100₪ to Dana"). `holderStatus:'open'`
 *     + a bilateral `saleClaim` Decision + a restime timegrama; only the
 *     claimed holder is notified. Counted in coverage/splits only once
 *     **effective** — never while `open`.
 *
 * Reporter need not be a project member (an external supporter may report a
 * donation they gave), but the money-holder always must be one.
 */

// restime enum → milliseconds (mirrors createSale.ts; inlined so this server
// module has no dependency on a .svelte file).
function restimeToMs(restime: string | null | undefined): number {
  switch (restime) {
    case 'feh':    return 48 * 60 * 60 * 1000;
    case 'sth':    return 72 * 60 * 60 * 1000;
    case 'nsh':    return 96 * 60 * 60 * 1000;
    case 'sevend': return 168 * 60 * 60 * 1000;
    default:       return 72 * 60 * 60 * 1000; // safe default: 72h
  }
}

const handler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
  const {
    projectId,
    userId,
    amount,
    saleDate,
    from = null,
    msg = null,
    via = 'manual'
  } = params as {
    projectId: string;
    userId: string;
    amount: number;
    saleDate?: string | null;
    from?: string | null;
    msg?: string | null;
    via?: DonationVia;
  };

  const now = new Date().toISOString();
  const reporterId = String(context.userId);
  const holderId = String(userId);
  const isSelf = holderId === reporterId;

  // We always need the member list (validate the holder is a rikma member) and
  // — for the claim path — restime + the project name for the notification.
  const projInfo = await strapi.execute(
    'donationProjectInfo',
    { pid: projectId },
    context.jwt,
    context.fetch
  );
  const projAttrs = projInfo?.data?.project?.data?.attributes;
  const memberIds: string[] = (projAttrs?.user_1s?.data ?? []).map((m: any) => String(m.id));
  if (!memberIds.includes(holderId)) {
    throw new Error('The money-holder must be a member of this rikma');
  }
  const restime: string | null = projAttrs?.restime ?? null;
  const projectName: string = projAttrs?.projectName ?? '';

  const holderStatus = isSelf ? 'self' : 'open';
  const note = buildDonationNote({ from, via, msg });
  const date = saleDate || now;

  // 1. Create the donation Sale (no product, isDonation:true).
  const saleRes = await strapi.execute(
    'createDonationSaleRecord',
    {
      project: String(projectId),
      users_permissions_user: holderId,
      in: Number(amount),
      date,
      publishedAt: now,
      note,
      reporter: reporterId,
      holderStatus
    },
    context.jwt,
    context.fetch
  );
  const saleData = saleRes?.data?.createSale?.data;
  if (!saleData?.id) throw new Error('Failed to record donation');
  const saleId = String(saleData.id);

  // 2. Other-holder path → open a bilateral saleClaim Decision.
  let decisionId: string | undefined;
  if (!isSelf) {
    const round1Vote = {
      what: true,
      users_permissions_user: reporterId,
      ide: parseInt(reporterId, 10),
      zman: now,
      order: 1
    };
    const decisionName = `${from ? `${from} · ` : ''}תרומה · ${Number(amount)}₪`;

    const decRes = await strapi.execute(
      'createSaleClaimDecision',
      {
        projectIds: [projectId],
        sale: saleId,
        decisionName,
        publishedAt: now,
        vots: [round1Vote]
      },
      context.jwt,
      context.fetch
    );
    decisionId = decRes?.data?.createDecision?.data?.id
      ? String(decRes.data.createDecision.data.id)
      : undefined;

    if (decisionId) {
      try {
        await strapi.execute(
          'updateSaleHolderLink',
          { id: saleId, decision: decisionId, holderStatus: 'open' },
          context.jwt,
          context.fetch
        );
      } catch (err) {
        console.warn('[createDonationSale] sale↔decision link failed:', err);
      }

      try {
        const dueAt = new Date(Date.now() + restimeToMs(restime)).toISOString();
        await strapi.execute(
          '32createTimeGrama',
          { date: dueAt, whatami: 'decision', decision: decisionId },
          context.jwt,
          context.fetch
        );
      } catch (err) {
        console.warn('[createDonationSale] timegrama creation failed:', err);
      }
    }

    // Notify the claimed holder only (targeted, not the whole rikma).
    if (notifier && decisionId) {
      try {
        await notifier.notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: 'תרומה שדווחה ממתינה לאישורך',
                en: 'A reported donation awaits your confirmation'
              },
              body: {
                he: `דווח שהתקבלה אצלך תרומה של ${Number(amount)}₪${from ? ` מ${from}` : ''}. אפשר לאשר, לדייק (משא-ומתן) או לברר. אם לא תגיב — תאושר אוטומטית בתום זמן התגובה של הריקמה.`,
                en: `It was reported that you received a ${Number(amount)}₪ donation${from ? ` from ${from}` : ''}. You can approve, refine (negotiate) or discuss. If you don't respond it is auto-approved after the rikma's response time.`
              }
            },
            channels: ['socket', 'push'],
            metadata: { type: 'saleClaim', url: 'lev', projectName, priority: 'normal' }
          },
          { recipients: [holderId], projectId, saleId, decisionId },
          decRes,
          context
        );
      } catch (err) {
        console.warn('[createDonationSale] holder notification failed:', err);
      }
    }
  }

  return {
    data: {
      success: true,
      saleId,
      saleIn: saleData.attributes?.in,
      holderStatus,
      decisionId
    },
    updateStrategy: { type: 'none' }
  };
};

export const createDonationSaleConfig: ActionConfig = {
  key: 'createDonationSale',
  description:
    'Record a donation as a productless Sale (isDonation). Self-held → effective at once; held by another member → bilateral saleClaim consent.',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    saleDate: { type: 'string', required: false },
    from: { type: 'string', required: false },
    msg: { type: 'string', required: false },
    via: { type: 'string', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'Must be logged in to record a donation' }],
  updateStrategy: { type: 'none' }
};
