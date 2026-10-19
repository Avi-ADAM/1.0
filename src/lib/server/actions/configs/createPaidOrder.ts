import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { createSaleHandler } from './createSale.js';
import { readStockFlags, withFlag, type StockRowFlags } from '$lib/server/shop/stockFlags.js';
import { formatMoney } from '$lib/money/format.js';
import { rikmaCurrency } from '$lib/money/resolve.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import {
  ORDER_SOURCE,
  canResume,
  lineSaleExternalId,
  orderIsComplete,
  orderNoteOf,
  orderNumberOf,
  orderRefOf,
  planOrder,
  sameOrder,
  storedLinesOf,
  toOrderView,
  type OrderPayload,
  type StockChange
} from '$lib/server/ordersApi.js';

/**
 * A paid order, reported by a storefront's server after its payment provider
 * confirmed the charge (PLAN_SHOP_CUSTOMER_EXPERIENCE §3.3, §5.4 — S3).
 *
 * One `order` (status `paid`) with an `order-line` per line, and a `Sale` per
 * line through `createSale` — the same choke point every sale goes through, so
 * the variant stock, the currency conversion and the realtime fan-out are the
 * ones every other sale gets. The reporter is the key's owner and the money is
 * with them (the till is theirs), so every sale is a sovereign self-report:
 * `holderStatus: 'self'`, counted at once, nobody else's consent asked.
 *
 * Idempotent by `ref` (`<rikma>:<externalId>`), and **resumable**: Strapi has no
 * transaction over GraphQL, so if a write dies half way, the provider's retry
 * lands here again, finds the order, and writes only the lines and sales that
 * are missing. Every decision is taken before the first write (`planOrder`),
 * so a refusal never leaves half an order behind.
 *
 * Never refused for stock — the buyer has paid. Short stock is `oversold` on
 * the order and in the members' notification.
 */
