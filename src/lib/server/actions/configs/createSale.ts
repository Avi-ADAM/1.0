import { noticeSubject } from '$lib/notices/links';
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { ENTRY_CURRENCY_PARAM, entryFields, normalizeEntry } from '$lib/server/money/normalizeEntry.js';
import { formatMoney } from '$lib/money/format.js';
import { rikmaCurrency } from '$lib/money/resolve.js';
import { createSaleConsentSpec } from '$lib/consent/specs/createSale';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';
import { LEGACY_UNLIMITED, moveStock, type StockFields } from '$lib/shop/stock.js';
import { readStockFlags, writeStock } from '$lib/server/shop/stockFlags.js';
import type { ProbeRun } from '$lib/server/apiPublic/schemaProbe.js';

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
 *
 * Variants (PLAN_SHOP_CUSTOMER_EXPERIENCE §2.3–§2.4, S3): a sale of a product
 * that is sold by variant must name the variant (`variantId`), and then the
 * stock that moves is the **variant's** — read from the server here, never
 * taken from the caller, because two buyers on the same SKU would otherwise
 * both decrement from the same stale number. `Matanot.quant` is left alone on
 * that path: for a variant product the product-level total is `stockTotal`,
 * which the `product-variant` lifecycle in `1.0b` derives from the variants.
 * `orderId` links the sale to the paid order it is one line of.
 */

/** "This deployment's schema has no variants yet" — expected during rollout. */
function isSchemaMissing(err: unknown): boolean {
  const text = err instanceof Error ? err.message : JSON.stringify(err ?? '');
  return /GRAPHQL_VALIDATION_FAILED|Cannot query field|Unknown type|QUERY_NOT_FOUND|not found in QIDS/i.test(
    text
  );
}

/**
 * Is this product sold by variant? A probe failure never blocks a sale: the
 * guard exists to keep `Matanot.quant` from moving under a variant product,
 * and a schema without the column has no variant products at all.
 */
async function productHasVariants(
  strapi: { execute: (...args: any[]) => Promise<any> },
  productId: string,
  context: ActionContext
): Promise<boolean> {
  try {
    const res = await strapi.execute(
      'saleProductHasVariants',
      { id: productId },
      context.jwt,
      context.fetch
    );
    return res?.data?.matanot?.data?.attributes?.hasVariants === true;
  } catch (err) {
    if (!isSchemaMissing(err)) console.warn('[createSale] hasVariants probe failed:', err);
    return false;
  }
}

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

