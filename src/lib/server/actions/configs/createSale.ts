import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { createSaleConsentSpec } from '$lib/consent/specs/createSale';

/**
 * Report a sale (PLAN_sale_holder_consent).
 *
 * Two materially different cases, split by comparing the claimed money-holder
 * (`params.userId`) against the reporter (`context.userId`):
 *
 *  1. holder === reporter → sovereign self-report. `holderStatus: 'self'`,
 *     final immediately. Nobody else has to agree.
 *  2. holder ≠ reporter → a claim about someone else's financial state, which
 *     requires their consent. `holderStatus: 'open'` + a `saleClaim` Decision
 *     (round 1, carrying the reporter's own YES vote) + a timegrama that will
 *     auto-approve the standing version after the project's restime if the
 *     holder stays silent. Only the holder is notified.
 *
 * Inventory is decremented immediately in both cases (reservation); if the
 * matured version differs in quantity, the delta is reconciled at approval
 * time (phases 2–3).
 */

// restime enum → milliseconds (mirrors $lib/func/calcX.svelte; inlined so this
// server module has no dependency on a .svelte file).
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
    productId,
    projectId,
    userId,
    total,
    quantity,
    saleDate,
    availableQuantity,
    kindOf = 'total',
    startDate = null,
    finishDate = null,
    note = '',
    externalId = null,
    source = null
  } = params as {
    productId: string;
    projectId: string;
    userId: string;
    total: number;
    quantity: number;
    saleDate: string;
    availableQuantity: number;
    kindOf?: string;
    startDate?: string | null;
    finishDate?: string | null;
    note?: string;
    externalId?: string | null;
    source?: string | null;
  };

  const now = new Date().toISOString();
  const reporterId = String(context.userId);
  const holderId = String(userId);
  const isSelf = holderId === reporterId;

  // For the other-holder path we need the project's member list (to validate
  // the claimed holder is actually a rikma member) and restime (to schedule the
  // silence-as-consent timegrama).
  let restime: string | null = null;
  let projectName = '';
  if (!isSelf) {
    const projInfo = await strapi.execute(
      'saleClaimProjectInfo',
      { pid: projectId },
      context.jwt,
      context.fetch
    );
    const projAttrs = projInfo?.data?.project?.data?.attributes;
    const memberIds: string[] = (projAttrs?.user_1s?.data ?? []).map((m: any) => String(m.id));
    if (!memberIds.includes(holderId)) {
      throw new Error('Claimed money-holder is not a member of this rikma');
    }
    restime = projAttrs?.restime ?? null;
    projectName = projAttrs?.projectName ?? '';
  }

  const holderStatus = isSelf ? 'self' : 'open';

  // 1. Create the sale record (with reporter + holderStatus).
  const saleVars: Record<string, unknown> = {
    project: projectId,
    matanot: productId,
    users_permissions_user: userId,
    in: Number(total),
    unit: Number(quantity),
    date: saleDate,
    publishedAt: now,
    reporter: reporterId,
    holderStatus
  };
  if (startDate) saleVars.startDate = startDate;
  if (finishDate) saleVars.finishDate = finishDate;
  if ((note as string)?.trim()) saleVars.note = (note as string).trim();
  // External Sales API: order id for idempotency + provenance tag.
  if ((externalId as string)?.trim()) saleVars.externalId = (externalId as string).trim();
  if (source) saleVars.source = source;

  const saleRes = await strapi.execute('createSaleRecord', saleVars, context.jwt, context.fetch);
  const saleData = saleRes?.data?.createSale?.data;
  if (!saleData?.id) throw new Error('Failed to create sale');
  const saleId = String(saleData.id);

  // 2. Decrement product quantity if not unlimited (reservation).
  let newQuantity: number | undefined;
  if (Number(quantity) > 0 && Number(availableQuantity) !== -1) {
    const newQuant = Number(availableQuantity) - Number(quantity);
    try {
      const quantRes = await strapi.execute(
        'updateMatanotQuant',
        { id: productId, quant: newQuant },
        context.jwt,
        context.fetch
      );
      newQuantity = quantRes?.data?.updateMatanot?.data?.attributes?.quant;
    } catch (err) {
      console.warn('[createSale] quantity update failed:', err);
    }
  }

  // 3. Create recurring Monter for open-ended monthly/yearly sales.
  if ((kindOf === 'monthly' || kindOf === 'yearly') && startDate && !finishDate) {
    try {
      await strapi.execute(
        'createMonterForSale',
        { saleId, start: startDate },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[createSale] monter creation failed:', err);
    }
  }

  // 4. Other-holder path → open a bilateral saleClaim Decision.
  let decisionId: string | undefined;
  if (!isSelf) {
    // Round-1 vote: the report itself IS the reporter's agreement to round 1.
    const round1Vote = {
      what: true,
      users_permissions_user: reporterId,
      ide: parseInt(reporterId, 10),
      zman: now,
      order: 1
    };
    const decisionName = `${saleData.attributes?.matanot?.data?.attributes?.name ?? 'מכירה'} · ${Number(total)}₪`;

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
      // Link the Decision back onto the Sale.
      try {
        await strapi.execute(
          'updateSaleHolderLink',
          { id: saleId, decision: decisionId, holderStatus: 'open' },
          context.jwt,
          context.fetch
        );
      } catch (err) {
        console.warn('[createSale] sale↔decision link failed:', err);
      }

      // Schedule the silence-as-consent timegrama (restime from now).
      try {
        const dueAt = new Date(Date.now() + restimeToMs(restime)).toISOString();
        await strapi.execute(
          '32createTimeGrama',
          { date: dueAt, whatami: 'decision', decision: decisionId },
          context.jwt,
          context.fetch
        );
      } catch (err) {
        console.warn('[createSale] timegrama creation failed:', err);
      }
    }

    // 5. Notify the claimed holder only (targeted, not the whole rikma).
    if (notifier && decisionId) {
      try {
        const productName = saleData.attributes?.matanot?.data?.attributes?.name ?? '';
        await notifier.notify(
          {
            recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
            templates: {
              title: {
                he: 'דיווח מכירה ממתין להסכמתך',
                en: 'A sale report awaits your consent'
              },
              body: {
                he: `דווח שקיבלת ${Number(total)}₪ ממכירת ${productName}. אפשר לאשר, לדייק (משא-ומתן) או לברר. אם לא תגיב — יאושר אוטומטית בתום זמן התגובה של הריקמה.`,
                en: `It was reported that you hold ${Number(total)}₪ from the sale of ${productName}. You can approve, refine (negotiate) or discuss. If you don't respond it is auto-approved after the rikma's response time.`
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
        console.warn('[createSale] holder notification failed:', err);
      }
    }
  }

  return {
    success: true,
    saleId,
    saleIn: saleData.attributes?.in,
    newQuantity,
    matana: saleData,
    holderStatus,
    decisionId
  };
};

export const createSaleConfig: ActionConfig = {
  key: 'createSale',
  description:
    'Report a sale. Self-held money → sovereign self-report (holderStatus:self). Money held by someone else → opens a bilateral saleClaim Decision (holderStatus:open) with a restime timegrama and notifies the holder.',
  graphqlOperation: handler,
  paramSchema: {
    productId: { type: 'string', required: true },
    projectId: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    total: { type: 'number', required: true },
    quantity: { type: 'number', required: true },
    saleDate: { type: 'string', required: true },
    availableQuantity: { type: 'number', required: true },
    kindOf: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    finishDate: { type: 'string', required: false },
    note: { type: 'string', required: false },
    externalId: { type: 'string', required: false },
    source: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be logged in to report a sale' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only project members can report sales'
    }
  ],
  // Shadow-signed sale.record event mirrors the reporter's attestation
  // (Phase 1 — non-blocking; enforcement lands in phase 4).
  consentSpec: createSaleConsentSpec
};