const handler: ActionExecutionHandler = async (params, context, deps) => {
  const { strapi, notifier } = deps;
  const projectId = String(params.projectId);
  const payload = params.order as OrderPayload;
  const ref = orderRefOf(projectId, payload.externalId);
  const run = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);

  // 1. Has this charge been reported before? A finished order answers at once.
  const existingRes = await run('rikmaApiOrderByRef', { pid: projectId, ref });
  const existing = existingRes?.data?.orders?.data?.[0] ?? null;
  const conflict = () =>
    new ActionError(
      'EXTERNAL_ID_CONFLICT',
      `externalId "${payload.externalId}" was already reported with different lines, total or currency`
    );
  const storedCurrency: string | null = existing?.attributes?.currencyCode ?? null;
  if (existing && orderIsComplete(existing, payload.lines.length)) {
    if (!sameOrder(payload, { currency: storedCurrency, lines: storedLinesOf(existing) })) {
      throw conflict();
    }
    return { ...resultOf(toOrderView(existing)!, existing.id), duplicated: true };
  }

  // 2. Read what the order names — from the server, fenced to this rikma.
  const productIds = [...new Set(payload.lines.map((l) => l.productId))];
  const variantIds = [
    ...new Set(payload.lines.map((l) => l.variantId).filter((v): v is string => !!v))
  ];
  const [projectRes, productsRes, variantsRes, flags] = await Promise.all([
    run('ordersApiProject', { pid: projectId }),
    run('ordersApiProducts', { pid: projectId, ids: productIds }),
    variantIds.length
      ? run('ordersApiVariants', { pid: projectId, ids: variantIds })
      : Promise.resolve(null),
    // The `unlimited` flag beside each row, once deployed — so a variant
    // oversold to -1 is not read as unlimited by the next order (§2.5).
    readStockFlags(run, { productIds, variantIds })
  ]);
  const flagged = (n: any, f: StockRowFlags | undefined) => ({ ...n, attributes: withFlag(n.attributes, f) });
  const products = new Map<string, any>(
    (productsRes?.data?.matanots?.data ?? []).map((n: any) => [String(n.id), flagged(n, flags.products.get(String(n.id)))])
  );
  const variants = new Map<string, any>(
    (variantsRes?.data?.productVariants?.data ?? []).map((n: any) => [String(n.id), flagged(n, flags.variants.get(String(n.id)))])
  );

  // 3. Decide everything before writing anything.
  const plan = planOrder({ payload, products, variants });
  if (plan.ok === false) {
    throw new ActionError(plan.code, plan.message, { line: plan.line, status: plan.status });
  }

  // A half-written order is resumed only if it is *this* order: every line
  // already stored matches this request's line at its position, and the total
  // recorded first matches this plan (which is what catches an added line).
  if (existing) {
    const storedTotal = existing.attributes?.total;
    const resumable = canResume(
      payload,
      {
        currency: storedCurrency,
        total: storedTotal == null ? null : Number(storedTotal),
        lines: storedLinesOf(existing)
      },
      plan.total
    );
    if (!resumable) throw conflict();
  }

  const projectAttrs = projectRes?.data?.project?.data?.attributes ?? {};
  const ownCurrency = rikmaCurrency(projectAttrs);
  const currency = payload.currency ?? ownCurrency;
  // Only a foreign currency is an "entry" to convert (PLAN_MULTI_CURRENCY);
  // naming the rikma's own would make every line re-read it for nothing.
  const entryCurrency = currency !== ownCurrency ? currency : undefined;
  const projectName: string = projectAttrs.projectName ?? '';
  const now = new Date().toISOString();
  const holderId = String(context.userId);

  // 4. The order row (unless a previous attempt already wrote it).
  let orderId: string;
  // On a resume the stock already moved for the lines that got their sales, so
  // a fresh plan would call them oversold; the first attempt's verdict stands.
  let oversold = plan.oversold;
  if (existing) {
    orderId = String(existing.id);
    oversold = existing.attributes?.oversold === true;
  } else {
    const delivery = payload.delivery;
    const created = await run('rikmaApiOrderCreate', {
      data: {
        ref,
        externalId: payload.externalId,
        displayNumber: payload.displayNumber,
        project: projectId,
        status: 'paid',
        source: ORDER_SOURCE,
        holder: holderId,
        buyerName: payload.buyer.name,
        buyerEmail: payload.buyer.email,
        buyerPhone: payload.buyer.phone,
        note: orderNoteOf(payload.note, plan.notes),
        deliveryPreference: delivery.preference,
        deliveryAddress: delivery.address,
        currencyCode: currency,
        total: plan.total,
        locale: payload.locale,
        paymentRef: payload.paymentRef,
        paymentMethod: payload.paymentMethod,
        paidAt: now,
        oversold
      }
    });
    const id = created?.data?.createOrder?.data?.id;
    if (!id) throw new Error('Failed to create the order');
    orderId = String(id);
  }
  // What people say out loud — the storefront's number, else ours. A resume
  // keeps the number the first attempt stored.
  const displayNumber: string | null = existing
    ? (existing.attributes?.displayNumber ?? null)
    : payload.displayNumber;
  const number = orderNumberOf(displayNumber, orderId);

  // 5. The lines that are not there yet.
  const storedPositions = new Set(
    existing ? storedLinesOf(existing).map((l: any) => Number(l.position)) : []
  );
  for (const line of plan.lines) {
    if (storedPositions.has(line.position)) continue;
    await run('rikmaApiOrderLineCreate', {
      data: {
        order: orderId,
        matanot: line.productId,
        variant: line.variantId,
        nameSnapshot: line.nameSnapshot,
        optionLabelSnapshot: line.optionLabelSnapshot,
        skuSnapshot: line.skuSnapshot,
        imageUrlSnapshot: line.imageUrlSnapshot,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        currencyCode: currency,
        lineTotal: line.lineTotal,
        note: line.note,
        position: line.position
      }
    });
  }

  // 6. A sale per line, through `createSale`. The product's stock is carried
  //    from line to line here (two lines on one product must not both subtract
  //    from the same starting number); a variant's is read by `createSale`.
  const saleIdByPosition = new Map<number, string>();
  for (const s of existing?.attributes?.sales?.data ?? []) {
    const ext: string = s?.attributes?.externalId ?? '';
    const n = Number(ext.slice(payload.externalId.length + 1));
    if (ext.startsWith(`${payload.externalId}:`) && Number.isInteger(n) && n > 0) {
      saleIdByPosition.set(n - 1, String(s.id));
    }
  }
  // Last stock per variant this order moved — for `variant.stockChanged`.
  const stockChanges = new Map<string, StockChange>();
  const productStock = new Map<string, number>();
  for (const [id, node] of products) {
    const q = node?.attributes?.quant;
    productStock.set(id, q == null ? -1 : Number(q));
  }
  for (const line of plan.lines) {
    if (saleIdByPosition.has(line.position)) continue;
    const saleExternalId = lineSaleExternalId(payload.externalId, line.position);

    // On a resume, a sale may exist whose link to the order never landed —
    // adopt it (and mend the link) rather than charging the line twice.
    if (existing) {
      const found = await run('saleByExternalId', { pid: projectId, externalId: saleExternalId });
      const orphan = found?.data?.sales?.data?.[0];
      if (orphan?.id) {
        saleIdByPosition.set(line.position, String(orphan.id));
        try {
          await run('saleLinkShop', { id: orphan.id, product_variant: line.variantId, order: orderId });
        } catch (err) {
          console.warn('[createPaidOrder] could not mend the sale↔order link:', err);
        }
        continue;
      }
    }

    const sale: any = await createSaleHandler(
      {
        productId: line.productId,
        projectId,
        userId: holderId,
        total: line.lineTotal,
        quantity: line.quantity,
        saleDate: now,
        availableQuantity: productStock.get(line.productId) ?? -1,
        kindOf: line.kindOf,
        note: `הזמנה ${number}`,
        externalId: saleExternalId,
        source: ORDER_SOURCE,
        entryCurrency,
        variantId: line.variantId,
        orderId
      },
      context,
      deps
    );
    if (!sale?.saleId) throw new Error(`Failed to record the sale for line ${line.position}`);
    saleIdByPosition.set(line.position, String(sale.saleId));
    if (line.variantId && typeof sale.newVariantQuantity === 'number') {
      stockChanges.set(`v:${line.variantId}`, {
        productId: line.productId,
        variantId: line.variantId,
        quant: sale.newVariantQuantity,
        unlimited: false
      });
    }
    if (!line.variantId && typeof sale.newQuantity === 'number') {
      productStock.set(line.productId, sale.newQuantity);
    } else if (!line.variantId) {
      const before = productStock.get(line.productId) ?? -1;
      if (before !== -1) productStock.set(line.productId, before - line.quantity);
    }
  }

  // 7. Tell the rikma — a new order to ship, and loudly if it was oversold.
  //    Wording: UX_COPY_SHOP_SALES §10.1 — "from your site" (in Hebrew a bare
  //    הזמנה is also an invitation), the order's number, items not lines.
  if (notifier && !existing) {
    try {
      const amount = formatMoney(plan.total, currency, 'he');
      const amountEn = formatMoney(plan.total, currency, 'en');
      // Units when they are whole; a line sold by the kilo makes "3.5 items"
      // nonsense, so then the count is of lines.
      const whole = plan.lines.every((l) => Number.isInteger(l.quantity));
      const items = whole ? plan.lines.reduce((s, l) => s + l.quantity, 0) : plan.lines.length;
      const short = plan.lines.reduce((s, l) => s + l.shortBy, 0);
      const itemsHe = items === 1 ? 'פריט אחד' : `${items} פריטים`;
      const itemsEn = items === 1 ? '1 item' : `${items} items`;
      const shortHe = short === 1 ? 'חסרה יחידה אחת' : `חסרות ${short} יחידות`;
      const shortEn = short === 1 ? '1 unit is missing' : `${short} units are missing`;
      await notifier.notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
          templates: {
            title: oversold
              ? { he: '🛒 הזמנה מהאתר — חסר במלאי', en: '🛒 Order from your site — short on stock' }
              : { he: '🛒 הזמנה חדשה מהאתר', en: '🛒 New order from your site' },
            body: {
              he: `הזמנה ${number} ב-${amount}, ${itemsHe}, שולמה באתר של "${projectName}".${oversold ? ` ${shortHe}. אפשר להכין אותן או לתאם עם הקונה מועד אחר.` : ''}`,
              en: `Order ${number} for ${amountEn}, ${itemsEn}, was paid on "${projectName}"'s site.${oversold ? ` ${shortEn}. You can make them or agree a later date with the buyer.` : ''}`
            }
          },
          intent: oversold ? 'review' : 'outcome',
          metadata: { type: 'paidOrder', url: `moach/${projectId}/sales`, projectName, priority: oversold ? 'high' : 'normal' }
        },
        { projectId },
        null,
        context
      );
    } catch (err) {
      console.warn('[createPaidOrder] notification failed:', err);
    }
  }

  return {
    duplicated: false,
    orderId,
    displayNumber,
    orderRef: ref,
    status: 'paid',
    oversold,
    total: plan.total,
    currency,
    lines: plan.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      name: l.nameSnapshot,
      optionLabel: l.optionLabelSnapshot,
      unitPrice: l.unitPrice,
      saleId: saleIdByPosition.get(l.position) ?? null
    })),
    stockChanges: [...stockChanges.values()]
  };
};

/** A stored order, in the action's result shape. */
function resultOf(view: ReturnType<typeof toOrderView> & {}, id: string | number) {
  return {
    orderId: String(id),
    displayNumber: view.displayNumber,
    orderRef: view.orderRef,
    status: view.status,
    oversold: view.oversold,
    total: view.total,
    currency: view.currency,
    lines: view.lines
  };
}

export const createPaidOrderConfig: ActionConfig = {
  key: 'createPaidOrder',
  description:
    "Record an order a storefront already charged: an order + lines, and a self-held sale per line through createSale (variant stock, currency). Idempotent and resumable by <rikma>:<externalId>; never refused for stock (oversold is recorded).",
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    order: {
      type: 'object',
      required: true,
      description: 'A validated OrderPayload (validateOrderPayload in $lib/server/ordersApi).'
    }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to record an order' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can record orders'
    }
  ],
  realtime: {
    scopes: (p, r) =>
      scopeList([
        scope('project', p.projectId),
        ...((r?.lines ?? r?.data?.lines ?? []) as any[]).flatMap((l) => [
          scope('product', l.productId),
          scope('sale', l.saleId)
        ])
      ])
  }
};
