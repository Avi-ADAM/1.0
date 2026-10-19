import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { scope, scopeList } from '$lib/realtime/scopes.js';
import { formatMoney } from '$lib/money/format.js';
import { rikmaCurrency } from '$lib/money/resolve.js';
import { readStockFlags, withFlag, type StockRowFlags } from '$lib/server/shop/stockFlags.js';
import { recordOrderSales } from '$lib/server/shop/orderSales.js';
import {
  ARRANGED_METHODS,
  arrangedMethodOf,
  arrangedNoteOf,
  orderNoteOf,
  orderNumberOf,
  planOrder,
  splitReceived,
  storedLinesOf,
  transitionOf,
  type OrderPayload
} from '$lib/server/ordersApi.js';

/**
 * "The payment arrived" — for an order the buyer asked to pay by arrangement
 * (PLAN_SHOP_OPERATIONS §5.2). Nothing was charged when the order came in; a
 * member called, and the money reached them by bit, transfer or cash.
 *
 * The member who runs this **is** the money's holder — and only they may: a
 * member who sees that the buyer paid someone else asks that person to
 * confirm, because saying so for them is a claim about their money (§5.2,
 * rule 2 — the rule `cancelOrder` keeps with `NOT_HOLDER`). So the first
 * write stamps the holder, and a second member trying to confirm the same
 * order is refused.
 *
 * Then exactly what a paid order gets: a self-held sale per line through
 * `createSale` (`recordOrderSales`), the stock moves, `oversold` is measured
 * against the stock as it is now. What arrived is what is recorded (rule 3):
 * a discount given on the phone is spread over the lines, and the order says
 * it was sold under the catalog price (H8).
 *
 * Retry-safe: the holder first, the sales (idempotent by externalId, an
 * orphan adopted) second, the status last — a confirm that died half way and
 * is sent again by the same member finishes it without selling a line twice.
 */