export const createSaleHandler: ActionExecutionHandler = async (params, context, { strapi, notifier }) => {
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
    source = null,
    customerIdentifier = null,
    variantId = null,
    orderId = null
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
    customerIdentifier?: string | null;
    variantId?: string | null;
    orderId?: string | null;
  };

  // Variant first, before anything is written: a sale that names the wrong
  // variant, or no variant for a product sold by variant, writes nothing.
  const variant = variantId ? String(variantId) : null;
  let variantQuant: number | null = null;
  if (variant) {
    const res = await strapi.execute('saleVariantInfo', { id: variant }, context.jwt, context.fetch);
    const v = res?.data?.productVariant?.data?.attributes;
    if (
      !v ||
      String(v.matanot?.data?.id ?? '') !== String(productId) ||
      String(v.project?.data?.id ?? '') !== String(projectId)
    ) {
      throw new ActionError(
        'VARIANT_NOT_FOUND',
        `Variant ${variant} is not a variant of product ${productId} in this rikma`
      );
    }
    variantQuant = v.quant == null ? 0 : Number(v.quant);
  } else if (await productHasVariants(strapi, String(productId), context)) {
    throw new ActionError(
      'VARIANT_REQUIRED',
      `Product ${productId} is sold by variant — the sale has to name the variant`
    );
  }

  const now = new Date().toISOString();
  const reporterId = String(context.userId);
  const holderId = String(userId);
  const isSelf = holderId === reporterId;

  // For the other-holder path we need the project's member list (to validate
  // the claimed holder is actually a rikma member) and restime (to schedule the
  // silence-as-consent timegrama).
  let restime: string | null = null;
  let projectName = '';
  let knownCurrency: string | null = null;
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
    knownCurrency = rikmaCurrency(projAttrs);
  }

  // Typed in the reporter's currency ⇒ stored in the rikma's (PLAN_MULTI_CURRENCY C5).
  const entry = await normalizeEntry({
    amounts: { in: Number(total) },
    entryCurrency: (params as Record<string, unknown>).entryCurrency,
    projectId,
    jwt: context.jwt as string,
    fetchFn: context.fetch as typeof fetch,
    rikmaCurrency: knownCurrency
  });
  const saleIn = entry.values.in ?? Number(total);

  const holderStatus = isSelf ? 'self' : 'open';

  // Recurring engine (PLAN_RECURRING_SALES): an open-ended monthly/yearly sale
  // is a standing order — the monther opens a monthly report cycle for it.
  const isRecurringEngine =
    (kindOf === 'monthly' || kindOf === 'yearly') && !!startDate && !finishDate;

  // Optional customer (PLAN_SALE_CUSTOMER_LINK) — any sale kind may name one.
  // Must resolve to a registered user (exact username or email): the canonical
  // customer↔sale link is a Sheirut intermediary created below, which needs
  // the real user so the purchase shows on their deals page.
  let customerId: string | null = null;
  if ((customerIdentifier as string)?.trim()) {
    const q = (customerIdentifier as string).trim();
    const found = await strapi.execute('mrsFindCustomer', { q }, context.jwt, context.fetch);
    customerId = found?.data?.usersPermissionsUsers?.data?.[0]?.id
      ? String(found.data.usersPermissionsUsers.data[0].id)
      : null;
    if (!customerId) {
      throw new Error(`Customer "${q}" not found - use their exact 1lev1 username or email`);
    }
  }

  // 1. Create the sale record (with reporter + holderStatus).
  const saleVars: Record<string, unknown> = {
    project: projectId,
    matanot: productId,
    users_permissions_user: userId,
    in: saleIn,
    ...entryFields(entry),
    unit: Number(quantity),
    date: saleDate,
    publishedAt: now,
    reporter: reporterId,
    holderStatus
  };
  if (startDate) saleVars.startDate = startDate;
  if (finishDate) saleVars.finishDate = finishDate;
  if (isRecurringEngine) {
    saleVars.recurring = true;
    saleVars.isMonterActive = true;
  }
  // Denormalized pointer for the monthly-cycle queries; the canonical link is
  // the Sheirut intermediary created after the sale record.
  if (customerId) saleVars.customer = customerId;
  if ((note as string)?.trim()) saleVars.note = (note as string).trim();
  // External Sales API: order id for idempotency + provenance tag.
  if ((externalId as string)?.trim()) saleVars.externalId = (externalId as string).trim();
  if (source) saleVars.source = source;

  const saleRes = await strapi.execute('createSaleRecord', saleVars, context.jwt, context.fetch);
  const saleData = saleRes?.data?.createSale?.data;
  if (!saleData?.id) throw new Error('Failed to create sale');
  const saleId = String(saleData.id);

  // 2. Decrement stock if not unlimited (reservation): the variant's when the
  //    sale names one (read above, from the server), else the product's.
  //    "Unlimited" is the `unlimited` flag once it is deployed — a count that
  //    lands on -1 is one unit waiting, not "unlimited" (§2.5, $lib/shop/stock.ts).
  let newQuantity: number | undefined;
  let newVariantQuantity: number | undefined;
  if (Number(quantity) > 0) {
    const stockRun: ProbeRun = (qid, vars) => strapi.execute(qid, vars, context.jwt, context.fetch);
    const pid = String(productId);
    try {
      const flags = await readStockFlags(stockRun, variant ? { variantIds: [variant] } : { productIds: [pid] });
      const fresh = flags.products.get(pid);
      const row: StockFields | null = variant
        ? { quant: variantQuant, unlimited: flags.variants.get(variant)?.unlimited ?? null }
        : fresh
          ? // The product's stock as Strapi holds it now; a legacy row with no
            // number reads as unlimited, as `availableQuantity` always did.
            { quant: fresh.quant ?? (fresh.unlimited === false ? 0 : LEGACY_UNLIMITED), unlimited: fresh.unlimited }
          : Number.isFinite(Number(availableQuantity))
            ? { quant: Number(availableQuantity), unlimited: null }
            : null;
      // May go below zero: a paid order is never refused for stock, and a
      // negative count is the rikma's backlog (§2.5) — the order says `oversold`.
      const next = row && moveStock(row, -Number(quantity));
      if (next) {
        const stored = await writeStock(stockRun, variant ? { variantId: variant } : { productId: pid }, next);
        if (variant) newVariantQuantity = stored.quant;
        else newQuantity = stored.quant;
      }
    } catch (err) {
      console.warn(`[createSale] ${variant ? 'variant ' : ''}quantity update failed:`, err);
    }
  }

  // 2a. The shop links — the variant sold and the order it is a line of. A
  //     separate mutation, so `createSaleRecord` keeps working on a schema
  //     with neither column; after the stock moved and best-effort, because
  //     the sale is already real — a paid order's retry mends a missing link
  //     by the sale's externalId (createPaidOrder) instead of selling twice.
  if (variant || orderId) {
    try {
      await strapi.execute(
        'saleLinkShop',
        { id: saleId, product_variant: variant, order: orderId ? String(orderId) : null },
        context.jwt,
        context.fetch
      );
    } catch (err) {
      console.warn('[createSale] sale↔variant/order link failed:', err);
    }
  }

  // 2b. Customer named → create the Sheirut intermediary, the platform's
  // standard customer↔sale link (PLAN_SALE_CUSTOMER_LINK). It records the
  // purchase on the customer's deals page. A regular sale is reported only
  // once the money moved ("שולם") ⇒ moneyTransfered:true and no customer
  // confirmation; a recurring engine's sheirut is the ongoing standing order
  // whose payment state is settled per monthly cycle instead.
  let sheirutId: string | undefined;
  if (customerId) {
    try {
      const productName = saleData.attributes?.matanot?.data?.attributes?.name ?? '';
      const qty = Number(quantity);
      const sheirutData: Record<string, unknown> = {
        project: projectId,
        users_permissions_users: [customerId],
        matanot: productId,
        sales: [saleId],
        name: productName || 'מכירה',
        price: qty > 0 ? saleIn / qty : saleIn,
        quant: qty,
        total: saleIn,
        oneTime: !isRecurringEngine,
        isApruved: true,
        archived: false,
        moneyTransfered: !isRecurringEngine
      };
      if (startDate) sheirutData.startDate = startDate;
      if (finishDate) sheirutData.finnishDate = finishDate;
      const shRes = await strapi.execute(
        '87createSheirut',
        { data: sheirutData },
        context.jwt,
        context.fetch
      );
      sheirutId = shRes?.data?.createSheirut?.data?.id
        ? String(shRes.data.createSheirut.data.id)
        : undefined;
      if (!sheirutId) console.warn('[createSale] sheirut creation returned no id', shRes);
    } catch (err) {
      console.warn('[createSale] customer sheirut creation failed:', err);
    }
  }

  // 3. Create recurring Monter for open-ended monthly/yearly sales.
  if (isRecurringEngine) {
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
    const decisionName = `${saleData.attributes?.matanot?.data?.attributes?.name ?? 'מכירה'} · ${formatMoney(saleIn, entry.currency, 'he')}`;

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
                he: `דווח שקיבלת ${formatMoney(saleIn, entry.currency, 'he')} ממכירת ${productName}. אפשר לאשר, לדייק (משא-ומתן) או לברר. אם לא תגיב - יאושר אוטומטית בתום זמן התגובה של הרקמה.`,
                en: `It was reported that you hold ${formatMoney(saleIn, entry.currency, 'en')} from the sale of ${productName}. You can approve, refine (negotiate) or discuss. If you don't respond it is auto-approved after the rikma's response time.`
              }
            },
            // The claimed holder's consent is awaited; silence confirms it.
            intent: 'consent',
            subject: () => noticeSubject('decision', decisionId, projectId, 'hachla'),
            subjectText: 'links',
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
    newVariantQuantity,
    matana: saleData,
    holderStatus,
    decisionId,
    sheirutId
  };
};

export const createSaleConfig: ActionConfig = {
  key: 'createSale',
  description:
    'Report a sale. Self-held money → sovereign self-report (holderStatus:self). Money held by someone else → opens a bilateral saleClaim Decision (holderStatus:open) with a restime timegrama and notifies the holder.',
  graphqlOperation: createSaleHandler,
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
    source: { type: 'string', required: false },
    variantId: {
      type: 'string',
      required: false,
      description:
        'The variant sold. Required for a product sold by variant (VARIANT_REQUIRED otherwise); its own stock is the one that moves.'
    },
    orderId: {
      type: 'string',
      required: false,
      description: 'The paid order this sale is one line of (createPaidOrder).'
    },
    entryCurrency: ENTRY_CURRENCY_PARAM,
    customerIdentifier: {
      type: 'string',
      required: false,
      description:
        'Exact 1lev1 username or email of the customer. Links customer↔sale via a Sheirut intermediary; on regular sales this asserts the money already moved (paid), on recurring sales the customer confirms monthly.'
    }
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
  consentSpec: createSaleConsentSpec,

  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        scope('product', p.productId),
        scope('sale', r?.saleId),
        decisionScope('decision', r?.decisionId),
        scope('deal', r?.sheirutId),
      ]),
  },
};
