/**
 * A sale per order line — the one write both ways an order gets paid share
 * (PLAN_SHOP_CUSTOMER_EXPERIENCE §5.4, PLAN_SHOP_OPERATIONS §5):
 *
 *   - `createPaidOrder` — the storefront's provider charged the buyer;
 *   - `confirmOrderPayment` — a member got the money of an arranged order.
 *
 * Every sale goes through `createSale`, the choke point every sale goes
 * through (variant stock, currency conversion, realtime). Each is a sovereign
 * self-report of whoever holds the money (`holderStatus: 'self'`).
 *
 * Idempotent per line by the sale's `externalId` (`<order externalId>:<n>`):
 * a line whose sale is already linked to the order is skipped, and on a resume
 * a sale whose link to the order never landed is adopted and its link mended,
 * never charged twice.
 */
import type { ActionContext } from '$lib/server/actions/types.js';
import { createSaleHandler } from '$lib/server/actions/configs/createSale.js';
import { lineSaleExternalId, ORDER_SOURCE, type StockChange } from '$lib/server/ordersApi.js';

export interface SaleLine {
  position: number;
  productId: string;
  variantId: string | null;
  quantity: number;
  /** What this line's sale records — the line total, or its share of what arrived. */
  amount: number;
  kindOf: string;
}

export interface RecordSalesArgs {
  projectId: string;
  orderId: string;
  /** The order's externalId — each sale's is `<externalId>:<position + 1>`. */
  externalId: string;
  /** What people call the order (its sale note says so). */
  number: string;
  holderId: string;
  lines: SaleLine[];
  /** The product rows the order names (raw `matanot` nodes), for their stock. */
  products: Map<string, any>;
  /** The sales already linked to the order (raw nodes), when resuming. */
  linkedSales: any[];
  /** Look for sales whose link to the order never landed. */
  adoptOrphans: boolean;
  entryCurrency?: string;
  saleDate: string;
}

export interface RecordSalesResult {
  saleIdByPosition: Map<number, string>;
  /** Last stock per variant the sales moved — for `variant.stockChanged`. */
  stockChanges: StockChange[];
}

export async function recordOrderSales(
  args: RecordSalesArgs,
  context: ActionContext,
  deps: any
): Promise<RecordSalesResult> {
  const { strapi } = deps;
  const run = (qid: string, vars: Record<string, unknown>) =>
    strapi.execute(qid, vars, context.jwt, context.fetch);
  const { externalId, orderId, projectId } = args;

  const saleIdByPosition = new Map<number, string>();
  for (const s of args.linkedSales) {
    const ext: string = s?.attributes?.externalId ?? '';
    const n = Number(ext.slice(externalId.length + 1));
    if (ext.startsWith(`${externalId}:`) && Number.isInteger(n) && n > 0) {
      saleIdByPosition.set(n - 1, String(s.id));
    }
  }

  // The product's stock is carried from line to line here (two lines on one
  // product must not both subtract from the same starting number); a
  // variant's is read by `createSale`.
  const stockChanges = new Map<string, StockChange>();
  const productStock = new Map<string, number>();
  for (const [id, node] of args.products) {
    const q = node?.attributes?.quant;
    productStock.set(id, q == null ? -1 : Number(q));
  }

  for (const line of args.lines) {
    if (saleIdByPosition.has(line.position)) continue;
    const saleExternalId = lineSaleExternalId(externalId, line.position);

    if (args.adoptOrphans) {
      const found = await run('saleByExternalId', { pid: projectId, externalId: saleExternalId });
      const orphan = found?.data?.sales?.data?.[0];
      if (orphan?.id) {
        saleIdByPosition.set(line.position, String(orphan.id));
        try {
          await run('saleLinkShop', { id: orphan.id, product_variant: line.variantId, order: orderId });
        } catch (err) {
          console.warn('[orderSales] could not mend the sale↔order link:', err);
        }
        continue;
      }
    }

    const sale: any = await createSaleHandler(
      {
        productId: line.productId,
        projectId,
        userId: args.holderId,
        total: line.amount,
        quantity: line.quantity,
        saleDate: args.saleDate,
        availableQuantity: productStock.get(line.productId) ?? -1,
        kindOf: line.kindOf,
        note: `הזמנה ${args.number}`,
        externalId: saleExternalId,
        source: ORDER_SOURCE,
        entryCurrency: args.entryCurrency,
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

  return { saleIdByPosition, stockChanges: [...stockChanges.values()] };
}
