import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { readStockFlags, withFlag, type StockRowFlags } from '$lib/server/shop/stockFlags.js';
import { recordOrderSales } from '$lib/server/shop/orderSales.js';
import { formatMoney } from '$lib/money/format.js';
import { rikmaCurrency } from '$lib/money/resolve.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import {
  ORDER_SOURCE,
  canResume,
  expiresAtOf,
  orderIsComplete,
  orderNoteOf,
  orderNumberOf,
  orderRefOf,
  planOrder,
  sameOrder,
  storedLinesOf,
  toOrderView,
  type OrderPayload
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
 *
 * `payment: 'arranged'` (PLAN_SHOP_OPERATIONS §5) is the same order with
 * nothing charged yet: the row and its lines are written in `pendingPayment`
 * with an `expiresAt`, and no holder, no sale, no stock move and no value
 * follow until the member who gets the money runs `confirmOrderPayment`.
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
  const arranged = payload.payment === 'arranged';
  // A charge reported under the id of an order still waiting for an arranged
  // payment is not a retry of it — the money for that one is recorded by the
  // member who got it, never by reusing its id.
  if (existing && !arranged && existing.attributes?.status === 'pendingPayment') {
    throw new ActionError(
      'EXTERNAL_ID_CONFLICT',
      `externalId "${payload.externalId}" is an order waiting for an arranged payment — report a charge under its own id`
    );
  }
  // An arranged order is whole once its lines are stored (it has no sales
  // yet); a paid one once every line has its sale.
  const complete = existing
    ? arranged
      ? storedLinesOf(existing).length >= payload.lines.length
      : orderIsComplete(existing, payload.lines.length)
    : false;
  if (existing && complete) {
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
  let oversold = arranged ? false : plan.oversold;
  // Nothing moves the stock until the money arrives, so an arranged order is
  // never oversold *now* — that is measured when it is confirmed.
  const expiresAt = arranged ? expiresAtOf(Date.now(), payload.expiresInHours) : null;
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
        status: arranged ? 'pendingPayment' : 'paid',
        source: ORDER_SOURCE,
        // Whose till took the money — for an arranged order, nobody's yet.
        holder: arranged ? null : holderId,
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
        paidAt: arranged ? null : now,
        ...(arranged ? { expiresAt } : {}),
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

  // An arranged order stops here: no sale, no stock, no value until the member
  // who gets the money says so (`confirmOrderPayment`, PLAN_SHOP_OPERATIONS §5).
  if (arranged) {
    if (notifier && !existing) {
      try {
        await notifier.notify(
          {
            recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
            templates: {
              title: { he: '📞 הזמנה מהאתר — לתאם תשלום', en: '📞 Order from your site — arrange the payment' },
              body: {
                he: `הזמנה ${number} ב-${formatMoney(plan.total, currency, 'he')} מ${payload.buyer.name ?? 'קונה'} באתר של "${projectName}". הקונה ביקש לשלם בתיאום — מי שמתקשר וגובה, מאשר במסך ההזמנות כשהכסף אצלו.`,
                en: `Order ${number} for ${formatMoney(plan.total, currency, 'en')} from ${payload.buyer.name ?? 'a buyer'} on "${projectName}"'s site. The buyer asked to arrange the payment — whoever calls and collects confirms it in the orders screen once the money is with them.`
              }
            },
            intent: 'review',
            metadata: { type: 'arrangedOrder', url: `moach/${projectId}/sales/manage?f=toCollect`, projectName, priority: 'high' }
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
      status: 'pendingPayment',
      expiresAt: existing ? (existing.attributes?.expiresAt ?? null) : expiresAt,
      oversold: false,
      total: plan.total,
      currency,
      lines: plan.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        name: l.nameSnapshot,
        optionLabel: l.optionLabelSnapshot,
        unitPrice: l.unitPrice,
        saleId: null
      })),
      stockChanges: []
    };
  }

  // 6. A sale per line, through `createSale` — `recordOrderSales`, shared
  //    with `confirmOrderPayment`.
  const { saleIdByPosition, stockChanges } = await recordOrderSales(
    {
      projectId,
      orderId,
      externalId: payload.externalId,
      number,
      holderId,
      lines: plan.lines.map((l) => ({
        position: l.position,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        amount: l.lineTotal,
        kindOf: l.kindOf
      })),
      products,
      linkedSales: existing?.attributes?.sales?.data ?? [],
      // On a resume, a sale may exist whose link to the order never landed.
      adoptOrphans: !!existing,
      entryCurrency,
      saleDate: now
    },
    context,
    deps
  );

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
    stockChanges
  };
};

/** A stored order, in the action's result shape. */
function resultOf(view: ReturnType<typeof toOrderView> & {}, id: string | number) {
  return {
    orderId: String(id),
    displayNumber: view.displayNumber,
    orderRef: view.orderRef,
    status: view.status,
    expiresAt: view.expiresAt,
    oversold: view.oversold,
    total: view.total,
    currency: view.currency,
    lines: view.lines
  };
}

export const createPaidOrderConfig: ActionConfig = {
  key: 'createPaidOrder',
  description:
    "Record an order a storefront already charged: an order + lines, and a self-held sale per line through createSale (variant stock, currency). Idempotent and resumable by <rikma>:<externalId>; never refused for stock (oversold is recorded). With payment:'arranged' only the order and its lines are written, in pendingPayment with an expiresAt — no sale and no stock until confirmOrderPayment.",
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