const handler: ActionExecutionHandler = async (params, context, deps) => {
  const { strapi, notifier } = deps;
  const projectId = String(params.projectId);
  const orderRef = String(params.orderRef);
  const actorId = String(context.userId);
  const run = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);

  const method = arrangedMethodOf(params.method);
  if (!method) {
    throw new ActionError('VALIDATION_FAILED', `method must be one of ${ARRANGED_METHODS.join(', ')}`);
  }
  const note =
    typeof params.note === 'string' && params.note.trim() ? params.note.trim().slice(0, 300) : null;

  const res = await run('rikmaApiOrderByRef', { pid: projectId, ref: orderRef });
  const node = res?.data?.orders?.data?.[0];
  if (!node?.id) throw new ActionError('NOT_FOUND', `No order ${orderRef} in this rikma`);
  const a = node.attributes ?? {};
  const orderId = String(node.id);
  const number = orderNumberOf(a.displayNumber, node.id);
  const holderId = a.holder?.data?.id != null ? String(a.holder.data.id) : null;

  if (holderId && holderId !== actorId) {
    throw new ActionError(
      'NOT_HOLDER',
      'Another member already recorded the payment of this order as theirs — ask them in the rikma'
    );
  }
  const t = transitionOf(a.status, 'paid');
  if (t.kind === 'same' || (t.kind === 'refused' && a.status !== 'cancelled' && holderId === actorId)) {
    // Already paid (or shipped / delivered since): asking twice changes nothing.
    return { orderRef, orderId, status: a.status ?? 'paid', changed: false, stockChanges: [] };
  }
  if (t.kind === 'refused') throw new ActionError(t.code, t.message);

  const externalId: string = a.externalId ?? '';
  if (!externalId) throw new Error(`Order ${orderRef} has no externalId`);
  const stored = [...storedLinesOf(node)].sort((x: any, y: any) => (x.position ?? 0) - (y.position ?? 0));
  if (!stored.length) throw new Error(`Order ${orderRef} has no lines`);

  // What the order asked for, at the catalog's prices it was taken at.
  const lineTotals = stored.map((l: any) => Math.round(Number(l.unitPrice ?? 0) * Number(l.quantity ?? 0) * 100) / 100);
  const subtotal = lineTotals.reduce((s: number, n: number) => s + n, 0);
  const askedTotal = a.total == null ? subtotal : Number(a.total);
  const fee = Math.max(0, Math.round((askedTotal - subtotal) * 100) / 100);
  const received = params.amount == null || params.amount === '' ? askedTotal : Number(params.amount);
  if (!Number.isFinite(received) || received < 0) {
    throw new ActionError('VALIDATION_FAILED', 'amount must be a number ≥ 0 — what actually arrived');
  }
  const split = splitReceived(received, lineTotals, fee);

  // The rows as they are now — the stock is measured at the moment the money arrived.
  const productIds = [...new Set(stored.map((l: any) => String(l.productId)))] as string[];
  const variantIds = [...new Set(stored.map((l: any) => l.variantId).filter(Boolean))] as string[];
  const [projectRes, productsRes, variantsRes, flags] = await Promise.all([
    run('ordersApiProject', { pid: projectId }),
    run('ordersApiProducts', { pid: projectId, ids: productIds }),
    variantIds.length ? run('ordersApiVariants', { pid: projectId, ids: variantIds }) : Promise.resolve(null),
    readStockFlags(run, { productIds, variantIds })
  ]);
  const flagged = (n: any, f: StockRowFlags | undefined) => ({ ...n, attributes: withFlag(n.attributes, f) });
  const products = new Map<string, any>(
    (productsRes?.data?.matanots?.data ?? []).map((n: any) => [String(n.id), flagged(n, flags.products.get(String(n.id)))])
  );
  const variants = new Map<string, any>(
    (variantsRes?.data?.productVariants?.data ?? []).map((n: any) => [String(n.id), flagged(n, flags.variants.get(String(n.id)))])
  );
  const payload: OrderPayload = {
    externalId,
    payment: 'paid',
    expiresInHours: null,
    displayNumber: null,
    paymentRef: null,
    paymentMethod: null,
    amount: null,
    currency: null,
    buyer: { name: null, email: null, phone: null },
    delivery: { preference: null, address: null, fee },
    note: null,
    locale: null,
    lines: stored.map((l: any) => ({
      productId: String(l.productId),
      variantId: l.variantId ?? null,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      note: null
    }))
  };
  const plan = planOrder({ payload, products, variants });
  if (plan.ok === false) {
    // A product taken off the shop since the order came in. The money is real,
    // so it is never lost — but it is recorded by hand, on the sales screen.
    throw new ActionError(plan.code, `${plan.message} — record this payment as a sale on the sales screen`);
  }

  const projectAttrs = projectRes?.data?.project?.data?.attributes ?? {};
  const ownCurrency = rikmaCurrency(projectAttrs);
  const currency: string = a.currencyCode ?? ownCurrency;
  const entryCurrency = currency !== ownCurrency ? currency : undefined;
  const now = new Date().toISOString();

  // 1. The holder — the money is with whoever confirms, and from here on only
  //    they may finish (or refund) this order.
  if (!holderId) {
    await run('rikmaApiOrderUpdate', { id: orderId, data: { holder: actorId, paymentMethod: method } });
  }

  // 2. A sale per line, with its share of what arrived.
  const { saleIdByPosition, stockChanges } = await recordOrderSales(
    {
      projectId,
      orderId,
      externalId,
      number,
      holderId: actorId,
      lines: plan.lines.map((l, i) => ({
        position: l.position,
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        amount: split.amounts[i],
        kindOf: l.kindOf
      })),
      products,
      linkedSales: a.sales?.data ?? [],
      adoptOrphans: !!holderId,
      entryCurrency,
      saleDate: now
    },
    context,
    deps
  );

  // 3. The status, last.
  await run('rikmaApiOrderUpdate', {
    id: orderId,
    data: {
      status: 'paid',
      paidAt: now,
      paymentMethod: method,
      total: split.received,
      oversold: plan.oversold,
      note: orderNoteOf(a.note ?? null, [arrangedNoteOf(split, method, note), ...plan.notes])
    }
  });

  // 4. Tell the rikma — it can be packed now.
  if (notifier) {
    try {
      const amountHe = formatMoney(split.received, currency, 'he');
      const amountEn = formatMoney(split.received, currency, 'en');
      await notifier.notify(
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId' } },
          templates: {
            title: { he: '💰 התשלום על הזמנה התקבל', en: '💰 An order was paid' },
            body: {
              he: `התשלום על הזמנה ${number} התקבל (${amountHe}) — אפשר להכין ולשלוח.${split.under ? ' התקבל פחות ממחיר הקטלוג.' : ''}`,
              en: `Order ${number} was paid (${amountEn}) — it can be packed and sent.${split.under ? ' Less than the catalog price arrived.' : ''}`
            }
          },
          intent: 'outcome',
          metadata: { type: 'paidOrder', url: `moach/${projectId}/sales/manage`, priority: 'normal' }
        },
        { projectId },
        null,
        context
      );
    } catch (err) {
      console.warn('[confirmOrderPayment] notification failed:', err);
    }
  }

  return {
    orderRef,
    orderId,
    status: 'paid',
    changed: true,
    oversold: plan.oversold,
    total: split.received,
    catalogTotal: split.catalogTotal,
    underCatalog: split.under,
    currency,
    lines: plan.lines.map((l, i) => ({
      productId: l.productId,
      variantId: l.variantId,
      quantity: l.quantity,
      amount: split.amounts[i],
      saleId: saleIdByPosition.get(l.position) ?? null
    })),
    stockChanges
  };
};

export const confirmOrderPaymentConfig: ActionConfig = {
  key: 'confirmOrderPayment',
  description:
    'Record that the payment of an arranged order (pendingPayment) reached me: I become its holder, a self-held sale per line with its share of what arrived, stock moves, the order becomes paid. Retry-safe; refused for a second member (NOT_HOLDER).',
  graphqlOperation: handler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    orderRef: { type: 'string', required: true, description: '`<rikma>:<externalId>`' },
    method: { type: 'string', required: true, description: ARRANGED_METHODS.join(' | ') },
    amount: { type: 'number', required: false, description: 'What arrived. Default: the order total.' },
    note: { type: 'string', required: false }
  },
  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to record a payment' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only rikma members can record a payment'
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
